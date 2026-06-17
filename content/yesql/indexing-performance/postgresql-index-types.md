+++
title = "PostgreSQL Index Types"
weight = 20
summary = "B-tree is the default and the right answer most of the time. But GiST, GIN, and BRIN exist because some questions a sorted tree simply can't answer."
tags = ["Indexing", "B-tree", "GiST", "GIN", "BRIN"]
book_chapter = "Chapter 9, Indexing Strategy"
+++

`CREATE INDEX` gives you a B-tree, and most of the time that's what you want.
But PostgreSQL ships several *access methods*, each a different algorithm suited
to a different shape of question. Knowing which one fits the query saves you from
forcing a B-tree to do a job it's bad at.

## The five you'll reach for

- **B-tree** — a balanced, sorted tree. It handles equality, ranges, prefixes,
  and `ORDER BY`. If your column has a natural sort order and you're asking
  "equals," "between," or "starts with," this is the answer. PostgreSQL's B-tree
  is best-in-class and tuned for concurrent reads and writes.

- **GiST** — generalized search tree. Built for data with *no* total order:
  geometry, ranges, and nearest-neighbour search. A B-tree can't index a 2-D
  point sensibly, but GiST can. It's also what powers `<->` KNN queries — see
  [k-nearest-neighbour search](/yesql/extensions-spatial/knn-search/).

- **GIN** — generalized inverted index. For *composite* values where you search
  for elements *inside* the value: arrays, `jsonb`, and full-text search. GIN
  stores one entry per element, mapping it back to the rows that contain it.

- **BRIN** — block range index. Tiny. Instead of indexing every row, it stores
  the min/max of each block range. Perfect for naturally ordered data like an
  append-only `created_at` column on a huge table, where a B-tree would be
  enormous and BRIN is a few kilobytes.

- **Hash** — equality only (`=`), nothing else. Crash-safe since PostgreSQL 10.
  Rarely worth it over a B-tree, which also does ranges.

## One example: containment in jsonb

Say you store event payloads as `jsonb` and you want every row whose payload
*contains* a given key/value. The `@>` containment operator is exactly what GIN
indexes accelerate:

```sql
create index on events using gin (payload);
```

Now this query becomes an index scan instead of reading every row and parsing
its JSON:

```sql
select id from events where payload @> '{"type": "signup"}';
```

The rule of thumb: B-tree for scalars and ordering, GiST for ranges and
geometry, GIN for "is this element inside the value," and BRIN for big, naturally
sorted tables. Pick the access method that matches the *operator* in your
`WHERE` clause, and the planner will use it.
