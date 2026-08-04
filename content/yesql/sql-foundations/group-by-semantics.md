+++
title = "GROUP BY and HAVING: Thinking in Groups"
weight = 40
summary = "GROUP BY compresses many rows into one per group. Understanding the evaluation order — WHERE, then GROUP BY, then HAVING, then SELECT — is what makes aggregation queries predictable."
tags = ["SQL", "GROUP BY", "HAVING", "Aggregation", "Fundamentals"]
lab_datasets = "f1db"
pglite = true
+++

Aggregation is at the core of analytics, but subtle mistakes can lead to incorrect results or misleading metrics. A query that compiles and returns results can still be silently wrong: double-counting rows after a join, losing data through premature filtering, or producing totals that shift when the underlying data changes. Getting aggregation right means understanding not just the syntax but the evaluation model.

<figure>
  <img src="/img/diagrams/fig-select-order.svg" alt="SQL clause evaluation order: FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, LIMIT">
  <figcaption>SQL clauses execute in this logical order — not the order they are written. <code>WHERE</code> filters rows before groups form; <code>HAVING</code> filters groups after aggregation; <code>SELECT</code> expressions are evaluated last, which is why aggregate results cannot appear in <code>WHERE</code>.</figcaption>
</figure>

### GROUP BY semantics

`GROUP BY` partitions the result set into groups of rows that share the same values for the specified columns. Each group collapses into a single output row, and only expressions that are either grouping keys or aggregate function calls are valid in the `SELECT` list.

Understanding this evaluation order is the foundation of writing correct aggregation queries:

1. `WHERE` — filters individual rows
2. `GROUP BY` — forms groups from the surviving rows
3. `HAVING` — filters whole groups
4. `SELECT` — projects the final result

A simple but illustrative question about the Formula One dataset: how many races were held in each decade of the sport's history? The `races` table has one row per race with a `date` column; we want to reduce that to one row per decade with a count.

The grouping key does not exist as a column — we derive it by truncating each date to the start of its decade with `date_trunc('decade', date)`, then extracting the year to get a clean integer. `GROUP BY decade` uses the `SELECT` alias, which PostgreSQL allows. `COUNT(*)` counts every row that falls into each group, NULLs and all.

```sql
select extract('year' from date_trunc('decade', date)) as decade,
       count(*) as races
  from races
 group by decade
 order by decade;
```

```
 decade │ races
════════╪═══════
   1950 │    84
   1960 │   100
   1970 │   144
   1980 │   156
   1990 │   162
   2000 │   174
   2010 │   156
(7 rows)
```

The output has exactly seven rows — one per decade — regardless of how many individual race rows fed into each group. This is what `GROUP BY` does: compress many rows of detail into one summary row per group.

### Aggregate functions

PostgreSQL provides a rich set of built-in aggregate functions: `SUM`, `COUNT`, `AVG`, `MIN`, `MAX`, and many more. Each operates on all rows in the group and returns a single value.

`COUNT(*)` counts rows; `COUNT(column)` counts non-NULL values in that column. This distinction matters: a column with many NULLs will report a lower count than the number of rows in the group, which is often surprising.

The obvious follow-up after counting races is: who won the most of them? The `results` table records every driver's finishing `position` in every race; `position = 1` means a win.

```sql
  select code, forename, surname,
         count(*) as wins
    from      drivers
         join results using(driverid)
   where position = 1
group by driverid
order by wins desc
   limit 3;
```

```
 code │ forename │  surname   │ wins
══════╪══════════╪════════════╪══════
 MSC  │ Michael  │ Schumacher │   91
 HAM  │ Lewis    │ Hamilton   │   57
 ¤    │ Alain    │ Prost      │   51
(3 rows)
```

The `WHERE` clause runs before `GROUP BY`: only winning results enter the aggregation. Each `driverid` group then collapses to a single row carrying the count of rows that survived the filter.

### Row context vs group context

In a plain `SELECT`, each expression operates in a row context — each row is processed independently. In an aggregating query, expressions operate in a group context — one result per group. Mixing the two contexts in the same query is the root cause of most aggregation errors.

PostgreSQL enforces this rule strictly: every column that appears in the `SELECT` list of an aggregating query must either be a grouping key or be wrapped in an aggregate function call. Violating this produces an error:

```
ERROR: column "races.name" must appear in the GROUP BY clause
       or be used in an aggregate function
```

The fix is either to add the column to `GROUP BY`, or to aggregate it with `MIN`, `MAX`, `string_agg`, or a similar function. The query below illustrates the pattern: one row per season, with the race count and the alphabetically first and last circuit names.

```sql
  select year,
         count(*)  as races,
         min(name) as first_circuit_alpha,
         max(name) as last_circuit_alpha
    from races
   group by year
   order by year desc
   limit 8;
```

```
 year │ races │ first_circuit_alpha  │    last_circuit_alpha
══════╪═══════╪══════════════════════╪══════════════════════════
 2017 │    20 │ Abu Dhabi Grand Prix │ United States Grand Prix
 2016 │    21 │ Abu Dhabi Grand Prix │ United States Grand Prix
 2015 │    19 │ Abu Dhabi Grand Prix │ United States Grand Prix
 2014 │    19 │ Abu Dhabi Grand Prix │ United States Grand Prix
 2013 │    19 │ Abu Dhabi Grand Prix │ United States Grand Prix
 2012 │    20 │ Abu Dhabi Grand Prix │ United States Grand Prix
 2011 │    19 │ Abu Dhabi Grand Prix │ Turkish Grand Prix
 2010 │    19 │ Abu Dhabi Grand Prix │ Turkish Grand Prix
(8 rows)
```

Each output row represents an entire season's worth of races collapsed into a single summary. Mastering this distinction — row context vs group context — is what makes aggregation reliable.

### WHERE vs HAVING

`WHERE` filters rows before grouping; `HAVING` filters groups after aggregation. Only expressions computable before grouping can appear in `WHERE`; aggregated expressions must go in `HAVING`. Pushing filters into `WHERE` is almost always more efficient because it reduces the number of rows that enter the aggregation step.

A practical question about the 1978 Formula One season: what were the most common reasons drivers failed to finish, and how often did each reason occur? We want to see only the statuses that accumulated at least ten non-finishes — frequent enough to be systemic rather than isolated.

```sql
  select status,
         count(*) as occurrences
    from results
         join races   using(raceid)
         join status  using(statusid)
   where date between date '1978-01-01'
                  and date '1978-01-01' + interval '1 year - 1 day'
     and position is null
group by status
  having count(*) >= 10
order by count(*) desc;
```

```
       status       │ occurrences
════════════════════╪═════════════
 Did not qualify    │          55
 Accident           │          46
 Engine             │          37
 Did not prequalify │          25
 Gearbox            │          13
 Transmission       │          12
 Spun off           │          12
(7 rows)
```

The `WHERE` predicate runs first and cheaply eliminates all other years and all rows where a driver finished. The `HAVING` predicate runs last, on the small set of groups produced by `GROUP BY`.

Notice that `count(*) >= 10` appears in `HAVING`, not `WHERE`. Moving it to `WHERE` would be a syntax error: `WHERE` cannot reference aggregate results because aggregation has not happened yet at that point in the evaluation order.
