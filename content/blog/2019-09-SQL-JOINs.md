+++
date = "2019-09-07T21:30:00+02:00"
title = "What is an SQL JOIN?"
tags = ["SQL", "Relation", "Theory", "JOIN", "Composition"]
categories = ["PostgreSQL","YeSQL"]
coverImage = "/img/SQL-JOINS-Example-0.png"
+++

It took me quite some time before I could reason efficiently about SQL
JOINs. And I must admit, the set theory diagrams never helped me really
understand JOINs in SQL. So today, I want to help you understand JOINs in a
different way, hoping to make the concept click at once for you too!

<!--more-->

As we saw in the previous article [What is an SQL
relation?](/blog/2019-09-sql-relations/), in SQL a relation is a collection
of objects, all sharing the same definition. SQL introduces relations and
operators to *compose* them.

In mathematics, you can define a new function `H` as being the result of
applying `F` to some object, and then `G` to the result of the previous
operation. We then note that `H = F ∘ G` and it means that `H(x) = F(G(x))`.
Functional programing languages all have a way to express this kind of
composition. This allows to build a new function from simpler ones.

In SQL we compose relations: we build a new relation from two existing ones.
Remember, a relation is a collection of objects. How would you compose two
collections of objects together to form a new collection of objects?

There aren't that many ways to do it. Both input collections have objects of
certain properties, or attributes. You typically want to build a new
collection of objects that would have properties from the two collections,
right?

That's it. That's a SQL JOIN.

Let's see an example, taken from my book [The Art of
PostgreSQL](https://theartofpostgresql.com):

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

In this query we build a new relation that is a composition of the objects
found in the collection `ALBUM` with the objects found in the collection
`ARTIST`. The result is a new collection of objects where we have both the
properties of the album and the artist, and we enrich albums with the artist
of the same `artistid`.

This `JOIN` that you see in the query, that's all it means. For each album,
we add the information from the artist that shares the same `artistid`. In
that case, we expect a single artist per album, so that's even easier.

Next, we have a `LEFT JOIN` that composes this new relation with the
collection of track objects. We build a new collection of objects that have
all the properties of the `ALBUM`, the `ARTIST` and the `TRACK`.

I will dive in the other parts of the query in other articles! Here's the
new relation we have defined with the SQL query above:

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

Check out my book [The Art of PostgreSQL](https://theartofpostgresql.com)
where you can learn how to put SQL to good use when coding your application!
