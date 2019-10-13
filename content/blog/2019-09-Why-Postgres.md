+++
date = "2019-09-27T15:15:00+02:00"
title = "Why Postgres?"
tags = ["SQL", "Why PostgreSQL?"]
categories = ["PostgreSQL","YeSQL"]
coverImage = "/img/emily-morter-8xAA0f9yQnE-unsplash.jpg"
+++

<div>
    <p style="text-align: right;">
    Photo by Emily Morter
    <a style="background-color:black;color:white;text-decoration:none;padding:4px 6px;font-family:-apple-system, BlinkMacSystemFont, &quot;San Francisco&quot;, &quot;Helvetica Neue&quot;, Helvetica, Ubuntu, Roboto, Noto, &quot;Segoe UI&quot;, Arial, sans-serif;font-size:12px;font-weight:bold;line-height:1.2;display:inline-block;border-radius:3px" href="https://unsplash.com/@emilymorter?utm_medium=referral&amp;utm_campaign=photographer-credit&amp;utm_content=creditBadge" target="_blank" rel="noopener noreferrer" title="Download free do whatever you want high-resolution photos from Emily Morter"><span style="display:inline-block;padding:2px 3px"><svg xmlns="http://www.w3.org/2000/svg" style="height:12px;width:auto;position:relative;vertical-align:middle;top:-2px;fill:white" viewBox="0 0 32 32"><title>unsplash-logo</title><path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z"></path></svg></span><span style="display:inline-block;padding:2px 3px">Emily Morter</span></a>
   </p>
</div>

That's a very popular question to ask these days, it seems. The quick answer
is easy and is the slogan of PostgreSQL, as seen on the community website
for it: “PostgreSQL: The World's Most Advanced Open Source Relational
Database”. What does that mean for you, the developer?

In my recent article [The Art of PostgreSQL: The Transcript, part I
](http://localhost:1313/blog/2019-09-postgresopen/) you will read why I
think it's interesting to use Postgres in your application's stack. My
conference talk addresses the main area where I think many people get it
wrong:

<!--more-->

#### Postgres is a RDBMS 
#### RDBMS are not a storage solution
#### Do not use Postgres to solve a storage problem!

So that's the main message of my conference presentation, which then expands
on reasons why you might like SQL a lot as soon as you're proficient enough
with this language.

Today I would like to get back to the main idea about ***Why Postgres?***
though. The main problem that Postgres and other RDBMS are solving is
concurrency. You want your application to be able to serve multiple users at
the same time. Nowadays, that also needs to happen all online, there's no
off-hours for either maintenance, or for reconciliation of the daily
transactional activity in the reporting system.

## System of Records, Dashboards, and Analytics

Instead, we tend to want to have access to our system or records and
analytical system and rather than seeing a fixed snapshot of
up-to-yesterday's activity, we want to see up to what just happened an
instant ago. If you think about your online bank statements, I can still
remember where I was only given my activity up to the previous day at 4pm.
Not too long ago that was a fine answer to most people needs.

Nowadays with online and contact-less payments and what not, we want to be
able to see the bank activity as it happens, and we usually receive a text
message seconds after a payment has been made. In particular if that payment
is unusual in some shape of form: either you're travelling in another
country, or maybe you're spending a larger amount of money than your bank
got used to.

In most online activities, we want to have access to the data as it is
created in our systems. And we want to be able to offer dashboards and
analytics while the data is being entered and created. And we want to allow
our users to never have to think about it and just have all they need at
their finger tips. How can you build a production system that knows how to
implement that?

That's ***why*** you use Postgres. As an RDBMS it knows how to handle
concurrency and very diverse workloads. You can actually use Postgres to
implement your transactional system of records and at the same time deliver
both customer and activity dashboards, and some kinds of analytics.

## Why SQL?

Of course to be able to implement all those activities on-top of the same
technology, it needs to be versatile and maybe a little complex. You need a
way to express very simple transactions, and quite complex analytics too.
That's exactly what SQL has been designed for!

You might remember learning about `BEGIN` and `COMMIT` statements. And this
`ROLLBACK` statement too. That's the Transaction Control Language part of
SQL and that's what allows you, as a developer, to implement concurrency in
your application. That's the **A** and the **I** of ACID: Atomic and
Isolated.

With SQL you can implement your CRUD needs easily. CRUD stands for Create,
Read, Update, and Delete. Usually you would use your ORM to implement those,
because you would perceive very little added value to implement that parts
in SQL.

Still, SQL includes CRUD use-cases very well. Also, SQL is very good at
batching operations, so you might want to remember that you can implement
JOINs in your INSERT, UPDATE, and DELETE statements, and have a single
statement take care of any number of rows (or tuples) at once.

The CRUD part of your application usually covers the System of Records
aspects of your activity, and sometimes other administrative use-cases like
creating users, groups, and other data organisation.

SQL is good at analytics too, it's not just for CRUD. It's possible to write
about any dashboard entry in a single SQL statement. When you know how to
use GROUPING SETS, WINDOW FUNCTIONS, advanced aggregates, sub-queries and
Common Table Expressions, what you can implement in SQL is almost endless.
Of course, A strong understanding of [what is a
relation](/blog/2019-09-sql-relations/) and [what is an SQL
join](/blog/2019-09-sql-joins/) is key to your success in using SQL.

## Extensions

Some activities are know to be hard to implement in SQL. Sometimes that's
just the way it is. With Postgres though, we also have access to lots of
extensions that will enable new ways to process data right from the
database.

If you've been interested in distributed systems, you might have read that
it's important to decide if you should send the computation where the data
is already, or send the data to your computation nodes.

When you use Postgres, it's the same thing. You can choose to retrieve the
data and then process it in your application nodes, or you can choose to
process the data where it is, in the database. Sometimes being able to
reduce the data set that cross over the network is the most efficient way to
solve a problem, so knowing how to do that in SQL becomes very interesting.

That's why we have such extensions as PostGIS, where you can implement
geo-spatial joins and get exactly the data you need even when your problem
requires being smart about the data location on a map.

## Licensing

Postgres is released as Open Source Software. There is no single entity
behind Postgres: while some companies have created a whole business line
around contributing to Postgres, any individual can contribute to the
project. It's all done in the open, in mailing lists with public archives.

The project infrastructure is also contributed to in the Open Source way,
and you can send a patch to the Postgres website. Either to fix a typo, or
for more serious work.

Even the mailing list system, and the conference organisation software, are
Open Source and managed by the Postgres community! It's all in the Open, and
it's all welcoming new contributions!

## So, Why Postgres?

To implement your application in way that is correct in terms of
concurrency, that is versatile in terms of architecture (CRUD, System of
Records, OLTP; and also OLAP, Analytics, Dashboards), and that is powerful
in terms of computation.

So that you can choose where to implement the processing in a case-by-case
fashion without having to re-architect your application. Just write more SQL
and now the processing happens where the data is. Sometimes that's just what
you need.

In summary, I would say that if you're not sure which transactional system
to use, just use Postgres. You will never be wrong with picking Postgres.
Sure, when scaling your application to impossible volumes, or when
confronted to exceptional velocity (transactions per second), it might be
that a part of your application would be better served by a very specific
system. Then you will find that it's usually pretty easy to move that part
of your application to a specialized system and plug it to the rest of your
application, the one that still uses Postgres.

***Why Postgres?*** Because it's the best. It really is *“The World's Most
Advanced Open Source Relational Database”*. And it will really help you
solve your challenges, and make your application *just work*.
