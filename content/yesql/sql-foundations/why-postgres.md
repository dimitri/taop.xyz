+++
title = "Why Postgres?"
weight = 30
summary = "An RDBMS is not a storage solution. The problem Postgres really solves is concurrency — serving many users correct, live data across transactional and analytical workloads alike."
tags = ["PostgreSQL", "Architecture", "Concurrency"]
book_chapter = "Chapter 3, Software Architecture"
+++

That's a very popular question these days. The quick answer is the project's own
slogan: *“PostgreSQL: The World's Most Advanced Open Source Relational
Database.”* But what does that mean for you, the developer?

The main area where I think many people get it wrong is this:

> **Postgres is an RDBMS. An RDBMS is not a storage solution. Do not use Postgres
> to solve a storage problem.**

The main problem Postgres and other RDBMS solve is **concurrency**. You want your
application to serve many users at the same time — and nowadays that has to
happen online, with no off-hours for maintenance or for reconciling the day's
activity into a reporting system.

## System of records, dashboards, and analytics

We increasingly want access to our data *as it happens*, not a snapshot of
yesterday. Think of bank statements: not long ago, up-to-yesterday-4pm was a fine
answer. Now we get a text message seconds after a payment — especially if it's
unusual. We want dashboards and analytics over data that's still being written,
with users never having to think about it.

That's **why** you use Postgres. As an RDBMS it knows how to handle concurrency
and very diverse workloads. You can implement your transactional system of
records and, at the same time, deliver customer and activity dashboards and
analytics.

## Why SQL?

To support all of that on one technology, you need a language for both very
simple transactions and quite complex analytics. That's exactly what SQL was
designed for.

`BEGIN`, `COMMIT`, and `ROLLBACK` are the Transaction Control Language — the
**A** and **I** of ACID, Atomic and Isolated, and how you implement concurrency
as a developer. SQL covers CRUD easily, and it's very good at *batching*:
remember that you can use JOINs in your `INSERT`, `UPDATE`, and `DELETE`
statements, handling any number of rows at once.

SQL is good at analytics too. With `GROUPING SETS`, window functions, advanced
aggregates, sub-queries, and Common Table Expressions, what you can express in a
single statement is almost endless. A strong understanding of
[what a relation is](/yesql/sql-foundations/what-is-a-relation/) and
[what a JOIN is](/yesql/querying-data/what-is-a-join/) is key to your success.

## Extensions

Some things are hard to do in SQL — and that's where extensions come in. In
distributed systems you decide whether to send the computation to the data, or
the data to the computation. With Postgres it's the same choice: pull the data
into your application nodes, or process it where it lives. Reducing the data that
crosses the network is often the most efficient option — and that's why we have
extensions like **PostGIS**, for geo-spatial joins that return exactly the data
you need.

## Licensing

Postgres is Open Source, with no single entity behind it. Some companies have
built businesses around contributing to it, but any individual can contribute —
all in the open, on public mailing lists. Even the website, the mailing-list
system, and the conference software are Open Source, managed by the community,
and welcoming new contributions.

## So, why Postgres?

To build an application that is correct under concurrency, versatile in
architecture (CRUD, system of records, OLTP — and also OLAP, analytics,
dashboards), and powerful in computation — so you can choose, case by case, where
processing happens without re-architecting anything.

If you're not sure which transactional system to use, just use Postgres. You'll
never be wrong picking it. And if you ever hit truly exceptional scale, it's
usually easy to move just that part to a specialized system and plug it back into
the rest of your application — the part that still runs on Postgres.
