+++
date = "2019-09-07T21:00:00+02:00"
title = "What is an SQL relation?"
tags = ["SQL", "Relation", "Theory", "JOIN", "Composition"]
categories = ["PostgreSQL","YeSQL"]
coverImage = "/img/composition.jpg"
+++

If you're like me, understanding SQL is taking you a long time. And some
efforts. It took me years to get a good mental model of how SQL queries are
implemented, and then up from the lower levels, to build a mental model of
how to reason in SQL. 

Nowadays, in most case, I can think in terms of SQL and write queries that
will give me the result set I need. In most cases, because some parts of SQL
are still complex, and I don't practice as much as I used to. In particular,
newer PostgreSQL features are areas I still need to work with more before I
can integrate them in my daily workflow.

Today, I want to introduce the central concept of the SQL language. What is
an SQL relation?

<!--more-->

The term comes from mathematics and their relational theory. The wikipedia
page [Relation
(Mathematics)](https://simple.wikipedia.org/wiki/Relation_(mathematics))
include an introduction about what is a relation... which uses a jargon that
you might not be familiar with. At least I know I have a hard time
understanding that page. So I'll simplify it for you now.

In SQL, a relation is a *bag* of *objects* that all share the same
*characteristics*: a list of attributes with a known given data type. 

We name those objects *tuples* in SQL. An object with three attributes can
be named a *triple*, an object with four attributes a *quadruple*, with six
attributes a *sextuple*, etc. The generic that applies to any number of
attributes is built on the same mechanism. Let's say that we have the
unknown number `t` of attributes. Then we'll name the object a `T-UPLE`, or
a *tuple*.

If you have ever worked with a collection of objects in Java, or Python, or
Ruby, or PHP, or some other programming language, then you have already
woked with a *relation*.

The most common relation in SQL is a table, and that's why we have the
`TABLE` command. The truth is that any SQL query defines a new relation. The
result set of a SQL query is always a collection of tuples.

SQL provides different ways to compose relations together: set operators and
join operators are used for that. Our [next article will dive in SQL
JOINs](/blog/2019-09-sql-joins/).

Meanwhile, check out my book [The Art of
PostgreSQL](https://theartofpostgresql.com) where you can learn how to put
SQL to good use when coding your application!
