+++
title = "percentile_cont(): Many Percentiles in One Query"
weight = 60
summary = "Median, 90th, 95th, and 99th percentile — computed together in a single pass with an ordered-set aggregate."
tags = ["percentile_cont", "WITHIN GROUP", "aggregate", "array"]
book_chapter = "Chapter 23, PostgreSQL Data Types"
+++

Need median, 90th percentile, 95th, *and* 99th? PostgreSQL computes them all in
one query with `percentile_cont()`, an ordered-set aggregate.

## The problem

Calculate commit-time percentiles (median, 90th, 95th, 99th) for each project —
here, the time between a commit being authored (`ats`) and committed (`cts`).

## Step 1 — a basic average

The average is easy, but on a skewed distribution it hides the story:

```sql
select project, avg(cts-ats) as avg_time
  from commits
 where ats <> cts
 group by project;
```

```
 project  │                avg_time
══════════╪═════════════════════════════════════════
 postgres │ @ 1 day 10 hours 36 mins 56.743525 secs
```

## Step 2 — the median

`percentile_cont(0.5)` is an *ordered-set* aggregate: it needs the rows sorted,
which you give it with `WITHIN GROUP (ORDER BY …)`:

```sql
select project,
       percentile_cont(0.5) within group(order by cts-ats) as median
  from commits
 where ats <> cts
 group by project;
```

```
 project  │      median
══════════╪══════════════════
 postgres │ @ 3 mins 46 secs
```

The median is *three minutes* where the average was a day and a half — that gap
is exactly why you want percentiles.

## Step 3 — many percentiles at once

Pass an array and get an array back — one pass over the sorted data:

```sql
select project,
       percentile_cont(array[0.5, 0.9, 0.95, 0.99])
          within group(order by cts-ats) as percentiles
  from commits
 where ats <> cts
 group by project;
```

## Step 4 — name the columns

Index into the array to present each percentile as its own column:

```sql
with perc_arrays as (
   select project,
          avg(cts-ats) as average,
          percentile_cont(array[0.5, 0.9, 0.95, 0.99])
             within group(order by cts-ats) as parr
     from commits
    where ats <> cts
 group by project
)
select project, average,
       parr[1] as median,
       parr[2] as "%90th",
       parr[3] as "%95th",
       parr[4] as "%99th"
  from perc_arrays;
```

```
project │ postgres
average │ @ 1 day 10 hours 36 mins 56.743525 secs
median  │ @ 3 mins 46 secs
%90th   │ @ 3 hours 21 mins 57 secs
%95th   │ @ 2 days 22 hours 57 mins 3 secs
%99th   │ @ 34 days 20 hours 53 mins 12.28 secs
```

One scan, four percentiles, plus the average for contrast — the kind of summary
that turns a vague "it's usually fast" into numbers you can act on.
