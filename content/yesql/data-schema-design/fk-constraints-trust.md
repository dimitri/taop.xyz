+++
title = "Foreign Key Constraints and What the Planner Knows"
weight = 30
summary = "A foreign key is not just validation — it is a declaration that tells the query planner something is guaranteed, enabling optimizations it cannot safely make without that guarantee."
tags = ["data modeling", "foreign key", "constraints", "query planner", "PostgreSQL"]
course_title = "Data Modeling for Performance"
course_url = "/course/"
cta_eyebrow = "Keep going"
cta_title = "Data Modeling for Performance"
cta_body = "Constraints are chapter one. The course covers primary key design, relationship patterns, index selection, schema evolution, and the full trade-off picture between strict normalization and practical denormalization."
cta_url = "/course/"
cta_label = "Explore the Course"
lab_datasets = "chinook, f1db"
+++

**chinook** is a digital music store. Artists release albums; albums contain
tracks; customers buy tracks through invoices. The pivot between the catalogue
and the purchase side is `invoice_line`: each row records one track sold on
one invoice.

![Chinook: invoice_line carries declared foreign keys to track and invoice](/img/diagrams/fig-chinook-invoice-erd.svg)

`\d chinook.invoice_line` shows both relationships declared as foreign keys:

```sql
\d chinook.invoice_line
```

```
                   Table "chinook.invoice_line"
     Column      |     Type      | Nullable
-----------------+---------------+---------
 invoice_line_id | integer       | not null
 invoice_id      | integer       | not null
 track_id        | integer       | not null
 unit_price      | numeric(10,2) | not null
 quantity        | integer       | not null
Indexes:
    "invoice_line_pkey" PRIMARY KEY, btree (invoice_line_id)
    "invoice_line_invoice_id_idx" btree (invoice_id)
    "invoice_line_track_id_idx" btree (track_id)
Foreign-key constraints:
    "invoice_line_invoice_id_fkey" FOREIGN KEY (invoice_id)
        REFERENCES chinook.invoice(invoice_id)
    "invoice_line_track_id_fkey" FOREIGN KEY (track_id)
        REFERENCES chinook.track(track_id)
```

Both `track_id` and `invoice_id` are NOT NULL with a declared FK. The database
rejects any insert that violates either constraint. The planner knows — because
it is declared — that every `invoice_line` row has exactly one matching `track`
and exactly one matching `invoice`.

---

**f1db** is a Formula 1 race results database. Drivers race in rounds organised
by season; every finishing position is recorded in `results`. Each row carries
a `raceid` pointing to the race it belongs to.

![f1db: results references races by raceid, but no FK is declared](/img/diagrams/fig-f1db-results-erd.svg)

`\d f1db.results` shows the same kind of column — and no Foreign-key
constraints section:

```sql
\d f1db.results
```

```
               Table "f1db.results"
    Column     |       Type       | Nullable
---------------+------------------+---------
 resultid      | bigint           | not null
 raceid        | bigint           | not null
 driverid      | bigint           | not null
 constructorid | bigint           | not null
 positionorder | bigint           | not null
 points        | double precision | not null
 statusid      | bigint           | not null
Indexes:
    "idx_49569_primary" PRIMARY KEY, btree (resultid)
```

`raceid` is an unconstrained `bigint`. Nothing stops a `results` row from
carrying a `raceid` that does not exist in `races`. The relationship is in the
application's intent — not in the database's declarations.

---

Both schemas model the same logical pattern: a detail table with columns that
reference other tables. The difference is what is declared. That declaration is
what the planner sees.

### Join elimination

When you join two tables but need no columns from the right-hand side, the
planner can skip the join entirely — provided it can prove the join would
neither filter rows nor multiply them. The condition: the right-side join
column must be unique (a primary key satisfies this), and for a `LEFT JOIN`
the planner can always prove row preservation.

```sql
-- We want invoice line details; we happen to join track but select nothing from it
select il.invoice_line_id,
       il.unit_price,
       il.quantity
  from chinook.invoice_line il
  left join chinook.track t on t.track_id = il.track_id;
```

```
 Seq Scan on invoice_line il  (cost=0.00..37.40 rows=2240 width=13)
```

No join in the plan at all — just a sequential scan of `invoice_line`. The
`track` table is never read. The same elimination happens on `f1db`:

```sql
select res.resultid,
       res.points
  from f1db.results res
  left join f1db.races r on r.raceid = res.raceid;
```

```
 Seq Scan on results res  (cost=0.00..647.97 rows=23597 width=16)
```

Both `track.track_id` and `races.raceid` are primary keys — that unique
constraint alone is what the planner needs to eliminate a `LEFT JOIN`.

### Where `INNER JOIN` differs

Switch to `INNER JOIN` and the plan changes:

```sql
select il.invoice_line_id,
       il.unit_price,
       il.quantity
  from chinook.invoice_line il
  join chinook.track t on t.track_id = il.track_id;
```

```
 Hash Join  (cost=123.82..167.11 rows=2240 width=13)
   Hash Cond: (il.track_id = t.track_id)
   ->  Seq Scan on invoice_line il  (cost=0.00..37.40 rows=2240 width=17)
   ->  Hash  (cost=80.03..80.03 rows=3503 width=4)
         ->  Seq Scan on track t  (cost=0.00..80.03 rows=3503 width=4)
```

The join is no longer eliminated. An `INNER JOIN` only keeps rows that match on
both sides — the planner cannot eliminate it unless it can prove that every
left-hand row has a match on the right. The FK + NOT NULL declaration on
`invoice_line.track_id` is exactly that proof: it says that no `invoice_line`
row can exist without a matching `track` row. PostgreSQL's current optimizer
does not yet exploit this to eliminate the inner join in the execution plan,
but it does use the declaration in two ways: row count estimates (the planner
knows the join output equals the `invoice_line` cardinality), and to verify
that `LEFT JOIN` and `INNER JOIN` are semantically equivalent for this pair.

### What FK enforces that UNIQUE alone cannot

The primary key on `track.track_id` enables the `LEFT JOIN` elimination in
both schemas. What only the foreign key adds is the write-time check:

```sql
-- chinook rejects this:
insert into chinook.invoice_line (invoice_line_id, invoice_id, track_id, unit_price, quantity)
values (9999, 1, 99999, 0.99, 1);
-- ERROR:  insert or update on table "invoice_line" violates foreign key constraint
-- DETAIL: Key (track_id)=(99999) is not present in table "track".

-- f1db accepts the equivalent silently (no FK to check)
```

`f1db` currently has no orphan rows — confirmed by a `NOT EXISTS` check — but
that is a property of how the data was imported, not something the database
enforces. One bad import or application bug and `INNER JOIN` would silently
drop those results rows. `LEFT JOIN` would surface them as rows with NULLs on
the race side. Without a FK, you cannot tell which result is correct without
reading the application code.

With `chinook`'s FK in place, `INNER JOIN` and `LEFT JOIN` are guaranteed to
return the same number of rows for `invoice_line`. The planner knows it. The
optimizer can act on it. And the database enforces it at every insert and
update.

Foreign keys are also the most reliable form of schema documentation: reading
`pg_constraint` tells you exactly which columns reference which tables, at what
cardinality, and what cascades. That information is not in application code, not
in a README, and not in anyone's head — it is in the catalog, always current.
