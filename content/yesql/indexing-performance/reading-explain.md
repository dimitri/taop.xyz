+++
title = "Reading an EXPLAIN Plan"
weight = 30
summary = "EXPLAIN shows you the plan the planner chose; EXPLAIN (ANALYZE) shows what actually happened. Learn to read both, and slow queries stop being a mystery."
tags = ["EXPLAIN", "Performance", "Query Plan", "Seq Scan", "Index Scan"]
book_chapter = "Chapter 9, Indexing Strategy"
+++

When a query is slow, guessing is a waste of time. Ask PostgreSQL what it's
doing. `EXPLAIN` prints the *plan* — the tree of steps the planner chose — and
`EXPLAIN (ANALYZE)` actually runs the query and reports what really happened, row
counts and timings included. For real diagnosis, use the full form:

```sql
explain (analyze, verbose, buffers)
select id, total from orders where customer_id = 42;
```

## How to read the tree

Plans are trees, printed inside-out: the *most indented* node runs first, and its
output feeds the node above it. The bottom node is where your rows come from. The
two you'll meet constantly:

- **Seq Scan** — read the whole table, row by row, keeping the ones that match a
  `Filter`. Fine for small tables; a red flag on big ones.
- **Index Scan** — jump straight to matching rows through an index. This is what
  you want when a `WHERE` or `ORDER BY` is selective.

Here the same query, before and after adding an index on `customer_id`:

```
Seq Scan on orders  (cost=0.00..18584.00 rows=21 width=12)
  Filter: (customer_id = 42)
  Rows Removed by Filter: 999979
```

```
Index Scan using orders_customer_id_idx on orders  (rows=21 width=12)
  Index Cond: (customer_id = 42)
```

The first reads a million rows to return 21. The second goes straight to the 21.

## What to look for

1. **Estimated vs. actual rows.** `ANALYZE` shows both as `rows=` (estimate) and
   `actual rows=`. If they differ by orders of magnitude, your table statistics
   are stale — let autovacuum catch up or raise the statistics target. Bad
   estimates lead the planner to bad plans.
2. **A Seq Scan with a Filter** on a large table that returns few rows. That's a
   missing index waiting to be created.
3. **Where the time actually goes.** Remember Amdahl's law: optimizing a step
   that's 10% of the runtime can save at most 10%. Find the expensive node first.

Plan-reading is a skill that rewards practice. To make the tree easier to see,
paste your output into the [Query Plan Visualizer](/explain-plan-visualizer/) —
it draws the node hierarchy and highlights where the time and rows pile up.
