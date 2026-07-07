+++
title = "NULL in SQL: Three-Valued Logic"
weight = 60
summary = "NULL is not zero, not an empty string, not false. It means unknown — and that single word explains every surprising thing SQL does with it, from WHERE conditions that silently drop rows to comparisons that never return true."
tags = ["SQL", "NULL", "Three-Valued Logic", "Fundamentals"]
lab_datasets = "f1db"
+++

### Three-valued logic

SQL works in *three-valued logic*: a comparison involving NULL is neither true nor false but *unknown*. Two cells surprise almost everyone when they first see the full truth tables:

- `null AND false` is `false` — because false dominates AND regardless of what the other operand is.
- `null OR true` is `true` — because true dominates OR regardless of what the other operand is.
- Everything else involving NULL stays NULL, including `NOT null`.

**AND**

| AND | true | false | *null* |
|-----|------|-------|--------|
| **true** | true | false | *null* |
| **false** | false | false | false |
| ***null*** | *null* | false | *null* |

**OR**

| OR | true | false | *null* |
|----|------|-------|--------|
| **true** | true | true | true |
| **false** | true | false | *null* |
| ***null*** | true | *null* | *null* |

**NOT**

| | result |
|---|--------|
| NOT true | false |
| NOT false | true |
| NOT *null* | *null* |

The practical consequence: a `WHERE` clause keeps only rows where the condition evaluates to `true`. If it evaluates to `false` *or* to `null`, the row is excluded. This is why `WHERE col = NULL` never matches anything — `NULL = NULL` evaluates to null, not true, so every row is dropped.

```sql
-- This returns zero rows, always:
SELECT * FROM drivers WHERE nationality = NULL;

-- This is what you want:
SELECT * FROM drivers WHERE nationality IS NULL;
```

`IS NULL` and `IS NOT NULL` are the two-valued operators designed for this: they always return true or false, never null.

### Two meanings of NULL

NULL has two distinct meanings that can coexist in the same result set.

**NULL as unknown** — in a join condition, `NULL = anything` evaluates to null. The row is excluded from an inner join, just as if the condition were false. This is the unknown-value meaning.

**NULL as absent** — in an outer join result, `NULL` means "no match was found on this side." A left join that finds no matching right-side row fills every right-side column with `NULL`. This is the absent-value meaning.

The two uses look identical in the output but have completely different causes. The practical consequence: checking for rows absent from the right side of a left join requires `WHERE right_column IS NULL`, not `WHERE right_column = NULL`.

Every F1 circuit ever used is in the `circuits` table. Most of them have not been on the calendar for years. A left join to `races` filtered to a single year makes the NULLs concrete:

```sql
select c.name as circuit,
       r.name as race_2023
  from f1db.circuits c
  left join f1db.races r on r.circuitid = c.circuitid
                        and r.year = 2023
 order by r.name nulls last
 limit 12;
```

```
                circuit               │        race_2023
══════════════════════════════════════╪══════════════════════════════
 Albert Park Grand Prix Circuit       │ Australian Grand Prix
 Baku City Circuit                    │ Azerbaijan Grand Prix
 Circuit de Barcelona-Catalunya       │ Spanish Grand Prix
 Circuit de Monaco                    │ Monaco Grand Prix
 Circuit of the Americas              │ United States Grand Prix
 Hungaroring                          │ Hungarian Grand Prix
 Ain-Diab                             │ ¤
 Aida                                 │ ¤
 Aintree                              │ ¤
 Avus                                 │ ¤
 Brands Hatch                         │ ¤
 Buenos Aires                         │ ¤
(12 rows)
```

The TAOP lab's `.psqlrc` sets `\pset null '¤'`, so NULL values are displayed as `¤` rather than a blank cell. You can set the same in your own psql session with `\pset null '¤'`, or use any string you like (`\pset null 'NULL'` is common).

The `¤` rows — Ain-Diab, Aintree, Avus and the rest — never matched the join condition `circuitid = c.circuitid AND year = 2023`. The database found no race for them in 2023, so PostgreSQL fills every right-side column with NULL. This is the *absent* meaning: not unknown, but definitively not there.

To find only circuits that dropped off the 2023 calendar, add `WHERE r.raceid IS NULL` (not `WHERE r.raceid = NULL`, which would match nothing).

### IS DISTINCT FROM

When you need NULL to behave like an ordinary, comparable value — in a join condition between two nullable columns, in change-detection queries — use `IS DISTINCT FROM` and `IS NOT DISTINCT FROM`. They are the two-valued cousins of `<>` and `=`: they never return null, and they treat two NULLs as equal.

A practical case: find every driver whose three-letter abbreviation differs from the first three letters of their surname — *including* historical drivers who have no abbreviation at all (NULL in the `code` column). Using `<>` silently drops the NULL rows; `IS DISTINCT FROM` includes them:

```sql
select surname, code
  from f1db.drivers
 where code is distinct from upper(left(surname, 3))
 order by surname
 limit 10;
```

```
   surname    │ code
══════════════╪══════
 Abecassis    │ ¤
 Acheson      │ ¤
 Adams        │ ¤
 Allison      │ ¤
 de la Rosa   │ DLR
 van Doorne   │ VAN
 ...
(10 rows)
```

Drivers before 2014 have no official three-letter code; their `code` column is NULL. `code <> upper(left(surname, 3))` evaluates to NULL for every one of them — and a NULL predicate in a `WHERE` clause is treated like false, so the row is silently excluded. `IS DISTINCT FROM` treats NULL as a distinguishable value, so it returns true when one side is NULL and the other is not.

The same logic applies when comparing two nullable columns: `IS NOT DISTINCT FROM` finds rows where both are NULL, or both are the same value — equality that `=` can never express for NULL inputs.

| a | b | `a = b` | `a IS DISTINCT FROM b` |
|---|---|---------|------------------------|
| 1 | 1 | true | false |
| 1 | 2 | false | true |
| 1 | *null* | *null* | true |
| *null* | *null* | *null* | false |

Reach for `IS DISTINCT FROM` whenever you are comparing two nullable columns and a NULL-on-either-side should not silently drop the row.

### NULLS FIRST and NULLS LAST

PostgreSQL treats NULL as larger than any non-NULL value for sorting. In an `ASC` sort, NULLs land last; in a `DESC` sort, NULLs land first. Both defaults are often wrong — for example, an `ORDER BY position` on race results puts DNFs (NULL position) after all finishers by default, which happens to be the right behavior. But `ORDER BY position DESC` to find the slowest finisher first would put DNFs at the top, which is usually not what you want.

Override with `NULLS FIRST` or `NULLS LAST`:

```sql
-- Finishers first, DNFs at the bottom regardless of sort direction
select d.surname, res.position
  from f1db.results res
  join f1db.drivers d using (driverid)
  join f1db.races r using (raceid)
 where r.year = 2023 and r.round = 1
 order by res.position asc nulls last;   -- same as the default for ASC
```

```sql
-- Same intent, reversed: slowest finisher first, DNFs still at the bottom
 order by res.position desc nulls last;  -- explicit: overrides the DESC default
```

The same modifier applies to `CREATE INDEX`. PostgreSQL builds an index with the same NULL ordering as the `ORDER BY` clause. If your query sorts `ASC NULLS LAST` (the default) the planner can use a plain B-tree scan. But if your query sorts `DESC NULLS LAST` (non-default), the index must be created to match, otherwise the planner falls back to a sort step:

```sql
create index on results (position desc nulls last);
```

### Going deeper

Jeff Davis's 2009 post [*What is the deal with NULLs?*](http://thoughts.davisjeff.com/2009/08/02/what-is-the-deal-with-nulls/) is the sharpest short treatment of why NULL semantics are harder to reason about than they appear. Key traps he catalogs:

- **`NOT IN` with a subquery that returns NULLs.** `WHERE x NOT IN (SELECT y …)` returns zero rows the moment the subquery produces any NULL, because `x <> NULL` evaluates to NULL (unknown), not true — and `NOT IN` needs every comparison to be true. There are three safe alternatives:

    ```sql
    -- Broken: returns nothing if any constructor.nationality is NULL
    select surname from f1db.drivers
     where nationality not in (select nationality from f1db.constructors);

    -- Fix 1 — NOT EXISTS: correlated subquery, NULL-safe by design
    select d.surname from f1db.drivers d
     where not exists (
       select 1 from f1db.constructors c
        where c.nationality = d.nationality
     );

    -- Fix 2 — <> ALL with an array literal or parameter
    --   (idiomatic when the exclusion list is known at call time)
    select surname from f1db.drivers
     where nationality <> all(array['British', 'German', 'French']);

    -- or when the list comes from another table, build the array with array_agg:
    with excluded as (
      select array_agg(nationality) as nats
        from f1db.constructors
       where nationality is not null
    )
    select d.surname
      from f1db.drivers d, excluded
     where d.nationality <> all(excluded.nats);
    ```

    `NOT EXISTS` is the idiomatic choice for dynamic exclusion sets. `<> ALL` with an array shines when the exclusion list arrives as a typed parameter (`$1::text[]`) or a short literal — no subquery, no NULL leak.

- **`SUM` ignores NULLs but `+` does not.** Aggregates skip NULL inputs by definition; arithmetic operators propagate them. The same "missing value" is handled opposite ways depending on which construct you use:

    ```sql
    -- SUM of 1, NULL, 2 → 3  (NULL skipped)
    select sum(v) from (values (1), (null), (2)) as t(v);

    -- 1 + NULL + 2 → NULL  (NULL propagates)
    select 1 + null + 2;
    ```

- **NULLs appear even when no NULL exists in the data.** Outer joins and aggregates over empty groups generate NULLs from scratch. A left join to a table that has no matching rows fills the right-side columns with NULL regardless of how clean your data is. An aggregate with no input rows returns NULL for every aggregate function except `COUNT`, which returns `0`:

    ```sql
    -- No NULLs in circuits or races, yet every r.year here is NULL
    select c.name, r.year
      from f1db.circuits c
      left join f1db.races r on r.circuitid = c.circuitid and r.year = 2099
     limit 3;

    -- COUNT returns 0; SUM returns NULL
    select count(*), sum(position)
      from f1db.results
     where raceid = -999;
    ```

- **`p OR NOT p` is not always true.** When `p` is NULL both `p` and `NOT p` are NULL, so the disjunction is NULL — not true. The law of excluded middle does not hold in SQL. This trips up any query rewrite that assumes the complement of a condition covers all remaining rows:

    ```sql
    select null or not null;    -- NULL, not true
    select null and not null;   -- NULL, not true
    ```

- **String concatenation with `||` propagates NULL.** If any operand is NULL the whole expression is NULL. Use `concat()`, which treats NULL as an empty string, or `coalesce` for an explicit default:

    ```sql
    -- NULL if middle initial is unknown
    select 'A.' || null || 'Hamilton';          -- NULL

    -- concat() silently swallows NULL
    select concat('A.', null, 'Hamilton');      -- 'A.Hamilton'

    -- coalesce for an explicit placeholder
    select 'A.' || coalesce(null, '') || 'Hamilton';  -- 'A.Hamilton'
    ```

- **`IS NULL` and `IS NOT NULL` are not boolean complements for composite types (ROW constructors).** For a row value, `IS NULL` is true only when *all* fields are NULL; `IS NOT NULL` is true only when *no* field is NULL. A row that is partially null satisfies neither — meaning `NOT (x IS NULL)` and `x IS NOT NULL` can return different results:

    ```sql
    select row(null, null) is null;      -- true  (all fields null)
    select row(1, null)    is null;      -- false (one field non-null)
    select row(1, null)    is not null;  -- false (one field is null)

    -- NOT IS NULL ≠ IS NOT NULL for partially-null rows:
    select not row(1, null) is null;     -- true  (NOT false)
    select     row(1, null) is not null; -- false
    ```

    A string cannot hold a NULL inside it — `'a' || null` collapses to NULL. A row *can* hold NULL fields while the row itself remains non-null. Davis's article shows an extreme case: `x IS NULL AND x IS DISTINCT FROM NULL` can both be true simultaneously when `x` is `ROW(NULL)` — a composite value whose single field is NULL, which PostgreSQL's `IS NULL` test treats as NULL, yet which `IS DISTINCT FROM NULL` treats as a distinct (composite) value.

His conclusion: NULL semantics are a patchwork of special cases, not a coherent system. The safe approach is to test, not to extrapolate.
