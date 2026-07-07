+++
title = "LATERAL JOIN for Top-N Per Group"
weight = 60
summary = "LATERAL lets the right-hand subquery reference columns from the left side — enabling top-N per group in a single scan without window functions and outer filters."
tags = ["SQL", "LATERAL", "JOIN", "top-N", "subquery"]
course_title = "Advanced JOIN Techniques"
course_url = "/course/"
cta_eyebrow = "Keep going"
cta_title = "Advanced JOIN Techniques"
cta_body = "LATERAL is chapter four. The course covers all LATERAL patterns — per-row subqueries, k-nearest-neighbour search, social graph traversal — and how to choose between LATERAL and window functions for the same problem."
cta_url = "/course/"
cta_label = "Explore the Course"
lab_datasets = "f1db"
+++

Top-N per group is one of the most commonly asked SQL questions. Given a list
of drivers, what were each driver's best three finishes of the 2017 season?

![LATERAL join: the right-side subquery evaluates once per left-side row, returning multiple rows](/img/diagrams/fig-lateral-flow.svg)

The right-hand side of a `LATERAL` join is a subquery that can reference
columns from the left side. PostgreSQL evaluates it once per left-hand row —
like a correlated subquery, but returning multiple rows. Adding `GROUPING SETS`
to the outer query produces a subtotal row per driver alongside the detail rows:

```sql
select d.surname          as driver,
       top3.race,
       top3.pos,
       sum(top3.points)   as points
  from f1db.drivers d
  join lateral (
      select r.name            as race,
             res.positionorder as pos,
             res.points
        from f1db.results res
        join f1db.races   r on r.raceid = res.raceid
       where res.driverid = d.driverid
         and r.year       = 2017
         and res.points   > 0
       order by res.points desc
       limit 3
  ) top3 on true
 where d.surname in ('Hamilton', 'Vettel', 'Bottas', 'Ricciardo', 'Verstappen')
 group by grouping sets (
   (d.surname, top3.race, top3.pos),   -- one row per race
   (d.surname)                          -- one subtotal row per driver
 )
 order by d.surname,
          grouping(top3.race, top3.pos),
          sum(top3.points) desc nulls last;
```

```
   driver   │         race          │ pos │ points
════════════╪═══════════════════════╪═════╪════════
 Bottas     │ Austrian Grand Prix   │   1 │     25
 Bottas     │ Russian Grand Prix    │   1 │     25
 Bottas     │ Canadian Grand Prix   │   2 │     18
 Bottas     │ ¤                     │   ¤ │     68
 Hamilton   │ Canadian Grand Prix   │   1 │     25
 Hamilton   │ Chinese Grand Prix    │   1 │     25
 Hamilton   │ Spanish Grand Prix    │   1 │     25
 Hamilton   │ ¤                     │   ¤ │     75
 Ricciardo  │ Azerbaijan Grand Prix │   1 │     25
 Ricciardo  │ Spanish Grand Prix    │   3 │     15
 Ricciardo  │ Monaco Grand Prix     │   3 │     15
 Ricciardo  │ ¤                     │   ¤ │     55
 Verstappen │ Chinese Grand Prix    │   3 │     15
 Verstappen │ British Grand Prix    │   4 │     12
 Verstappen │ Australian Grand Prix │   5 │     10
 Verstappen │ ¤                     │   ¤ │     37
 Vettel     │ Australian Grand Prix │   1 │     25
 Vettel     │ Bahrain Grand Prix    │   1 │     25
 Vettel     │ Monaco Grand Prix     │   1 │     25
 Vettel     │ ¤                     │   ¤ │     75
(20 rows)
```

The subquery references `d.driverid` — a column from the left side — which is
what makes it `LATERAL`. Without `LATERAL`, that reference would be a syntax
error. The `LIMIT 3` runs *inside* the subquery, so only three rows are
returned per driver, not three rows surviving an outer filter over all rows.

`GROUPING SETS` in the outer query adds a second grouping: for `(d.surname)`
alone, `race` and `pos` collapse to `NULL` and `SUM(points)` totals the three
races. The `grouping(top3.race, top3.pos)` expression in `ORDER BY` returns a
non-zero value for those subtotal rows, sorting them after the detail rows
within each driver. The result is 15 detail rows plus 5 subtotal rows — 20 in
total.

`JOIN LATERAL (...) ON TRUE` is the standard idiom when the join condition is
always true — the correlation happens inside the subquery, not in the `ON`
clause. Use `LEFT JOIN LATERAL (...) ON TRUE` to keep left-hand rows even when
the subquery returns zero rows (the equivalent of `LEFT JOIN`).

### The window function alternative

The same top-3 result is achievable with `ROW_NUMBER()`:

```sql
select driver, race, pos, points
  from (
    select d.surname          as driver,
           r.name             as race,
           res.positionorder  as pos,
           res.points,
           row_number() over (
             partition by d.driverid
             order by res.points desc
           ) as rn
      from f1db.results res
      join f1db.races   r on r.raceid = res.raceid
      join f1db.drivers d on d.driverid = res.driverid
     where r.year = 2017
       and res.points > 0
       and d.surname in ('Hamilton', 'Vettel', 'Bottas', 'Ricciardo', 'Verstappen')
  ) ranked
 where rn <= 3
 order by driver, points desc;
```

```
   driver   │         race          │ pos │ points
════════════╪═══════════════════════╪═════╪════════
 Bottas     │ Russian Grand Prix    │   1 │     25
 Bottas     │ Austrian Grand Prix   │   1 │     25
 Bottas     │ Canadian Grand Prix   │   2 │     18
 Hamilton   │ Chinese Grand Prix    │   1 │     25
 Hamilton   │ Canadian Grand Prix   │   1 │     25
 Hamilton   │ Spanish Grand Prix    │   1 │     25
 Ricciardo  │ Azerbaijan Grand Prix │   1 │     25
 Ricciardo  │ Monaco Grand Prix     │   3 │     15
 Ricciardo  │ Canadian Grand Prix   │   3 │     15
 Verstappen │ Chinese Grand Prix    │   3 │     15
 Verstappen │ British Grand Prix    │   4 │     12
 Verstappen │ Hungarian Grand Prix  │   5 │     10
 Vettel     │ Bahrain Grand Prix    │   1 │     25
 Vettel     │ Hungarian Grand Prix  │   1 │     25
 Vettel     │ Monaco Grand Prix     │   1 │     25
(15 rows)
```

The structure differs: the window function approach computes `rn` for every row
in the filtered set, then discards all but the top 3 in an outer `WHERE`. When
there are ties for third place, `ROW_NUMBER()` breaks them arbitrarily — so the
two queries can pick different races for Ricciardo and Verstappen where points
are equal. `RANK()` instead of `ROW_NUMBER()` would keep all tied rows but
could return more than 3.

`LATERAL` is preferable when:

- The `LIMIT` or filter is complex and benefits from running close to the data
- You want to push the cutoff *inside* the subquery and avoid generating
  intermediate rows
- The subquery is essentially independent logic that happens to need one
  value from the outer query

Window functions are preferable when you need the ranking *and* the detail
rows, or when you want to apply multiple windowed computations in one pass.

### Under the hood

`EXPLAIN` makes the structural difference concrete. Both plans are abridged to
the nodes that matter:

**LATERAL + GROUPING SETS:**

```
Nested Loop
  -> Seq Scan on drivers d                            rows=7
       Filter: surname = ANY ('{Hamilton,...}')
  -> Limit                                            ← stops after 3 rows per driver
       -> Sort  (Sort Key: res.points DESC)
            -> Nested Loop (results × races)
                 -> Seq Scan on results res           ← re-runs for each driver
                      Filter: (points > 0
                               AND driverid = d.driverid)
                 -> Seq Scan on races r
                      Filter: (year = 2017)
```

**Window function:**

```
WindowAgg
  Run Condition: (row_number() OVER (?) <= 3)         ← PG 14+ early-exit per partition
  -> Sort  (Sort Key: d.driverid, res.points DESC)    ← sort ALL qualifying rows first
       -> Hash Join  (Hash Cond: res.driverid = d.driverid)
            -> Seq Scan on results res   rows=6590     ← one scan of all scoring results
                 Filter: (points > 0)
            -> Hash
                 -> Seq Scan on drivers d   rows=7
                      Filter: surname = ANY (...)
```

Two differences stand out:

**Scan count.** LATERAL re-scans `results` once per driver (7 × cost 765); the
window function scans it once (cost 706, returning 6,590 rows). Without indexes,
the window function wins on I/O. Add an index on `results(driverid, points desc)`
and LATERAL flips: each inner scan becomes a cheap index seek that stops at row 3,
while the window function still has to sort every qualifying row in each partition
before the `Run Condition` can trigger.

**Where the cutoff lands.** LATERAL's `Limit` sits *inside* the Nested Loop — rows
stop being generated after 3, before they reach the `GroupAggregate`. The window
function's `Run Condition` (PostgreSQL 14+) is an early-exit hint per partition, but
it fires *after* the preceding `Sort` has already ordered every qualifying row across
all five drivers. The cutoff is later in the pipeline.

