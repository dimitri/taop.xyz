+++
title = "GROUPING SETS + FILTER: Multiple Aggregations in One Pass"
weight = 30
summary = "Compute per-driver and per-constructor totals — two different groupings — in a single scan, then pick the winners with FILTER."
tags = ["GROUPING SETS", "FILTER", "GROUP BY", "CTE"]
book_chapter = "Chapter 15, Group By, Having, With, Union All"
+++

Ever needed to compute both per-driver and per-constructor points in the same
query? PostgreSQL's `GROUPING SETS` and `FILTER` clauses make this elegant.

The example is from the chapter **Group By, Having, With, Union All**, where we
play with the *f1db* schema — so we dive into the world of Formula 1.

## The problem

The [list of Formula One seasons](https://en.wikipedia.org/wiki/List_of_Formula_One_seasons)
shows, for each year, the champion driver and the champion constructor: whoever
won the most points that season. To compute that in SQL we first add up the
points for each driver *and* each constructor, then select the top of each.

## Step 1 — a simple GROUP BY

Start with basic points aggregation, per driver:

```sql
select year, driverid, sum(points) as pts
  from results join races using(raceid)
 group by year, driverid
 order by year, pts desc;
```

## Step 2 — add GROUPING SETS

`GROUPING SETS` lets one query aggregate over *more than one grouping* in a
single scan — here, both drivers and constructors:

```sql
select year as season, driverid, constructorid,
       sum(points) as pts
  from results join races using(raceid)
 group by grouping sets((year, driverid),
                        (year, constructorid))
 order by year, pts desc;
```

Rows grouped by driver have a `NULL` `constructorid`, and vice versa — that's
the hook the next step uses.

## Step 3 — add the FILTER clause

`FILTER (WHERE …)` restricts which rows feed each aggregate, so we can pull the
top driver score and the top constructor score side by side:

```sql
select season,
       max(points) filter(where driverid is not null) as driver_pts,
       max(points) filter(where constructorid is not null) as constructor_pts
  from (
      select year as season, driverid, constructorid, sum(points) as points
        from results join races using(raceid)
       group by grouping sets((year, driverid), (year, constructorid))
  ) as data
 group by season;
```

(We can't nest one aggregate directly inside another — `aggregate function calls
cannot be nested` — so the sum and the max-of-sum live in two stages.)

## Step 4 — put it together

Daisy-chain CTEs: *points* computes the grouped sums, *tops* finds the maximum
per season, and *champs* joins back to *points* twice — once aliased as the
champion driver, once as the champion constructor:

```sql
with points as (
   select year as season, driverid, constructorid,
          sum(points) as points
     from results join races using(raceid)
 group by grouping sets((year, driverid),
                        (year, constructorid))
   having sum(points) > 0
),
tops as (
   select season,
          max(points) filter(where driverid is null) as ctops,
          max(points) filter(where constructorid is null) as dtops
     from points
 group by season
),
champs as (
   select tops.season, champ_driver.driverid, champ_driver.points,
          champ_constructor.constructorid, champ_constructor.points
     from tops
          join points as champ_driver on champ_driver.season = tops.season
           and champ_driver.constructorid is null
           and champ_driver.points = tops.dtops
          join points as champ_constructor on champ_constructor.season = tops.season
           and champ_constructor.driverid is null
           and champ_constructor.points = tops.ctops
)
select season,
       format('%s %s', drivers.forename, drivers.surname) as "Driver's Champion",
       constructors.name as "Constructor's champion"
  from champs
       join drivers using(driverid)
       join constructors using(constructorid)
order by season;
```

```
 season │ Driver's Champion  │ Constructor's champion
════════╪════════════════════╪════════════════════════
   1950 │ Nino Farina        │ Alfa Romeo
   1951 │ Juan Fangio        │ Ferrari
   1952 │ Alberto Ascari     │ Ferrari
   ...
   2014 │ Lewis Hamilton     │ Mercedes
   2015 │ Lewis Hamilton     │ Mercedes
   2016 │ Nico Rosberg       │ Mercedes
```

Two groupings, the winners of each, and the lookups to name them — all in one
query, no second round-trip to the database.
