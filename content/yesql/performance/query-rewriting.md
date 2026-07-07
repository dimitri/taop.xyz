+++
title = "Query Rewriting and Anti-Patterns"
weight = 30
summary = "Small SQL changes can have large performance effects. The most common slow queries share a recognizable EXPLAIN signature and a mechanical fix."
tags = ["performance", "anti-patterns", "index", "pagination", "EXPLAIN", "PostgreSQL"]
course_title = "Query Optimization"
course_url = "/course/"
cta_eyebrow = "Keep going"
cta_title = "Query Optimization"
cta_body = "Anti-patterns are one chapter. The course covers the full cost model, row estimate diagnostics, join rewriting, CTE optimization fences, and a complete index selection strategy."
cta_url = "/course/"
cta_label = "Explore the Course"
lab_datasets = "f1db"
+++

Some slow queries are not exotic at all — they are the same handful of
mistakes, written daily in every codebase. Each one has a recognizable
`EXPLAIN` signature and a mechanical fix.

### Non-sargable predicates: functions that hide columns from indexes

The most expensive mistake is also the most innocent-looking: wrapping an
indexed column in a function call. An index on `name` stores `name` values
in sorted order. A predicate on `lower(name)` asks about values the index
has never seen — so it might as well not exist.

```sql
-- An index exists on geoname.geoname(name)
explain (analyze, buffers)
select name, population
  from geoname.geoname
 where lower(name) = 'paris';
```

```
 Seq Scan on geoname  (cost=0.00..3165.07 rows=57 width=38)
                      (actual time=0.043..33.5 rows=7 loops=1)
   Filter: (lower((name)::text) = 'paris')
   Rows Removed by Filter: 115064
```

The index on `name` is ignored. The planner evaluates `lower(name)` for all
115,071 rows and discards the ones that don't match — 115,064 of them.

The sargable version compares the bare column directly:

```sql
explain (analyze, buffers)
select name, population
  from geoname.geoname
 where name = 'Paris';
```

```
 Index Scan using geoname_name_idx on geoname  (cost=0.42..8.45 rows=1 width=38)
                                                (actual time=0.084..0.086 rows=1 loops=1)
   Index Cond: ((name)::text = 'Paris')
   Buffers: shared hit=4
```

One B-tree descent, four buffer pages, under a millisecond. The same logical
question answered three orders of magnitude faster.

When case-insensitive search is the requirement and the query cannot change,
move the function into the index instead:

```sql
create index geoname_name_lower on geoname.geoname (lower(name));
```

The expression index stores the computed `lower(name)` values directly. The
unchanged `lower(name) = 'paris'` predicate now matches what the index
contains, and the planner uses it.

The same pattern appears in quieter variants: implicit casts
(`varchar_col = 123` casts the *column*, not the literal), date truncation
(`date_trunc('month', created_at) = '2024-01-01'`), and leading-wildcard
`LIKE '%term'` (no prefix for the B-tree to descend on). All produce the
same signature: an index that exists and a Seq Scan that ignores it.

### OFFSET pagination: doing the work and throwing it away

`OFFSET` reads as "skip N rows" but executes as "produce N rows and discard
them." Every page deeper into the result costs more than the one before.

```sql
-- Page 5001 of a sorted geoname catalogue
explain (analyze, buffers)
select geonameid, name
  from geoname.geoname
 order by geonameid
 limit 20 offset 100000;
```

```
 Limit  (cost=9042.32..9044.13 rows=20 width=22)
        (actual time=33.487..33.493 rows=20 loops=1)
   Buffers: shared hit=62625
   ->  Index Scan using geoname_pkey on geoname
         (actual time=0.024..29.308 rows=100020 loops=1)
         Buffers: shared hit=62625
```

The index scan produces 100,020 rows so the `Limit` node can throw away
100,000 of them. 62,625 buffer pages touched — every page up to position
100,020 — to return 20 rows. Page 1 of the same query touches fewer than 10
pages. The cost grows linearly with offset depth.

**Keyset pagination** eliminates this. The application remembers the last key
it displayed and asks for what comes next:

```sql
explain (analyze, buffers)
select geonameid, name
  from geoname.geoname
 where geonameid > 10150618      -- last key seen on the previous page
 order by geonameid
 limit 20;
```

```
 Limit  (cost=0.42..10.14 rows=20 width=22)
        (actual time=0.084..0.113 rows=20 loops=1)
   Buffers: shared hit=9 read=1
   ->  Index Scan using geoname_pkey on geoname
         Index Cond: (geonameid > 10150618)
```

Ten buffer pages. 0.1 ms. Page 5,001 of results costs exactly what page 1
costs. The index descends directly to the first row after the last key and
reads forward.

The honest trade-off: keyset pagination cannot jump to an arbitrary page
number, only walk forward or backward from a known key. Most pagination
interfaces never needed random page access anyway — and the ones that do
typically aggregate (page count, total results) rather than seek to page N
arbitrarily.

### Predicate pushdown and join order

PostgreSQL's planner pushes `WHERE` predicates as close to the data source as
possible automatically. The main case where it cannot do this is an explicit
`MATERIALIZED` CTE, which acts as an optimization fence: the CTE executes as
a separate step, and the planner cannot push predicates from the outer query
into it.

```sql
-- PostgreSQL 12+: CTEs are inlined by default
-- The planner treats this as a plain subquery and pushes year = 2017 inward
explain (analyze, buffers)
select r.name, r.date, d.surname as winner
  from f1db.races   r
  join f1db.results res on res.raceid    = r.raceid
                       and res.positionorder = 1
  join f1db.drivers d   on d.driverid   = res.driverid
 where r.year = 2017;
```

```
 Nested Loop  (cost=36.73..754.05 rows=20)
              (actual time=1.236..1.254 rows=11 loops=1)
   Buffers: shared hit=469
   ->  Hash Join  (cost=36.45..745.97 rows=20) ...
         ->  Seq Scan on results res  (actual rows=970 loops=1)
               Filter: (positionorder = 1)
               Rows Removed by Filter: 22627
         ->  Seq Scan on races r  (actual rows=20 loops=1)
               Filter: (year = 2017)
               Rows Removed by Filter: 956
   ->  Index Scan on drivers d (loops=11)
 Execution Time: 1.303 ms
```

The `year = 2017` filter applies directly on the `races` scan — 976 rows
fetched, 956 discarded, 20 proceed. That small inner hash table (20 rows)
makes the subsequent Hash Join cheap.

If you wrap the races filter in `WITH races_2017 AS MATERIALIZED (...)`, the
planner runs it as a separate full scan and stores the result, then joins. The
total cost increases even though the SQL expresses the same intent. Use
`MATERIALIZED` deliberately, when you want the CTE to run once regardless of
how many times it's referenced — not as a way to organize complex SQL.

### SELECT * and row width

`SELECT *` is not a style problem, it is a *width* problem. Every selected
column travels through every plan node: sorts, hash tables, and the network.

Compare `width=` in the plan for the same aggregation with and without the
wide columns. In a hashtag analysis query:

```
-- SELECT *  from results join:  width=138  (all columns including text payloads)
-- SELECT needed columns only:   width=24   (just driverid and points)
```

Width affects sort memory (`Sort Method: external merge` vs `quicksort`),
hash batch count (`Batches > 1` when hash table exceeds `work_mem`), and
network transfer. When a node already does expensive work — a sort over
millions of rows — carrying unnecessary columns through it multiplies the
cost.

The fix is mechanical: select only the columns the caller needs. In code that
builds queries dynamically (ORMs, report builders), the habit of `SELECT *`
often hides in the abstraction layer rather than the SQL string.

### EXISTS vs IN for subqueries

`NOT IN (subquery)` has a correctness trap: if the subquery returns any
`NULL`, the result is an empty set — all rows are excluded silently.
`NOT EXISTS` does not have this behaviour. Prefer anti-joins with
`NOT EXISTS`:

```sql
-- Dangerous: if any race has raceid IS NULL (unlikely but possible after
-- a bad import), this returns zero rows instead of the expected set
select driverid from f1db.results
 where raceid not in (select raceid from f1db.races where year = 2017);

-- Safe: NULL in races.raceid does not affect outer result
select driverid from f1db.results r
 where not exists (
   select 1 from f1db.races ra
    where ra.raceid = r.raceid
      and ra.year = 2017
 );
```

PostgreSQL often rewrites correlated `EXISTS` subqueries into semi-joins
automatically, so performance is usually equivalent. The correctness
difference, however, is not automatic — the `NOT IN` trap silently returns
wrong results, and there is no plan node to warn you.
