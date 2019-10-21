+++
date = "2019-10-14T00:05:00+02:00"
title = "Table of Content"
tags = ["Table of Content"]
coverImage = "/img/nicole-honeywill-sincerely-media-nGrfKmtwv24-unsplash.jpg"
+++

<div>
    <p style="text-align: right;">
    Photo by 
<a style="background-color:black;color:white;text-decoration:none;padding:4px 6px;font-family:-apple-system, BlinkMacSystemFont, &quot;San Francisco&quot;, &quot;Helvetica Neue&quot;, Helvetica, Ubuntu, Roboto, Noto, &quot;Segoe UI&quot;, Arial, sans-serif;font-size:12px;font-weight:bold;line-height:1.2;display:inline-block;border-radius:3px" href="https://unsplash.com/@nicolehoneywill_sincerelymedia?utm_medium=referral&amp;utm_campaign=photographer-credit&amp;utm_content=creditBadge" target="_blank" rel="noopener noreferrer" title="Download free do whatever you want high-resolution photos from Nicole Honeywill / Sincerely Media"><span style="display:inline-block;padding:2px 3px"><svg xmlns="http://www.w3.org/2000/svg" style="height:12px;width:auto;position:relative;vertical-align:middle;top:-2px;fill:white" viewBox="0 0 32 32"><title>unsplash-logo</title><path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z"></path></svg></span><span style="display:inline-block;padding:2px 3px">Nicole Honeywill / Sincerely Media</span></a>
   </p>
</div>

Each part of [The Art of PostgreSQL](https://theartofpostgresql.com) can be
read on its own, or you can read this book from the first to the last page
in the order of the parts and chapters therein. A great deal of thinking
have been put in the ordering of the parts, so that reading “The Art of
PostgreSQL” in a linear fashion should provide the best experience.

The skill progression throughout the book is not linear. Each time a new SQL
concept is introduced, it is presented with simple enough queries, in order
to make it possible to focus on the new notion. Then, more queries are
introduced to answer more interesting business questions. 

Complexity of the queries usually advances over the course of a given part,
chapter after chapter. Sometimes, when a new chapter introduces a new SQL
concept, complexity is reset to very simple queries again. That's because
for most people, learning a new skill set does not happen in a linear way.
Having this kind of difficulty organisation also makes it easier to dive
into a given chapter out-of-order.

Here's a breakdown of what each chapter contains:

### Part 1, Preface

The preface is a presentation of the book and what to expect from it.

### Part 2, Introduction

The introduction of this book intends to convince application developers
such as you, dear reader, that there's more to SQL than you might think. It
begins with a very simple data set and simple enough queries, that we
compare to their equivalent Python code. Then we expand from there with a
very important trick that's not well known, and a pretty advanced variation
of it.

### Part 3, Writing SQL Queries

The third part of the book covers how to write a SQL query as an application
developer. We answer several important questions here:

  - Why using SQL rather than your usual programming language?
  - How to integrate SQL in your application source code?
  - How to work at the SQL prompt, the `psql` REPL?
  - What's an indexing strategy and how to approach indexing?

A simple Python application is introduced as a practical example
illustrating the different answers provided. In particular, this part
insists on when to use SQL to implement business logic.

Part 3 concludes with an interview with **Yohan Gabory**, author of a French
book that teaches how to write advanced web application with Python and
Django.

### Part 4, SQL Toolbox

The fourth part of [The Art of PostgreSQL](https://theartofpostgresql.com)
introduces most of the SQL concepts that you need to master as an
application developer. It begins with the basics, because you need to build
your knowledge and skill set on-top of those foundations.

Advanced SQL concepts are introduced with practical examples: every query
refers to a data model that's easy to understand, and is given in the
context of a “business case”, or “user story”.

This part covers SQL clauses and features such as ORDER BY and k-NN sorts,
the GROUP BY and HAVING clause and GROUPING SETS, along with classic and
advanced aggregates, and then window functions. This part also covers the
infamous NULL, and what's a relation and a join.

Part 5 concludes with an interview with [Markus Winand](https://winand.at),
author of “SQL Performance explained” and <http://use-the-index-luke.com>.
Markus is a master of the SQL standard and he is a wizard on using SQL to
enable fast application delivery and solid run-time performances!

### Part 5, Data Types

The fifth part of this book covers the main PostgreSQL data types you can
use and benefit from as an application developer. PostgreSQL is an ORDBMS:
Object-Oriented Relation Database Manager. As a result, data types in
PostgreSQL are not just the classics numbers, dates, and text. There's more
to it, and this part covers a lot of ground.

Part 5 concludes with an interview with **Grégoire Hubert**, author of the
[POMM](http://www.pomm-project.org) project, which provides developers with
unlimited access to SQL and database features while proposing a high-level
API over low-level drivers.

### Part 6, Data Modeling

The sixth part of [The Art of PostgreSQL](https://theartofpostgresql.com)
covers the basics of relational data modeling, which is the most important
skill you need to master as an application developer. Given a good database
model, every single SQL query is easy to write, things are kept logical, and
data is kept clean. With a bad design… well my guess is that you've seen
what happens with a not-great data model already, and in many cases that's
the root of developers' dislike for the SQL language.

This part comes late in the book for a reason: without knowledge of some of
the advanced SQL facilities, it's hard to anticipate that a data model is
going to be easy enough to work with, and developers then tend to apply
early optimizations to the model to try to simplify writing the code. Well,
most of those *optimizations* are detrimental to our ability to benefit from
SQL.

Part 6 concludes with an interview with [Álvaro Hernández
Tortosa](https://twitter.com/ahachete), who built the
[ToroDB](https://www.torodb.com) project, a MongoDB replica solution based
on PostgreSQL! His take on relational database modeling when compared to
NoSQL and document based technologies and APIs is the perfect conclusion of
the database modeling part.

### Part 7, Data Manipulation and Concurrency Control

The seventh part of this book covers DML and concurrency, the heart of any
live database. DML stands for “Data Manipulation Language”: it's the part of
SQL that includes INSERT, UPDATE, and DELETE statements.

The main feature of any RDBMS is how it deals with concurrent access to a
single data set, in both reading and writing. This part covers isolation and
locking, computing and caching in SQL complete with cache invalidation
techniques, and more.

Part 7 concludes with an interview with [Kris
Jenkins](http://blog.jenkster.com), a functional programmer and open-source
enthusiast. He mostly works on building systems in Elm, Haskell & Clojure,
improving the world one project at a time, and he's the author of the
[YeSQL](https://github.com/krisajenkins/yesql) library.

### Part 8, PostgreSQL Extensions

The eighth part of [The Art of PostgreSQL](https://theartofpostgresql.com)
covers a selection of very useful PostgreSQL Extensions and their impact on
simplifying application development when using PostgreSQL.

We cover auditing changes with `hstore`, the `pg_trgm` extension to
implement auto-suggestions and auto-correct in your application search
forms, user-defined tags and how to efficiently use them in search queries,
and then we use `ip4r` for implementing geolocation oriented features.
Finally, hyperloglog is introduced to solve a classic problem with high
cardinality estimates and how to combine them.

Part 8 concludes with an interview with [Craig
Kerstiens](http://www.craigkerstiens.com) who heads the Cloud team at Citus
Data (now part of Microsoft), after having been involved in PostgreSQL
support at Heroku. Craig shares his opinion about using PostgreSQL
extensions when deploying your application using a cloud-based PostgreSQL
solution.

### Closing Thoughts

I have written [The Art Of PostgreSQL](https://theartofpostgresql.com) so
that as a developer, you may think of SQL as a full-blown programming
language. Some of the problems that we have to solve as developers are best
addressed using SQL.

Not just any SQL will do: ***PostgreSQL is the world's most advanced open
source database***. I like to say that *PostgreSQL is YeSQL* as a pun, which
compares it favorably to many NoSQL solutions out there. PostgreSQL delivers
the whole SQL experience with advanced data processing functionality and
document-based approaches.

[The Art Of PostgreSQL](https://theartofpostgresql.com) introduces many SQL
features, so that you can replace thousands of lines of code with simple
queries! For that to happen, all you have to do is buy the book, read the
book, and then practice. Practice everyday.

> _Knowledge is of no value unless you put it into practice._

> — ***Anton Chekhov***


### Get your copy now!

Either register your email for a free chapter in the form below or go buy
the book already at [The Art of PostgreSQL](/#).
