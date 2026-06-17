+++
title = "Triggers"
weight = 30
summary = "A trigger runs a function automatically when rows change — great for event-driven processing, but a classic way to silently destroy your write throughput if you turn inserts into updates on a shared row."
tags = ["Concurrency", "Triggers", "PL/pgSQL", "Anti-Patterns"]
book_chapter = "Chapter 39, Triggers"
+++

A *trigger* registers a function to run automatically when a table event fires. The timing is `BEFORE`, `AFTER`, or `INSTEAD OF`; the event is `INSERT`, `UPDATE`, `DELETE`, or `TRUNCATE`. Because the function runs inside the same transaction as the statement that fired it, if the function fails the whole transaction aborts. That's a feature: trigger work is atomic with the write that caused it.

You can't write a trigger in plain SQL — you need a procedural language. PL/pgSQL is the default, but PL/Perl, PL/Python, PL/v8, and others all work.

## A worked example

Say you keep a per-message counter cache and want it maintained whenever a row lands in `tweet.activity`. Write a function returning `trigger`, then attach it:

```sql
create or replace function twcache.update_counters()
  returns trigger
  language plpgsql
as $$
begin
  insert into twcache.counters(messageid, rts, favs)
       values (new.messageid,
               case when new.action = 'rt'  then 1 else 0 end,
               case when new.action = 'fav' then 1 else 0 end)
  on conflict (messageid)
    do update set rts  = counters.rts  + excluded.rts,
                  favs = counters.favs + excluded.favs;
  return new;
end;
$$;

create trigger update_counters
   after insert on tweet.activity
   for each row
   execute function twcache.update_counters();
```

Inside the function, `NEW` is the incoming row (`OLD` is the previous version, on `UPDATE`/`DELETE`).

## The caution

Triggers are easy to write, which is exactly why they're dangerous. The example above looks tidy, but it transforms every `INSERT` into `tweet.activity` into an `UPDATE` of one row in `counters` — and if many activities target the same `messageid`, every transaction now queues behind that single row's lock. You just reintroduced the contention you may have been designing to avoid.

Two lessons follow. First, prefer `ON CONFLICT` over the old "try UPDATE, else INSERT" pattern — the hand-rolled version has a real race where two transactions both insert and one fails on the unique constraint. Second, before adding a trigger, ask what it does to your locking. Maintaining a cache synchronously on the write path is often the wrong call.

When you don't want the cache update *inside* the transaction at all, you can have the trigger fire a notification instead — see [LISTEN and NOTIFY](/yesql/concurrency/listen-notify/).
