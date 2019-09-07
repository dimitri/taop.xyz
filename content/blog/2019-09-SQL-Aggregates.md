+++
date = "2019-09-07T22:00:00+02:00"
title = "What is an SQL Aggregate?"
tags = ["SQL", "Relation", "Aggregate"]
categories = ["PostgreSQL","YeSQL"]
coverImage = "/img/min-max-sum.jpg"
+++

In our previous articles we had a look at [What is an SQL
relation?](/blog/2019-09-sql-relations/) and [What is a SQL
JOIN?](/blog/2019-09-sql-joins/). Today, I want to show you what is an
aggregate in SQL.

You might have heard about Map/Reduce when Google made it famous, or maybe
some years before, or maybe some years later. The general processing
functions `map` and `reduce` where invented a very long time ago. The
novelty from the advertising giant was in using them in a heavily
distributed programming context.

With `map` you apply the same processing to every object in a collection.
With `reduce`, you compute a result per collection of object. In SQL we know
how to do that too, and we call that an aggregate.

Here is an example query that we used already:

~~~ sql
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
~~~

In this query we build a new relation that compose new objects from three
existing collections: `ALBUM`, `ARTIST`, and `TRACK`. The resulting relation
is a collection of *rich* objects with properties from the three input
relations.

From this new collection of objects, we want to compute the duration of the
albums, and we have the duration of each track. So we want a `SUM` of each
track duration, per album. Have a look at the query result:

~~~ sql
┌───────────────────────┬──────────────────────────────┐
│         album         │           duration           │
├───────────────────────┼──────────────────────────────┤
│ Blood Sugar Sex Magik │ @ 1 hour 13 mins 57.073 secs │
│ By The Way            │ @ 1 hour 8 mins 49.951 secs  │
│ Californication       │ @ 56 mins 25.461 secs        │
└───────────────────────┴──────────────────────────────┘
(3 rows)
~~~

The result is pretty obvious. From the relation built from albums, artists,
and tracks only the album name has been kept. For each album, the query adds
a computed value, `DURATION`.

The duration is defined as `sum(milliseconds) * interval '1 ms'`. The `SUM`
aggregate is a function that operates on a collection of objects, and
provides a single result per *group*. The *group* is defined with the SQL
construct `GROUP BY` and here that's the album, so we get a `SUM` per album.
The `milliseconds` property comes from the `TRACK` relation, so we get a sum
of the milliseconds of all the tracks of each album.

That's almost all there is to know about aggregates in SQL! When using them
more, you will want to dive into more details, such as `COUNT(*)` and
`COUNT(1)` and the initial value that depend on the specific aggregate
you're using and their behavior when confronted to `NULL` values. That's for
another article though!

Check out my book [The Art of PostgreSQL](https://theartofpostgresql.com)
where you can learn how to put SQL to good use when coding your application!
