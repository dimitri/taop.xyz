+++
title = "INSERT, UPDATE, DELETE — and RETURNING"
weight = 10
summary = "The three DML commands share two superpowers most developers never use: a RETURNING clause that hands back the rows you touched, and the ability to drive changes from a query."
tags = ["SQL", "DML", "RETURNING", "UPSERT"]
book_chapter = "Chapter 36, Insert, Update, Delete"
+++

You already know how to `INSERT`, `UPDATE`, and `DELETE`. What you might not know is that in PostgreSQL all three are *projections*, just like `SELECT`. That single idea unlocks the features that turn round-trips into one statement.

## RETURNING: stop re-selecting

After you modify a row, you usually need to know what happened — the generated id, the default value the database chose, the final state of the row. The reflex is to fire a follow-up `SELECT`. Don't. Add `RETURNING`:

```sql
insert into tweet.users (uname, bio)
     values ('Puck', 'or Robin Goodfellow.')
returning userid, uname;
```

```
 userid │ uname
════════╪═══════
     17 │ Puck
(1 row)
```

`RETURNING *` works on `UPDATE` and `DELETE` too. No extra round-trip, and no race where another transaction changes the row between your write and your read.

## ON CONFLICT: upsert done right

"Insert it, but if it already exists, update it instead" is a classic concurrency trap when you roll it by hand — two transactions both see "not there" and both insert. `INSERT ... ON CONFLICT` makes the database arbitrate atomically against a unique constraint:

```sql
insert into twcache.counters(messageid, rts, favs)
     values (1, 1, 0)
on conflict (messageid)
  do update set rts = counters.rts + excluded.rts;
```

`excluded` refers to the row you tried to insert. Use `DO NOTHING` when you just want inserts to be idempotent.

## Drive changes from a query

`UPDATE` and `DELETE` are set-based. You don't loop in your application — you express intent once. `UPDATE` borrows a `FROM` clause to join, and you can even reuse a row's own data:

```sql
update tweet.users
   set nickname = uname
 where nickname is null;
```

A useful safety habit: when fixing data by hand, wrap it in `BEGIN; ... RETURNING *;` and inspect the output before you `COMMIT`. If the count is wrong, `ROLLBACK`. Matching on a primary key *and* a known value (e.g. `where userid = 17 and uname = 'Puck'`) also doubles as a concurrency check — if someone renamed the row first, you update zero rows instead of clobbering their change.

Set-based writes raise the obvious next question: what happens when two of them hit the same row at once? That's [isolation and locking](/yesql/concurrency/isolation-and-locking/).
