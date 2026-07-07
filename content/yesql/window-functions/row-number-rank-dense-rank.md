+++
title = "ROW_NUMBER, RANK, and DENSE_RANK: Three Ways to Order Rows"
weight = 20
summary = "Three ranking functions, three different answers to ties. Pick the one that matches what your data actually means."
tags = ["window functions", "ranking", "ROW_NUMBER", "RANK", "DENSE_RANK"]
course_title = "Master Window Functions"
course_url = "/course/"
cta_eyebrow = "Keep going"
cta_title = "Master Window Functions"
cta_body = "Ranking is chapter two of the course. You'll also cover NTILE, LEAD/LAG, running totals, frame semantics, sessionization, and the analytical patterns that replace application-side loops."
cta_url = "/course/"
cta_label = "Explore the Course"
lab_datasets = "f1db"
+++

PostgreSQL gives you three ranking functions. They look similar and they all
take `OVER (ORDER BY ...)`. But they handle ties differently, and picking the
wrong one silently produces wrong results.

### ROW_NUMBER

Assigns a unique sequential integer to every row. Ties get different numbers
— which one gets the lower number is arbitrary if the `ORDER BY` does not
fully resolve ties.

```sql
  select surname,
         row_number() over(order by milliseconds) as position,
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

Use `row_number()` when you need exactly one row per rank slot — for
top-N-per-group queries, pagination, or deduplication. The fact that ties
break arbitrarily is usually fine for those use cases.

### RANK and DENSE_RANK

Both handle ties the same way on the way *in*: tied rows get the same rank.
They differ on what comes *after* a tie.

`rank()` skips numbers after a tie. If two rows share rank 2, the next row
gets rank 4 — just like Olympic medal standings, where two silvers means no
bronze.

`dense_rank()` does not skip. Two rows share rank 2, the next row gets rank 3.

The difference is visible when you mix two ordering criteria. Here we rank
drivers by laps completed (descending) then by total time (ascending):

```sql
  select surname, laps,
         rank()       over(order by laps desc, milliseconds) as position,
         dense_rank() over(order by laps desc, milliseconds) as dense,
         milliseconds * interval '1ms' as racetime
    from results
         join drivers using(driverid)
   where raceid = 890
order by position;
```

```
   surname   │ laps │ position │ dense │           racetime
═════════════╪══════╪══════════╪═══════╪══════════════════════════════
 Hamilton    │   70 │        1 │     1 │ @ 1 hour 42 mins 29.445 secs
 Räikkönen   │   70 │        2 │     2 │ @ 1 hour 42 mins 40.383 secs
 Vettel      │   70 │        3 │     3 │ @ 1 hour 42 mins 41.904 secs
 Webber      │   70 │        4 │     4 │ @ 1 hour 42 mins 47.489 secs
 Alonso      │   70 │        5 │     5 │ @ 1 hour 43 mins 0.856 secs
 ...
 Senna       │   55 │       21 │    18 │ ¤
 Grosjean    │   55 │       21 │    18 │ ¤
 Maldonado   │   52 │       23 │    19 │ ¤
(24 rows)
```

If two drivers complete the same number of laps in the same milliseconds —
an exact tie — `rank` creates a gap in the numbering that follows, while
`dense_rank` does not.

### Which one to use

- **ROW_NUMBER**: you need distinct values, ties are acceptable to break
  arbitrarily (deduplication, pagination, top-N).
- **RANK**: real-world ranking where gaps after ties communicate meaning
  (leaderboards, standings).
- **DENSE_RANK**: ranking where gaps would be confusing or where downstream
  logic depends on consecutive integers (decile assignment, relative scoring).

All three are zero-cost to add alongside each other in the same query — they
share the same sort pass. When in doubt, compute all three and look at your
data before committing to one.
