+++
title = "Isolation and Locking"
weight = 20
summary = "The I in ACID: PostgreSQL keeps concurrent transactions from stepping on each other so you don't have to write locking code yourself. Pick the isolation level that matches your correctness needs."
tags = ["Concurrency", "ACID", "Isolation", "Locking", "MVCC"]
book_chapter = "Chapter 37, Isolation and Locking"
+++

The single best reason to use a relational database is that it solves concurrency for you. In an application language you'd reach for mutexes, semaphores, and atomic operations — tricky to get right, brutal to debug. SQL is declarative: you state the result you want, and PostgreSQL is responsible for getting it right *even when many transactions run at once*. That's the **I** in ACID — **Isolation**.

## Isolation levels

The SQL standard defines anomalies that can occur between concurrent transactions: *dirty reads* (seeing uncommitted data), *non-repeatable reads* (a row you read changes underneath you), *phantom reads* (a row set grows), and *serialization anomalies* (the combined outcome matches no serial order). Each isolation level forbids more of them:

- **Read Committed** (the default) — no dirty reads.
- **Repeatable Read** — also no non-repeatable or phantom reads.
- **Serializable** — no anomalies at all; the result is as if transactions ran one at a time.

PostgreSQL doesn't implement *read uncommitted*, and it goes beyond the standard by also blocking phantom reads at Repeatable Read. (`pg_dump` runs at Serializable so your backup is a clean snapshot.)

## What locks protect

PostgreSQL uses MVCC, so readers never block writers and writers never block readers. Locks only matter when two transactions write the *same row*. An `UPDATE` takes a row-level lock; a second `UPDATE` of that row waits until the first commits or rolls back.

```sql
begin;
   update tweet.message
      set rts = rts + 1
    where messageid = 1
returning messageid, rts;
-- transaction left open: the row is now locked
```

A second session running the same statement simply hangs until you `COMMIT`. Under Read Committed it then proceeds; under Repeatable Read it instead fails with `ERROR: could not serialize access due to concurrent update` — and once a transaction errors, even `COMMIT` becomes `ROLLBACK`.

## SELECT ... FOR UPDATE

Sometimes you read a row intending to update it, and you need to lock it *now* so nobody changes it in between. That's what the locking clause is for:

```sql
select rts
  from tweet.message
 where messageid = 1
   for update;
```

The row is held until your transaction ends.

One design lesson worth carrying forward: heavy contention on a single hot row (think a viral tweet's counter) serializes everyone behind a lock. Often the fix is to stop updating a shared row at all — append an `INSERT` instead and compute the total later.
