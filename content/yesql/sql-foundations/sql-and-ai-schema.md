+++
title = "The Schema Decision AI Cannot Make"
weight = 90
summary = "AI tools default to TEXT columns and application logic because they do not know what your database can express. Knowing PostgreSQL's range types, exclusion constraints, and generated columns changes what you ask for — and what you get."
tags = ["SQL", "Schema Design", "Range Types", "Exclusion Constraints", "AI", "PostgreSQL"]
lab_datasets = "f1db"
+++

The most consequential SQL decisions happen before a single query is written.

When you ask an AI to design a schema for storing driver career histories — which constructor each driver was with, and when — you will typically get something like this:

```sql
create table driver_contract (
    id          serial      primary key,
    driver_id   int         not null references drivers(driverid),
    constructor text        not null,
    start_year  int,
    end_year    int
);
```

This works in the sense that you can store data in it. It enforces nothing. Two rows could claim the same driver was at two different constructors in the same year. The overlap detection — if any — lives in your application code, where it will be quietly wrong when a concurrent transaction writes a conflicting row, or when someone imports data with a script that bypasses the checks.

### What PostgreSQL can actually do here

PostgreSQL has range types — `int4range`, `daterange`, `tstzrange` — and their multi-interval counterparts: `int4multirange`, `datemultirange`, `tstzmultirange`. A range stores a single start-to-end interval as one value with built-in operators for containment (`@>`), overlap (`&&`), adjacency (`-|-`), and more. A multirange stores *any number* of non-overlapping intervals as a single column value.

That distinction matters here. Fernando Alonso drove for McLaren in 2007, then left, then returned from 2015 to 2017. With separate `start_year`/`end_year` columns you need two rows to represent his McLaren relationship. With `int4multirange` you need one:

```
active_years = '{[2007,2008), [2015,2018)}'
```

His two Renault stints (2003–2006, then 2008–2009 after his single McLaren year) collapse the same way.

Paired with a GiST exclusion constraint, the database enforces non-overlap at write time — no trigger needed:

```sql
create table sandbox.driver_contract_range (
    driver_id    int              not null,
    constructor  text             not null,
    active_years int4multirange   not null,
    exclude using gist (driver_id with =, active_years with &&)
);
```

The `EXCLUDE USING GIST` clause says: no two rows with the same `driver_id` may have *overlapping* `active_years` values. The `&&` operator is the range-overlap test; it works identically on multiranges.

Populate it with real F1 career data:

```sql
insert into sandbox.driver_contract_range (driver_id, constructor, active_years) values
    (1,  'McLaren',    '{[2007,2013)}'),
    (1,  'Mercedes',   '{[2013,2018)}'),
    (30, 'Jordan',     '{[1991,1992)}'),
    (30, 'Benetton',   '{[1992,1996)}'),
    (30, 'Ferrari',    '{[1996,2007)}'),
    (30, 'Mercedes',   '{[2010,2013)}'),
    (20, 'Toro Rosso', '{[2007,2009)}'),
    (20, 'Red Bull',   '{[2009,2015)}'),
    (20, 'Ferrari',    '{[2015,2018)}'),
    (4,  'Minardi',    '{[2001,2002)}'),
    (4,  'Renault',    '{[2003,2007), [2008,2010)}'),
    (4,  'McLaren',    '{[2007,2008), [2015,2018)}'),
    (4,  'Ferrari',    '{[2010,2015)}');
```

The `{...}` wrapper is the multirange literal syntax. A value like `'{[2003,2007), [2008,2010)}'` holds two subranges; a value like `'{[2007,2013)}'` holds one. Both are valid `int4multirange` values. Each subrange uses the standard half-open notation: inclusive on the left, exclusive on the right.

![Fernando Alonso career timeline showing multirange active_years values and @> containment query at 2010](/img/diagrams/fig-multirange-career.svg)

### Point-in-time queries with a single operator

The `@>` (containment) operator answers "does this range contain this value?" — and it works across all subranges of a multirange in a single check:

```sql
select d.forename || ' ' || d.surname as driver,
       c.constructor
  from sandbox.driver_contract_range c
  join f1db.drivers d on d.driverid = c.driver_id
 where c.active_years @> 2010
 order by driver;
```

```
       driver       │ constructor
════════════════════╪═════════════
 Fernando Alonso    │ Ferrari
 Lewis Hamilton     │ McLaren
 Michael Schumacher │ Mercedes
 Sebastian Vettel   │ Red Bull
(4 rows)
```

The 2010 season: Alonso starting his Ferrari era, Hamilton at McLaren, Schumacher coming out of retirement at Mercedes, Vettel beginning his dominant Red Bull years. The query needs no date arithmetic, no `BETWEEN`, no `start_year <= 2010 AND (end_year IS NULL OR end_year > 2010)` gymnastics. One operator, one check per column value regardless of how many subranges it contains.

### The constraint fires at write time

Now try inserting a row that overlaps with Hamilton's existing McLaren stint:

```sql
insert into sandbox.driver_contract_range (driver_id, constructor, active_years)
values (1, 'Red Bull', '{[2011,2014)}');
```

```
ERROR:  conflicting key value violates exclusion constraint
        "driver_contract_range_driver_id_active_years_excl"
DETAIL: Key (driver_id, active_years)=(1, {[2011,2014)}) conflicts with
        existing key (driver_id, active_years)=(1, {[2007,2013)}).
```

The database rejected it. No application logic ran. No trigger was needed. The constraint checked the incoming multirange against every existing range for `driver_id = 1` using the GiST index and refused the write the moment it found an overlap.

The TEXT-column schema with separate `start_year` and `end_year` columns cannot express this constraint at all. You cannot write `EXCLUDE USING GIST` on two integer columns — the operator class does not exist for plain integers paired with equality. You need a range type, and once you have one, the step to multirange costs nothing.

### Why this matters in the AI context

An AI given the prompt "design a table to store which constructor each driver was with and when" will produce the TEXT/integer version. It does not know that `int4multirange` exists. It does not know that `EXCLUDE USING GIST` can enforce non-overlap at the database level. It will not volunteer these options unprompted.

If you know they exist, you ask a different question:

> *"Design a table to store F1 driver constructor contracts, using int4multirange for the active periods and an exclusion constraint to prevent a driver from appearing at two constructors in the same season."*

That prompt produces the multirange schema. The AI can write the SQL once you tell it what to use. The knowledge of *what to ask for* — of what PostgreSQL can express — is yours to supply.

This is the structural reason why SQL literacy matters in the AI era. The database's expressive range — range types, exclusion constraints, generated columns, `MERGE`, row-level security, partial indexes — is not visible to an AI that has not been told to reach for it. You know your requirements. You now need to know what the database can do with them.
