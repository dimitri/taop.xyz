+++
title = "The FILTER Clause: Multiple Counts in One Pass"
weight = 50
summary = "count(*) FILTER (WHERE condition) computes conditional aggregates without CASE expressions or separate subqueries — one scan, multiple results."
tags = ["SQL", "FILTER", "aggregate", "GROUP BY", "performance"]
book_chapter = "Chapter 15, Group By, Having, With, Union All"
course_title = "Reliable Aggregation"
course_url = "/course/"
cta_eyebrow = "Keep going"
cta_title = "Reliable Aggregation"
cta_body = "FILTER is one piece of the correctness picture. The course covers join amplification, GROUPING SETS, ROLLUP, CUBE, multi-level CTEs, and how to design aggregation that stays correct as your data and schema evolve."
cta_url = "/course/"
cta_label = "Explore the Course"
lab_datasets = "f1db"
pglite = true
+++

Suppose you want a summary that shows, for each Formula One season, the total
number of race entries *and* the number that ended in an accident. The naive
approach is two separate queries or a subquery for each number. There is a
better way.

PostgreSQL supports a `FILTER` clause on individual aggregate functions:

```sql
  select extract(year from races.date) as season,
         count(distinct raceid)                            as nb_races,
         count(*)                                          as nb_status,
         count(*) filter(where status = 'Accident')       as accidents,
         round(100.0
               * count(*) filter(where status = 'Accident')
               / count(*), 2)                             as pct_accidents
    from results
         join status using(statusid)
         join races  using(raceid)
group by season
order by accidents desc
   limit 5;
```

```
 season │ nb_races │ nb_status │ accidents │ pct_accidents
════════╪══════════╪═══════════╪═══════════╪═══════════════
   1977 │       17 │       477 │        60 │         12.58
   1975 │       14 │       363 │        54 │         14.88
   1978 │       16 │       471 │        48 │         10.19
   1976 │       16 │       434 │        48 │         11.06
   1985 │       16 │       406 │        36 │          8.87
(5 rows)
```

Three different values from a single pass over the same groups. The total
count sees every row. The accident count sees only rows where status is
`'Accident'`. The percentage divides the two. PostgreSQL evaluates all three
in the same aggregation step over the same input.

![FILTER clause: each aggregate sees only the rows its WHERE condition selects](/img/diagrams/fig-aggregate-filter.svg)

### Why not CASE?

Before `FILTER` was standard, developers wrote `count(case when status =
'Accident' then 1 end)`. That works — the `CASE` returns `NULL` for
non-matching rows, and `COUNT` ignores `NULL` — but it is harder to read and
harder to extend.

`FILTER` is clearer about intent. The condition belongs next to the aggregate
it modifies, not embedded inside a value expression. When you come back to
the query in six months, the structure is obvious.

### Where it helps most

`FILTER` shines whenever you need multiple conditional breakdowns of the same
data: counts by status, sums by category, averages for different subsets.
Instead of one query per breakdown or a pivot with many `CASE` expressions,
one `GROUP BY` query with multiple filtered aggregates does it all in one
scan.

`FILTER` works on any aggregate function: `sum`, `avg`, `min`, `max`,
`string_agg`, `array_agg`, and custom aggregates. The syntax is always
`aggregate_fn(expr) FILTER (WHERE condition)`.
