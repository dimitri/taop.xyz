+++
title = "What is an SQL Aggregate?"
weight = 20
summary = "It's the reduce half of map/reduce: an aggregate computes a single result per group, and GROUP BY defines the groups."
tags = ["SQL", "Aggregate", "GROUP BY"]
book_chapter = "Chapter 15, Group By, Having, With, Union All"
+++

Earlier we looked at [what an SQL relation is](/yesql/sql-foundations/what-is-a-relation/)
and [what a SQL JOIN is](/yesql/querying-data/what-is-a-join/). Today: what is an
aggregate in SQL?

You may have heard of Map/Reduce. With `map` you apply the same processing to
every object in a collection; with `reduce` you compute a single result per
collection. SQL knows how to do that too — and we call it an **aggregate**.

Here's an example query we've used before:

```sql
-- name: list-albums-by-artist
-- List the album titles and duration of a given artist
  select album.title as album,
         sum(milliseconds) * interval '1 ms' as duration
    from album
         join artist using(artistid)
         left join track using(albumid)
   where artist.name = 'Red Hot Chili Peppers'
group by album
order by album;
```

This builds a new relation composing `ALBUM`, `ARTIST`, and `TRACK` into rich
objects. From that collection we want the duration of each album, and we have the
duration of each track — so we want a `SUM` of track durations, *per album*:

```sql
┌───────────────────────┬──────────────────────────────┐
│         album         │           duration           │
├───────────────────────┼──────────────────────────────┤
│ Blood Sugar Sex Magik │ @ 1 hour 13 mins 57.073 secs │
│ By The Way            │ @ 1 hour 8 mins 49.951 secs  │
│ Californication       │ @ 56 mins 25.461 secs        │
└───────────────────────┴──────────────────────────────┘
(3 rows)
```

The duration is `sum(milliseconds) * interval '1 ms'`. The `SUM` aggregate
operates on a collection and returns a single result per *group*. The group is
defined by `GROUP BY` — here, the album — so we get one `SUM` per album, over the
`milliseconds` of all its tracks.

That's almost all there is to aggregates. As you use them more, you'll want to
dig into the details — `COUNT(*)` versus `COUNT(1)`, each aggregate's initial
value, and how they behave with `NULL` values. That's for another lesson — and
when you need *several* aggregates over *different* groupings at once, see
[GROUPING SETS + FILTER](/yesql/querying-data/grouping-sets-and-filter/).
