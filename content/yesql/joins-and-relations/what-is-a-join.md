+++
title = "What is an SQL JOIN?"
weight = 10
summary = "Forget the set-theory Venn diagrams. A JOIN composes two collections of objects into a new collection that has the properties of both."
tags = ["SQL", "JOIN", "Relation", "Composition"]
book_chapter = "Chapter 19, Understanding Relations and Joins"
aliases = ["/blog/2019-09-sql-joins/"]
lab_datasets = "chinook"
+++

It took me quite some time before I could reason efficiently about SQL JOINs —
and the set-theory Venn diagrams never really helped me understand them. So
today I want to help you understand JOINs in a different way, hoping to make the
concept click at once.

As we saw in [What is an SQL relation?](/yesql/sql-foundations/what-is-a-relation/),
a relation is a collection of objects, all sharing the same definition. SQL
introduces relations and operators to *compose* them.

In mathematics you can define a new function `H` as applying `F`, then `G`, to
some object: `H = F ∘ G`, meaning `H(x) = F(G(x))`. Functional languages all
have a way to express this composition, building a new function from simpler
ones.

In SQL we compose *relations*: we build a new relation from two existing ones.
Both inputs have objects with certain attributes. You typically want a new
collection of objects that has properties from *both* collections.

That's it. That's a SQL JOIN.

![INNER JOIN as composition: the matching driver row combines with all its result rows to build the output relation](/img/diagrams/fig-jfan-inner.svg)

Here's an example, taken from the book:

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

In this query we build a new relation composing objects from `ALBUM` with
objects from `ARTIST`: the result has the properties of both, enriching each
album with the artist sharing the same `artistid`. That `JOIN` is all it means:
for each album, add the information from the matching artist.

Next, the `LEFT JOIN` composes that with the `TRACK` collection, producing
objects that carry the properties of `ALBUM`, `ARTIST`, *and* `TRACK`.

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

A JOIN composes two relations into a new one. Once you see joins as composition
rather than overlapping circles, the whole family — `INNER`, `LEFT`/`RIGHT`
`OUTER`, `CROSS`, and even `LATERAL` — falls into place.
