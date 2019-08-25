+++
title = "PostgreSQL Concurrency: an Article Series"
date = "2018-08-14T11:49:02+03:00"
tags = ["PostgreSQL","YeSQL","Concurrency","DML","LISTEN","NOTIFY","GoLang","JSON"]
categories = ["PostgreSQL","YeSQL"]
coverImage = "/img/concurrency-dogs.jpg"
coverMeta = "in"
coverSize = "partial"
thumbnailImage = "/img/concurrency-logo.png"
thumbnailImagePosition = "left"

+++

[PostgreSQL](https://www.postgresql.org) is a relational database management
system. It's even the world's most advanced open source one of them. As
such, as its core, Postgres solves concurrent access to a set of data and
maintains consistency while allowing concurrent operations.

In the [PostgreSQL Concurrency](/tags/concurrency/) series of articles here
we did see several aspects of how to handle concurrent use cases of your
application design with PostgreSQL. The main thing to remember is that a
Database Management System first task is to handle concurrency access to the
data for you.

<!--more-->

## PostgreSQL Concurrency

In a very classic way, we began our approach to concurrency with a
presentation of the [Data Modification
Language](/blog/2018/06/postgresql-concurrency-data-modification-language/):
the part of SQL that allows to INSERT, UPDATE and DELETE data. And we went
as far designing a small and simple tweeter like application, then using
Shakespeare's _A Midsummer Night's Dream_ play as a source of tweets!

We then reviewed [Isolation and
Locking](/blog/2018/07/postgresql-concurrency-isolation-and-locking/) and
how PostgreSQL provides strong *ACID* guarantees in all your transactions.
The *I* in *ACID* stands for *Isolation*, and by the way the SQL standard
comes with four different isolation levels. The default isolation level in
PostgreSQL is _read committed_ where it would be fair to expect _repeatable
read_. It's quite important that you understand the difference in between
those two when designing your application, so be sure to check out that
article if you're not so sure.

The next article in the series then logically deals with [Modeling for
Concurrency](/blog/2018/07/modeling-for-concurrency/), with benchmarks to
compare performances of an UPDATE heavy design and an INSERT mostly design.
When dealing with registering and processing of events in PostgreSQL, if you
don't need the processing to be visible at COMMIT time when adding the
event, then it's a good idea to use an INSERT and delayed processing
approach.

If you do that though, then how to implement the delayed processing? Well
I'm glad you're asking, and there are more than one way to answer that:

  - In [Computing and Caching](/blog/2018/07/computing-and-caching/), we see
    how to use a MATERIALIZED VIEW to get a fixed snapshot of the data, and
    then easily REFRESH it to implement the application's cache invalidation
    policy.
    
    This technique is well adapted to use cases where you want to rebuild
    your cache every once in a while, maybe every night, or several times a
    day, down to maybe every five minutes if the refreshing of the cache is
    really fast.
    
  - In [PostgreSQL Event Based
    Processing](/blog/2018/07/postgresql-event-based-processing/) we see how
    to use TRIGGERs to maintain a transactionally correct cache, and the
    impact of such a choice on the scalability properties of your database
    backend.
    
    This solution is well suited to use case where the application only
    receives a small amount of UPDATE traffic, and quite far apart, and
    can't tolerate any lag when using the cache.
    
  - In [PostgreSQL LISTEN/NOTIFY](/blog/2018/07/postgresql-listen/notify/)
    we see how to build an online cache maintenance service with
    PostgreSQL's advanced notification features.
    
    This solution is well suited to use cases where a small amount of lag
    can be tolerated, up to maybe some seconds, most typically measured in
    the hundreds of milliseconds.

Another important activity where we need to carefully deal with concurrency
issues is when processing batches of new data to merge with the current
dataset. The article [Batch Updates and
Concurrency](/blog/2018/07/batch-updates-and-concurrency/) deals with that
and introduces some advanced PostgreSQL support.

And rather than waving away at using cron jobs to implement batch
activities, the article [Scheduled Data Processing: How to use
cron?](/blog/2018/08/scheduled-data-processing-how-to-use-cron/) details a
full technical solution to implemeting those bacthes… still on-top of cron.

## Conclusion

The whole article series is extracted from my book [Mastering PostgreSQL in
Application Development](https://masteringpostgresql.com), which teaches SQL
to developers so that they may replace thousands of lines of code with very
simple queries. The book has a full chapter about *Data Manipulation and
Concurrency Control* in PostgreSQL, including caching with materialized
views, check it out!
