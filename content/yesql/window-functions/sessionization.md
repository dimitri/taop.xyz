+++
title = "Sessionization: Grouping Events with a Running Sum"
weight = 80
summary = "Sessionization turns a stream of timestamped events into labelled sessions using nothing but a window function — no procedural loop required."
tags = ["window functions", "sessionization", "gaps and islands", "SQL", "analytics"]
course_title = "Master Window Functions"
course_url = "/course/"
lab_datasets = "f1db"
+++

A session is a group of consecutive events that belong together. Web
analytics defines it as activity within a 30-minute gap. Race analytics
defines it as a stint between pit stops. Either way, the problem is the same:
given ordered events, group the ones that "go together" and label each group.

The SQL pattern is called *sessionization*, and it uses a running sum as the
group key.

### The idea

Mark each row that starts a new session with a 1, and all other rows with a
0. A running sum of those flags increments at every boundary and holds steady
inside each session. The running sum is the session ID.

### A pit-stop example

The F1 `laptimes` table records each driver's lap time for every lap of a
race. A lap significantly slower than the driver's median indicates a pit
stop. Group the non-pit laps into stints:

```sql
with lap_stats as (
  select driverid,
         percentile_cont(0.5) within group(order by milliseconds) as median_ms
    from laptimes
   where raceid = 890
   group by driverid
),
lap_flags as (
  select l.driverid, d.surname, l.lap, l.milliseconds,
         case when l.milliseconds > ls.median_ms * 1.2
              then 1 else 0 end as is_pit
    from laptimes l
         join lap_stats ls using(driverid)
         join drivers   d  using(driverid)
   where l.raceid = 890
),
stints as (
  select driverid, surname, lap, milliseconds, is_pit,
         sum(is_pit) over(partition by driverid order by lap) as stint
    from lap_flags
)
  select s.surname, s.stint,
         min(s.lap)  as from_lap,
         max(s.lap)  as to_lap,
         count(*)    as laps,
         round(avg(s.milliseconds)) * interval '1ms' as avg_laptime
    from stints s
         join results r on r.driverid = s.driverid and r.raceid = 890
   where s.is_pit = 0
group by s.driverid, s.surname, s.stint, r.position
order by r.position, s.stint
   limit 15;
```

```
  surname  │ stint │ from_lap │ to_lap │ laps │     avg_laptime
═══════════╪═══════╪══════════╪════════╪══════╪═════════════════════
 Hamilton  │     0 │        1 │      9 │    9 │ @ 1 min 28.807 secs
 Hamilton  │     1 │       11 │     31 │   21 │ @ 1 min 27.997 secs
 Hamilton  │     2 │       33 │     70 │   38 │ @ 1 min 26.583 secs
 Räikkönen │     0 │        1 │     13 │   13 │ @ 1 min 29.833 secs
 Räikkönen │     1 │       15 │     70 │   56 │ @ 1 min 27.243 secs
 Vettel    │     0 │        1 │     11 │   11 │ @ 1 min 28.971 secs
 Vettel    │     1 │       13 │     34 │   22 │ @ 1 min 28.375 secs
 Vettel    │     2 │       36 │     70 │   35 │ @ 1 min 26.454 secs
 Webber    │     0 │        1 │     23 │   23 │ @ 1 min 29.137 secs
 Webber    │     1 │       25 │     70 │   46 │ @ 1 min 27.189 secs
 ...
(15 rows)
```

Three CTEs, one window function. `lap_stats` computes each driver's median
lap time. `lap_flags` marks each lap as pit or non-pit. `stints` runs a
cumulative sum of `is_pit` per driver — the sum increments once for every pit
lap and holds steady across normal laps. That value is the stint number.
The final query groups by stint and summarises each.

### Why this works

The running sum of a 0/1 flag counts how many "events" have fired up to and
including the current row. Between events (inside a session), the count does
not change — every row in the same session shares the same running-sum value.
At each event (a pit stop, a gap in activity, a state change), the count
increments and all subsequent rows belong to the next group.

This is the *gaps and islands* pattern. The "gaps" are the boundaries (pit
laps, idle periods); the "islands" are the sessions (stints, active periods).
A single `SUM(flag) OVER (PARTITION BY entity ORDER BY time)` produces the
island labels.

### The general pattern

```sql
sum(case when <boundary_condition> then 1 else 0 end)
  over(partition by <entity> order by <time_col>)
as session_id
```

Boundary conditions are flexible: a gap larger than N seconds, a value
dropping below a threshold, a flag column changing from false to true. The
pattern works for web sessions, user journeys, machine monitoring, financial
trade periods, and any other domain where you need to segment an ordered
stream into contiguous groups.
