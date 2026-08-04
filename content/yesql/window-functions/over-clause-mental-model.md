+++
title = "The OVER Clause: One Result Per Row Without GROUP BY"
weight = 10
summary = "OVER turns any aggregate into a window function — computing a result across a set of rows while still returning every row intact."
tags = ["window functions", "OVER", "analytic", "SQL"]
course_title = "Master Window Functions"
course_url = "/course/"
cta_eyebrow = "Keep going"
cta_title = "Master Window Functions"
cta_body = "This lesson covers the mental model. The course covers frame semantics, PARTITION BY, ranking functions, running totals, sessionization, and cohort analysis — from foundations to production patterns."
cta_url = "/course/"
cta_label = "Explore the Course"
lab_datasets = "f1db"
pglite = true
+++

Window functions let you compute an aggregate and keep the detail rows at
the same time. No subquery, no self-join — just `OVER`.

You already know the aggregate half: `SUM`, `COUNT`, `AVG` — the same
functions you use with `GROUP BY`. `OVER` is what happens when you take
those same functions and ask for the result on every row instead of one
result per group. The rows stay; the aggregate travels with them.

![GROUP BY collapses rows; PARTITION BY preserves them while adding a computed column](/img/diagrams/fig-groupby-vs-window.svg)

### A concrete example

The F1 database records race results. To get the top five from race 890 and
see each driver's total race time, you write a plain query:

```sql
  select surname, position,
         milliseconds * interval '1ms' as racetime
    from results
         join drivers using(driverid)
   where raceid = 890
order by position limit 5;
```

```
  surname  │ position │           racetime
═══════════╪══════════╪══════════════════════════════
 Hamilton  │        1 │ @ 1 hour 42 mins 29.445 secs
 Räikkönen │        2 │ @ 1 hour 42 mins 40.383 secs
 Vettel    │        3 │ @ 1 hour 42 mins 41.904 secs
 Webber    │        4 │ @ 1 hour 42 mins 47.489 secs
 Alonso    │        5 │ @ 1 hour 43 mins 0.856 secs
(5 rows)
```

Now suppose you want to also show the *gap* between each driver and the one
ahead of them. A window function adds that as a single expression — no
self-join, no subquery:

```sql
  select surname, position,
         milliseconds * interval '1ms' as racetime,
         interval '1ms' *
         (
           milliseconds - lag(milliseconds, 1) over(order by position)
         ) as diff
    from results
         join drivers using(driverid)
   where raceid = 890
order by position limit 5;
```

```
  surname  │ position │           racetime           │     diff
═══════════╪══════════╪══════════════════════════════╪═══════════════
 Hamilton  │        1 │ @ 1 hour 42 mins 29.445 secs │ ¤
 Räikkönen │        2 │ @ 1 hour 42 mins 40.383 secs │ @ 10.938 secs
 Vettel    │        3 │ @ 1 hour 42 mins 41.904 secs │ @ 1.521 secs
 Webber    │        4 │ @ 1 hour 42 mins 47.489 secs │ @ 5.585 secs
 Alonso    │        5 │ @ 1 hour 43 mins 0.856 secs  │ @ 13.367 secs
(5 rows)
```

`lag(milliseconds, 1)` looks back one row — in the order defined by
`over(order by position)` — and returns that row's value. The winner has no
predecessor, so their `diff` is NULL. Every other driver shows the gap to the
car ahead.

### What `OVER ()` means

`OVER ()` with no arguments is the simplest window: the entire result set.
Every row sees every other row when computing the function. You can add
`PARTITION BY` to divide the result into independent sub-windows, and
`ORDER BY` to define row sequence within each partition. Both are optional.

The function before `OVER` can be any aggregate (`sum`, `avg`, `count`) or a
window-specific function (`lag`, `lead`, `rank`, `row_number`,
`dense_rank`). It computes across the window and returns one value per row.

### When to reach for it

Reach for a window function whenever you need a derived value that depends on
*other rows* without losing the current row. Running totals, rankings,
comparisons to a previous or next period, moving averages, and percentile
positions are all natural fits.

When you find yourself reaching for a self-join or a correlated subquery
to compute "the value from the row before this one," a window function is
the cleaner path. `lag()` was built exactly for that.

### The championship battle, round by round

`SUM` with `GROUP BY` can tell you who won the 2016 championship and by
how many points. What it cannot tell you is *how* the gap opened — which
races shifted the balance, and when the title was effectively decided.

A running total with `OVER` keeps every row and adds the cumulative
picture:

```sql
select r.round,
       r.name     as race,
       d.surname,
       res.points as race_points,
       sum(res.points) over (
         partition by d.driverid
         order by r.round
       ) as total_after_round
  from f1db.results res
  join f1db.races   r using (raceid)
  join f1db.drivers d using (driverid)
 where r.year = 2016
   and d.surname in ('Rosberg', 'Hamilton', 'Ricciardo', 'Verstappen')
 order by r.round, total_after_round desc;
```

```
 round │         race          │  surname   │ race_points │ total_after_round 
═══════╪═══════════════════════╪════════════╪═════════════╪═══════════════════
     1 │ Australian Grand Prix │ Rosberg    │          25 │                25
     1 │ Australian Grand Prix │ Hamilton   │          18 │                18
     1 │ Australian Grand Prix │ Ricciardo  │          12 │                12
     1 │ Australian Grand Prix │ Verstappen │           1 │                 1
     2 │ Bahrain Grand Prix    │ Rosberg    │          25 │                50
     2 │ Bahrain Grand Prix    │ Hamilton   │          15 │                33
     2 │ Bahrain Grand Prix    │ Ricciardo  │          12 │                24
     2 │ Bahrain Grand Prix    │ Verstappen │           8 │                 9
     3 │ Chinese Grand Prix    │ Rosberg    │          25 │                75
     3 │ Chinese Grand Prix    │ Hamilton   │           6 │                39
     3 │ Chinese Grand Prix    │ Ricciardo  │          12 │                36
     3 │ Chinese Grand Prix    │ Verstappen │           4 │                13
     4 │ Russian Grand Prix    │ Rosberg    │          25 │               100
     4 │ Russian Grand Prix    │ Hamilton   │          18 │                57
     4 │ Russian Grand Prix    │ Ricciardo  │           0 │                36
     4 │ Russian Grand Prix    │ Verstappen │           0 │                13
     5 │ Spanish Grand Prix    │ Rosberg    │           0 │               100
     5 │ Spanish Grand Prix    │ Hamilton   │           0 │                57
     5 │ Spanish Grand Prix    │ Ricciardo  │          12 │                48
     5 │ Spanish Grand Prix    │ Verstappen │          25 │                38
     6 │ Monaco Grand Prix     │ Rosberg    │           6 │               106
     6 │ Monaco Grand Prix     │ Hamilton   │          25 │                82
     6 │ Monaco Grand Prix     │ Ricciardo  │          18 │                66
     6 │ Monaco Grand Prix     │ Verstappen │           0 │                38
(84 rows)
```

Each row is still a race result — one driver, one round, the points
scored that day. The `total_after_round` column carries the cumulative
season total, growing with each round. Round 5 is the Spanish Grand Prix,
where both Rosberg and Hamilton collided and retired — `race_points = 0`
for both, while Verstappen took his first ever win and leapt from 13 to 38
points. The `total_after_round` column captures that shift immediately;
`GROUP BY` would silently absorb it into a season total.

The `SUM` is the same aggregate you already know. Two new things appear
inside `OVER`: `PARTITION BY driverid` restarts the running total
independently for each driver, and `ORDER BY round` defines which rows
have accumulated so far. Both are covered in depth in the course.

`GROUP BY year, driverid` would collapse the 84 rows to four and hand you
the final totals — Rosberg 385, Hamilton 380. The window version gives you
the whole story of a five-point championship decided on the last lap of
the last race.
