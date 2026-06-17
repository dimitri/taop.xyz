+++
title = "An Indexing Strategy"
weight = 10
summary = "Indexes follow from your queries, not your tables. The job is choosing which queries deserve the write-time cost of an index — and which don't."
tags = ["Indexing", "Performance", "EXPLAIN", "WHERE", "ORDER BY"]
book_chapter = "Chapter 9, Indexing Strategy"
+++

The most common mistake I see is treating indexing as a data-modeling step:
you draw your tables, then sprinkle indexes on the columns that "look
important." That gets it backwards. An index exists to make a *query* faster,
and you don't know which queries you run until you've written them. So
indexing is a developer activity, downstream of your SQL — not a schema
decoration.

PostgreSQL creates exactly two kinds of index on its own: the ones it needs
for correctness. A `PRIMARY KEY`, a `UNIQUE` constraint, or an `EXCLUDE USING`
clause each requires a backing index, because that's how PostgreSQL enforces
the constraint against concurrent transactions. Everything else is yours to
decide.

## What an index actually does

Without an index, PostgreSQL has only one option: read the whole table
top to bottom (a *sequential scan*) and discard the rows that don't match. An
index gives the planner a faster path — jumping straight to the rows you want,
already in the order you asked for.

That means a good index covers two parts of a query: the `WHERE` clause (which
rows) and the `ORDER BY` clause (in what order). Consider a query that paginates
recent orders for one customer:

```sql
  select id, total, created_at
    from orders
   where customer_id = 42
order by created_at desc
   limit 20;
```

A single index on `(customer_id, created_at)` answers both halves at once.
PostgreSQL descends to `customer_id = 42`, then walks the already-sorted
`created_at` entries backward and stops after twenty rows — no scan, no sort.

```
Limit
  ->  Index Scan Backward using orders_customer_created_idx on orders
        Index Cond: (customer_id = 42)
```

## The cost you don't see

An index is duplicated data kept in sync with the table — transactionally. Every
`INSERT`, `UPDATE`, and `DELETE` now has to maintain it too. So you can't index
everything: each index you add taxes every write.

That's the whole strategy in one sentence: index the queries whose latency you
actually care about, and leave the reporting queries that can afford a few extra
seconds alone. To find out where to spend that budget, read the
[EXPLAIN plan](/yesql/indexing-performance/reading-explain/) for your slow
queries and look for a sequential scan with a filter.
