+++
title = "Why Postgres?"
weight = 30
summary = "PostgreSQL is not just storage — it is a concurrent data-access service. Here is what that means, and why the PostgreSQL project specifically is the right choice for any serious application."
tags = ["PostgreSQL", "Architecture", "Concurrency"]
book_chapter = "Chapter 3, Software Architecture"
aliases = ["/blog/2019-09-why-postgres/"]
lab_datasets = "f1db, chinook"
+++

The following concepts are important to keep in mind when working with PostgreSQL:

#### Relational Database Management System

PostgreSQL is an RDBMS and as such its role in your software
architecture is to handle **concurrent access** to **live data** that is
manipulated by several applications, or several parts of an application.

Typically we will find the user-side parts of the application, a
front-office and a user back-office with a different set of features
depending on the user role, including some kinds of reporting
(accounting, finance, analytics), and often some glue scripts here and
there, crontabs or the like.

<figure>
  <img src="/img/diagrams/fig-data-access-service.svg" alt="PostgreSQL as a concurrent data-access service">
  <figcaption>PostgreSQL acts as a concurrent data-access service: every application component — front-office, back-office, reporting, background scripts — shares one consistent view of the live data through a single SQL API.</figcaption>
</figure>

#### Atomic, Consistent, Isolated, Durable

At the heart of the concurrent access semantics is the concept of a
transaction. A transaction should be **atomic** and **isolated**, the
latter allowing for *online backups* of the data.

Additionally, the RDBMS is tasked with maintaining a data set that is
**consistent** with the business rules at all times. That's why database
modeling and normalization tasks are so important, and why PostgreSQL
supports an advanced set of *constraints*.

**Durable** means that whatever happens PostgreSQL guarantees that it
won't lose any *committed* change. Your data is safe. Not even an OS
crash is allowed to risk your data. We're left with disk corruption
risks, and that's why being able to carry out *online backups* is so
important.

<figure>
  <img src="/img/diagrams/fig-acid.svg" alt="The four ACID guarantees">
  <figcaption>The four ACID guarantees a transaction provides are the heart of how PostgreSQL keeps data correct under concurrent access: Atomic means all-or-nothing, Consistent means business rules hold before and after, Isolated means concurrent transactions do not see each other's partial work, and Durable means a committed change survives any crash.</figcaption>
</figure>

#### Data Access API and Service

Given the characteristics listed above, PostgreSQL allows one to
implement a data access API. In a world of containers and
micro-services, PostgreSQL is the data access service, and its API is
SQL.

If it looks a lot heavier than your typical micro-service, remember that
PostgreSQL implements a **stateful service**, on top of which you can
build the other parts. Those other parts will be scalable and highly
available by design, because solving those problems for *stateless*
services is so much easier.

#### Structured Query Language

The data access API offered by PostgreSQL is based on the SQL
programming language. It's a **declarative** language where your job as
a developer is to describe in detail the *result set* you are interested
in.

PostgreSQL's job is then to find the most efficient way to access only
the data needed to compute this result set, and execute the plan it
comes up with.

#### Extensible (JSON, XML, Arrays, Ranges)

The SQL language is statically typed: every query defines a new relation
that must be fully understood by the system before executing it. That's
why sometimes *cast* expressions are needed in your queries.

PostgreSQL's unique approach to implementing SQL was invented in the 80s
with the stated goal of enabling extensibility. SQL operators and
functions are defined in a catalog and looked up at run-time. Functions
and operators in PostgreSQL support *polymorphism* and almost every part
of the system can be extended.

This unique approach has allowed PostgreSQL to be capable of improving
SQL; it offers a deep coverage for composite data types and documents
processing right within the language, with clean semantics.

So when designing your software architecture, think about PostgreSQL not as
*storage* layer, but rather as a *concurrent data access service*. This
service is capable of handling data processing. How much of the processing
you want to implement in the SQL part of your architecture depends on many
factors, including team size, skill set, and operational constraints.

### Why PostgreSQL?

While this course focuses on teaching SQL and how to make the best of this
programming language in modern application development, it only addresses
the PostgreSQL implementation of the SQL standard. That choice is down to
several factors, all consequences of PostgreSQL truly being *the world's
most advanced open source database*:

  - PostgreSQL is open source, available under a BSD-like licence named the
    [PostgreSQL licence](https://www.postgresql.org/about/licence/).

  - The PostgreSQL project is done completely in the open, using public
    mailing lists for all discussions, contributions, and decisions, and the
    project goes as far as self-hosting all requirements in order to avoid
    being influenced by a particular company.

  - While being developed and maintained in the open by volunteers, most
    PostgreSQL developers today are contributing in a professional capacity,
    both in the interest of their employer and to solve real customer
    problems.

  - PostgreSQL releases a new major version about once a year, following a
    *when it's ready* release cycle.

  - The PostgreSQL design, ever since its Berkeley days under the
    supervision of [Michael
    Stonebraker](https://en.wikipedia.org/wiki/Michael_Stonebraker), allows
    enhancing SQL in very advanced ways, as we see in the data types and
    indexing support parts of this book.

  - The PostgreSQL documentation is one of the best reference manuals you
    can find, open source or not, and that's because a patch in the code is
    only accepted when it also includes editing the parts of the
    documentations that need editing.

  - While new NoSQL systems are offering different trade-offs in terms of
    operations, guarantees, query languages and APIs, I would argue that
    PostgreSQL is YeSQL!

In particular, the extensibility of PostgreSQL allows this 20-year-old
system to keep renewing itself. As a data point, this extensibility design
makes PostgreSQL one of the best JSON processing platforms you can find.

It makes it possible to improve SQL with advanced support for new data types
even from "userland code", and to integrate processing functions and
operators and their indexing support.

We'll see lots of examples of that kind of integration in this course. One of
them is a query used in the schemaless design section where we deal with a
Magic™ The Gathering set of cards imported from a JSON data set:

```sql
select jsonb_pretty(data)
  from magic.cards
 where data @> '{
                 "type":"Enchantment",
                 "artist":"Jim Murray",
                 "colors":["White"]
                }';
```

The `@>` operator reads *contains* and implements JSON searches, with
support from a specialized GIN index if one has been created. The
*jsonb_pretty()* function does what we can expect from its name, and the
query returns *magic.cards* rows that match the JSON criteria for given
*type*, *artist* and *colors* key, all as a pretty printed JSON document.

PostgreSQL extensibility design is what allows one to enhance SQL in that
way. The query still fully respects SQL rules, there are no tricks here. It
is only functions and operators, positioned where we expect them in the
*where* clause for the searching and in the *select* clause for the
projection that builds the output format.
