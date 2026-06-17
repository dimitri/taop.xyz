+++
title = "LISTEN and NOTIFY"
weight = 40
summary = "PostgreSQL can push messages to connected clients, giving you a lightweight pub/sub bus inside your database — perfect for cache invalidation, awkward for durable queues."
tags = ["Concurrency", "LISTEN", "NOTIFY", "Pub/Sub", "Cache"]
book_chapter = "Chapter 40, Listen and Notify"
+++

The PostgreSQL wire protocol supports asynchronous messages: once a client is connected, the server can push it a message even while it sits idle. Two commands expose this as a publish/subscribe bus. A client subscribes to a channel with `LISTEN`, and anyone can publish with `NOTIFY channel, 'payload'`.

```sql
yesql# listen channel;
LISTEN

yesql# notify channel, 'foo';
NOTIFY
Asynchronous notification "channel" with payload "foo"
received from server process with PID 40430.
```

The publisher and subscriber are usually different connections — open two `psql` sessions and try it. The payload is any text up to 8 kB, so JSON travels nicely.

## Why this matters

Notifications are sent at transaction *commit* time, in commit order, and add essentially no overhead — they ride the same serialization the commit log already does. That makes them ideal for decoupling work from a hot write path. The recurring example in this material: maintaining a per-message counter cache. Instead of a trigger that updates a shared row synchronously (and serializes every writer behind a lock), the trigger just `NOTIFY`s a channel with the change as JSON. A single long-lived daemon `LISTEN`s, accumulates the deltas in memory, and periodically materializes them. One writer to the cache means no contention.

```sql
listen "tweet.activity";

insert into tweet.activity(messageid, action) values (33, 'rt');
```

```
INSERT 0 1
Asynchronous notification "tweet.activity" with payload
"{"messageid":33,"rts":1,"favs":0}" received from
server process with PID 73216.
```

One subtlety to know: if the same channel gets identical payloads multiple times within one transaction, PostgreSQL may fold them into a single delivery. Distinct payloads, and notifications from different transactions, are always delivered separately and in order.

## What it is not

`LISTEN`/`NOTIFY` is fire-and-forget. Messages reach only clients connected *at the moment of commit* — if no one is listening, the event is gone. So this is not a durable queue: you cannot use it where events must survive until a worker reconnects. A cache maintainer is the perfect fit precisely because it can rebuild from the source of truth on startup, then process notifications from there.

Driver support varies — some (Go's `pq`, Python's `psycopg`) deliver notifications without polling; the JDBC driver requires you to poll. Check yours before you build on it.
