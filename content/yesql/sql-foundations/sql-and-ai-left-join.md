+++
title = "The JOIN That Silently Loses Rows"
weight = 70
summary = "The most common AI SQL mistake: a LEFT JOIN paired with a WHERE clause that filters on the right-side table, silently turning an outer join into an inner join and dropping the rows you asked for."
tags = ["SQL", "JOIN", "LEFT JOIN", "AI", "Common Mistakes"]
lab_datasets = "f1db"
pglite = true
+++

Ask an AI to *"show me all constructors and their 2017 points, including those with zero points"* and you will very likely get a query like this:

```sql
select c.name,
       coalesce(sum(r.points), 0) as total_points
  from f1db.constructors c
  left join f1db.results r on r.constructorid = c.constructorid
  left join f1db.races ra   on ra.raceid = r.raceid
 where ra.year = 2017
 group by c.name
 order by total_points desc;
```

```
     name     │ total_points
══════════════╪══════════════
 Mercedes     │          357
 Ferrari      │          318
 Red Bull     │          184
 Force India  │          101
 Williams     │           41
 Toro Rosso   │           39
 Haas F1 Team │           29
 Renault      │           26
 McLaren      │           11
 Sauber       │            5
(10 rows)
```

Ten rows. The query ran, returned numbers, and the numbers look correct. But you asked for *all* constructors — including historical ones that never raced in 2017. There are 208 constructors in the database. The query silently dropped 198 of them.

### Why the LEFT JOIN did nothing

A `LEFT JOIN` keeps every row from the left table, filling right-side columns with NULL when no match is found. The whole point is to preserve left-side rows that have no matching right-side rows.

The `WHERE ra.year = 2017` clause then runs. For any constructor that had no 2017 entries, `ra.year` is NULL — and `NULL = 2017` evaluates to NULL, not false. A NULL predicate in `WHERE` is treated the same as false: the row is excluded.

The outer join succeeded. The WHERE filter immediately undid it.

This pattern is one of the most common mistakes in AI-generated SQL because it looks structurally correct: there are LEFT JOINs, there is a COALESCE for the zero case, the aggregation is right. The error is in the interaction between the join type and the filter placement.

### The fix: filter before the join

Move the year filter inside a subquery or a lateral join, so it runs *before* the outer join rather than after:

```sql
select c.name,
       coalesce(sum(yr.points), 0) as total_points
  from f1db.constructors c
  left join (
      select r.constructorid, r.points
        from f1db.results r
        join f1db.races ra on ra.raceid = r.raceid
       where ra.year = 2017
  ) yr on yr.constructorid = c.constructorid
 group by c.name
 order by total_points desc;
```

```
           name            │ total_points
═══════════════════════════╪══════════════
 Mercedes                  │          357
 Ferrari                   │          318
 Red Bull                  │          184
 Force India               │          101
 Williams                  │           41
 Toro Rosso                │           39
 Haas F1 Team              │           29
 Renault                   │           26
 McLaren                   │           11
 Sauber                    │            5
 Maserati                  │            0
 Embassy Hill              │            0
 March                     │            0
...
(208 rows)
```

Now the subquery `yr` collects 2017 results only. The outer join then asks: "does this constructor appear in `yr`?" For the 198 constructors that never raced in 2017, the answer is no — and their `yr.points` column is NULL. `COALESCE(NULL, 0)` produces the zero you asked for.

### The diagnostic question

Whenever you see a `LEFT JOIN` in AI-generated code, check whether the `WHERE` clause references a column from the right-side table. If it does, and the condition does not explicitly allow NULLs (`IS NULL` or `IS NOT DISTINCT FROM`), the outer join is neutralized.

```sql
-- Outer join neutralized: ra.year filters out NULL rows from unmatched left-side rows
left join f1db.races ra on ra.raceid = r.raceid
where ra.year = 2017                             -- ← drops unmatched rows

-- Outer join preserved: filter lives inside the join, not after it
left join (... where ra.year = 2017) yr on ...   -- ← unmatched rows survive as NULLs
```

The instinct to develop: when you read a query and spot a `LEFT JOIN`, immediately ask what happens to the unmatched rows. Follow them through the `WHERE` clause. If any condition on a right-side column would evaluate to something other than true for a NULL row, the unmatched rows are gone — and the outer join was pointless. That reflex is what separates reading SQL from just looking at it.
