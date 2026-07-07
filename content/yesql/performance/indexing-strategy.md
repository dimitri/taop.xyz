+++
title = "An Indexing Strategy"
weight = 20
summary = "Indexes follow from your queries, not your tables. An index is a named trade: faster reads in exchange for slower writes. Only make trades you can justify."
tags = ["Indexing", "Performance", "EXPLAIN", "B-tree", "GIN", "BRIN", "partial index"]
book_chapter = "Chapter 9, Indexing Strategy"
course_title = "Query Optimization"
course_url = "/course/"
cta_eyebrow = "Keep going"
cta_title = "Query Optimization"
cta_body = "Indexing strategy is one chapter. The course covers the full cost model, row estimate diagnostics, query rewriting, common anti-patterns, and index maintenance under load."
cta_url = "/course/"
cta_label = "Explore the Course"
lab_datasets = "f1db"
+++

The most common mistake is treating indexing as a data-modeling step: draw
your tables, then sprinkle indexes on the columns that "look important." That
gets it backwards. An index exists to make a *query* faster, and you don't
know which queries you run until you've written them. Indexing is a developer
activity, downstream of your SQL — not a schema decoration.

PostgreSQL creates exactly two kinds of index on its own: the ones it needs
for correctness. A `PRIMARY KEY`, `UNIQUE`, or `EXCLUDE USING` constraint each
requires a backing index, because that's how PostgreSQL enforces the constraint
against concurrent transactions. Everything else is yours to decide.

### The write-side cost

An index is duplicated data kept in sync with the table — transactionally.
Every `INSERT` updates every index on the table; every `UPDATE` that touches
an indexed column does too (PostgreSQL's HOT mechanism spares only updates
that avoid all indexed columns). A table with eight indexes pays roughly eight
extra writes per inserted row — write amplification that shows up as slower
ingestion, more WAL, and more vacuum work.

The discipline that follows: index for the queries you actually run, audit
`pg_stat_user_indexes.idx_scan` for indexes nothing uses, and treat each
`CREATE INDEX` as a trade you can name — *this read path*, paid for by *that
write overhead*.

### Index types

PostgreSQL supports five index types, each suited to a different class of
queries. The f1db schema uses B-tree everywhere — all indexes in f1db are
B-tree except the circuits GiST spatial index:

```sql
select i.relname        as index_name,
       t.relname        as table_name,
       am.amname        as index_type,
       pg_size_pretty(pg_relation_size(i.oid)) as index_size
  from pg_index ix
  join pg_class    i on i.oid = ix.indexrelid
  join pg_class    t on t.oid = ix.indrelid
  join pg_am      am on am.oid = i.relam
  join pg_namespace n on n.oid = t.relnamespace
 where n.nspname = 'f1db'
 order by t.relname, i.relname;
```

```
      index_name       │      table_name      │ index_type │ index_size
═══════════════════════╪══════════════════════╪════════════╪════════════
 circuits_position_idx │ circuits             │ gist       │ 8192 bytes
 idx_49472_primary     │ circuits             │ btree      │ 16 kB
 idx_49535_primary     │ laptimes             │ btree      │ 16 MB
 idx_49535_raceid      │ laptimes             │ btree      │ 2968 kB
 idx_49569_primary     │ results              │ btree      │ 536 kB
 ...
```

**B-tree** (default) handles equality, range, and sorting: `=`, `<`, `>`,
`BETWEEN`, `IN`, `IS NULL`. It stores values in sorted order, so it can
satisfy `ORDER BY` without a separate Sort node. Use B-tree for almost
everything.

**Hash** handles only `=`. Faster than B-tree for pure equality at scale,
but useless for range queries or sorting. Crash-safe since PostgreSQL 10.

**GiST** handles geometric types, ranges, and full-text with custom operators:
overlap (`&&`), containment (`@>`), nearest-neighbor distance (`<->`). Use it
when B-tree operators are insufficient — the band membership exclusion
constraint in the [range types lesson](/yesql/data-schema-design/range-types/)
uses a GiST index.

**GIN** (Generalized Inverted Index) is optimized for types whose values
contain multiple components: arrays, JSONB documents, `tsvector` full-text.
One index entry per element, fast for containment (`@>`, `@@`). The hashtag
and JSONB examples in the [JSONB lesson](/yesql/data-schema-design/json-and-denormalized-types/)
use GIN indexes.

**BRIN** (Block Range INdex) stores min/max values per block range. It is
tiny — a few kilobytes even for billion-row tables — and is effective only
when rows are physically ordered by the indexed column, as with timestamps or
monotone IDs in append-heavy tables. For tables where `id` increases
monotonically, a BRIN index on `id` costs almost nothing and can replace a
B-tree for range scans.

### Selectivity: when does the planner choose an index?

The planner weighs sequential scan cost against index scan cost. A sequential
scan reads the table top to bottom — cheap per page, cost proportional to
table size. An index scan follows pointers from the B-tree to random heap
locations — fast for selective queries, expensive when many rows match (each
pointer is a random read).

The crossover threshold is roughly 5–20% of rows depending on `random_page_cost`.
On SSDs, lowering `random_page_cost` from 4.0 toward 1.0 makes the planner
more willing to use index scans for moderate selectivity.

```sql
explain (analyze, buffers)
select r.year, count(*) as races, sum(res.points) as points
  from f1db.results res
  join f1db.races r on r.raceid = res.raceid
  join f1db.drivers d on d.driverid = res.driverid
 where d.surname = 'Hamilton'
 group by r.year
 order by r.year;
```

```
 GroupAggregate  (cost=761.03..762.15 rows=56) (actual time=2.109..2.126 rows=14 loops=1)
   ->  Sort  (cost=761.03..761.17 rows=56) ...
         ->  Nested Loop  (cost=32.80..759.40 rows=56) ...
               ->  Hash Join  (cost=32.52..742.75 rows=56) ...
                     ->  Seq Scan on results res  rows=23597
                     ->  Seq Scan on drivers d  rows=2
                           Filter: ((surname)::text = 'Hamilton'::text)
                           Rows Removed by Filter: 838
               ->  Index Scan using idx_49556_primary on races r  (loops=204)
```

`drivers` is scanned sequentially (840 rows, no index on `surname`) — the
filter discards 838 rows and passes 2 to the join. Then for each of the 204
matching result rows, the planner uses an index scan on `races` by `raceid`.
A B-tree on `drivers(surname)` would replace that Seq Scan with an Index Scan
and avoid the 838-row discard.

### Composite indexes and column order

A composite index on `(a, b)` can satisfy queries filtering on `a` alone or
on `(a, b)` together. It cannot help a query filtering on `b` alone — the
B-tree is sorted by the leading column first. Put the most selective column
in the leading position, and put the column used for equality (`=`) before
columns used for ranges (`<`, `>`).

The `laptimes` table has a composite primary key `(raceid, driverid, lap)`.
A query for one driver's fastest lap in one race:

```sql
select min(milliseconds)
  from f1db.laptimes
 where raceid = 1069 and driverid = 1;
```

lands an Index Scan on the `(raceid, driverid, lap)` composite primary key —
both leading columns match, so the planner descends directly to the right
subtree and reads fewer than a dozen rows out of 500,000.

For paginated queries, a two-column index on `(filter_col, sort_col)` covers
both the `WHERE` and `ORDER BY` in one B-tree descent. A query that paginates
recent orders for one customer:

```sql
select id, total, created_at
  from orders
 where customer_id = 42
 order by created_at desc
 limit 20;
```

with an index on `(customer_id, created_at)` produces:

```
Limit
  ->  Index Scan Backward using orders_customer_created_idx on orders
        Index Cond: (customer_id = 42)
```

No separate Sort node — the index is already sorted by `created_at` within
each `customer_id` group.

### Partial indexes

A partial index covers only the rows matching a `WHERE` clause. Before
creating one, see what the current plan looks like for race winners:

```sql
explain (analyze, buffers)
select res.raceid, res.driverid, res.constructorid
  from f1db.results res
 where res.positionorder = 1
 order by res.raceid;
```

```
 Sort  (cost=755.08..757.51 rows=970) (actual time=1.292..1.324 rows=970 loops=1)
   ->  Seq Scan on results res  (cost=0.00..706.96 rows=970)
         Filter: (positionorder = 1)
         Rows Removed by Filter: 22627
```

22,627 rows fetched and discarded to find 970 winners. A partial index on
only those rows:

```sql
create index results_winners_idx
    on f1db.results (raceid, driverid, constructorid)
    where positionorder = 1;
```

The index covers only 970 rows instead of 23,597 — it is smaller, cheaper to
scan, and the planner can use it when the query's `WHERE` clause includes
`positionorder = 1`. Partial indexes are the right tool when a large fraction
of your queries always filter on the same fixed condition.

### Covering indexes

An `Index Only Scan` satisfies the entire query from the index without
visiting the heap. For it to work, all columns referenced by the query
(both `WHERE` and `SELECT`) must be present in the index.

When the columns needed for output are not in the index key, add them with
`INCLUDE`:

```sql
create index results_driverid_covering
    on f1db.results (driverid)
    include (points, positionorder);
```

Queries that select only `driverid`, `points`, and `positionorder` with a
filter on `driverid` can now use an Index Only Scan with zero heap fetches.
The `INCLUDE` columns are stored at the leaf level of the B-tree but are not
part of the sort key — they don't improve ordering, only coverage.

### Auditing unused indexes

Indexes you don't use still impose a write cost. PostgreSQL tracks usage in
`pg_stat_user_indexes`:

```sql
select schemaname,
       relname        as table_name,
       indexrelname   as index_name,
       idx_scan       as times_used,
       pg_size_pretty(pg_relation_size(indexrelid)) as size
  from pg_stat_user_indexes
 where idx_scan = 0
   and schemaname not in ('pg_catalog')
 order by pg_relation_size(indexrelid) desc;
```

Any index with `idx_scan = 0` since the last statistics reset is a candidate
for removal. Reset the stats after major load tests or schema changes with
`select pg_stat_reset()`, then wait for a representative workload period
before drawing conclusions.
