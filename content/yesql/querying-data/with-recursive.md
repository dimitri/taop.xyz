+++
title = "WITH RECURSIVE: Walking a River Network"
weight = 40
summary = "Follow a parent reference up a tree of unknown depth — a whole river basin — with a query that refers back to its own output."
tags = ["WITH RECURSIVE", "CTE", "tree", "PostGIS"]
book_chapter = "Chapter 15, Group By, Having, With, Union All"
+++

Some questions can't be answered by a single pass over a table — they need a
query that refers back to *its own output* and keeps going until there's nothing
left to add. SQL spells that `with recursive`, and a river network is the
perfect place to see why.

We use the **HydroRIVERS** dataset (loaded with `taop hydrorivers`), clipped to
France. Every reach of every river is one row, and the key column is
`next_down`: the id of the reach this one flows *into* (or `0` at the sea). That
single column turns the table into a tree.

```sql
\d hydrorivers.rivers
```

```
   Column   |   Type   | description
------------+----------+--------------------------------------------
 hyriv_id   | bigint   | this reach
 next_down  | bigint   | the reach it flows into (0 = reaches the sea)
 main_riv   | bigint   | the basin's outlet reach (its "name")
 ord_stra   | integer  | Strahler stream order
 geom       | geometry | the reach, a line
```

## The problem

We want **every reach that drains into the Loire** — the whole basin, from the
mouth at Saint-Nazaire up to the smallest headwater. The Loire's outlet reach is
`hyriv_id = 20446779`. How do we follow `next_down` *backwards*, all the way up?

## First, by hand

Start at the mouth. Everything that flows *into* it is a row whose `next_down`
points at it:

```sql
-- step 1: direct tributaries (one self-join)
select up.hyriv_id
  from hydrorivers.rivers as up
  join hydrorivers.rivers as mouth on up.next_down = mouth.hyriv_id
 where mouth.hyriv_id = 20446779;
```

To go one level further, we join the table to itself *again* — and the Loire
basin is **6,297 reaches** deep in places. We are not writing 6,297 self-joins,
and we don't even know the depth ahead of time. This is what recursion is for.

## The query

A `with recursive` CTE does the self-join *for us*, over and over, until a round
adds nothing new:

```sql
with recursive loire as (

       select hyriv_id, geom, ord_stra            -- base case
         from hydrorivers.rivers
        where hyriv_id = 20446779                  --   the outlet

    union all

       select r.hyriv_id, r.geom, r.ord_stra       -- recursive term
         from hydrorivers.rivers as r
              join loire on r.next_down = loire.hyriv_id   -- one step upstream
)
select count(*) from loire;
```

```
 count
-------
  6297
```

Every reach of the basin, gathered in one query — and we never named a single
tributary. Plotted, it draws the whole Loire system:

![The Loire basin, gathered upstream with WITH RECURSIVE](/img/yesql/loire-basin.png)

## How it works

A `with recursive` CTE always has the same two-part shape, joined by `union all`:

1. The **base case** seeds the result — here, the single outlet reach.
2. The **recursive term** refers back to the CTE by name (`loire`) and produces
   more rows from the ones found so far. PostgreSQL runs it again and again, each
   round seeing only the rows the previous round added, and stops when a round
   adds nothing.

The join `on r.next_down = loire.hyriv_id` is what walks the tree: *give me every
reach that flows into a reach I already have.* Flip it to
`on r.hyriv_id = loire.next_down` and the same query traces a single reach the
other way — *downstream* to the sea.

The same pattern handles any hierarchy stored as a parent reference: an org
chart, a threaded comment section, a bill of materials, a category tree — or a
river and all its tributaries.
