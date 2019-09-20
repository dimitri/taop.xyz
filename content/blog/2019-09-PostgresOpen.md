+++
date = "2019-09-20T20:15:00+02:00"
title = "The Art of PostgreSQL: The Transcript, part I"
tags = ["SQL", "Relation", "Postgres Open", "Conference"]
categories = ["PostgreSQL","YeSQL"]
coverImage = "/img/PostgresOpen2019/video-caption.png"
+++

This article is a transcript of the conference I gave at Postgres Open 2019,
titled the same as the book: [The Art of
PostgreSQL](https://theartofpostgresql.com). It's availble as a video online
at Youtube if you want to watch the slides and listen to it, and it even has
a subtext!

<center>
<iframe width="560" height="315" src="https://www.youtube.com/embed/q9IXCdy_mtY" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</center>

Some people still prefer to read the text, so here it is.

<!--more-->
<hr />

{{< figure src="/img/PostgresOpen2019/TAOP.001.png"
          link="https://theartofpostgresql.com" >}}

Hi everobody. So we're going to talk about The Art of PostgreSQL. The idea
of this presentation is that it's mostly oriented to Application Developers.

I've been a contributor for Postgres for a long time, started last century.
I work at Citus Data and we've been acquired by Microsoft. So nowadays it is
Azure Database for PostgreSQL HyperScale (Citus), or something like that.

{{< figure src="/img/PostgresOpen2019/TAOP.007.png"
          link="https://github.com/citusdata/pg_auto_failover">}}

One of the projects that I'm working on currently is named pg_auto_failover.
The idea is just exactly as the name says. In PostgreSQL we tend to like
boring names, so that you read the name and you know what it is about,
usually.

So it's business continuity, it's automating the failover. That's all about
it. It's on github, it's completely Open Source, you can open issues, you
can send bug fixes if you want to, even new features if you fancy that. So
go have a look, it's a project we did to simplify setting up HA for
PostgreSQL.

{{< figure src="/img/PostgresOpen2019/TAOP.011.png"
          link="https://pgloader.io">}}

Another project I've been working on a lot in the past years is a migration
project for going from something else to PostgreSQL. The idea is that you
don't have an excuse anymore to be using for example MySQL. Just use
PostgreSQL instead, it's much better. But it's not always easy to implement
that. So with pgloader in a single command line you give it a source
connection string, and a target connection string, the target should be
PostgreSQL. And then it's going to read all the catalogs from the source
database, decide what are the tables, the columns the attributes, the types,
do the type mapping for you and load the data and then create the indexes in
parallel and etc etc. So it's one command line and then your database is
running on PostgreSQL now. So no excuse, just do it. It support MySQL,
SQLite, SQL Server and some other input kinds.

{{< figure src="/img/PostgresOpen2019/TAOP.012.png"
        link="https://theartofpostgresql.com" >}}

Another project I've been working on is this book, The Art of PostgreSQL. We
have some copies left, maybe the last one or something like that, at the
booth. So if you're interested show up there later. And the slides that
we're going to go through are mostly extracted from the book. So it's kind
of the same content.

So let's get started now.

{{< figure src="/img/PostgresOpen2019/TAOP.013.png" >}}

The first thing that for me is important as an application developer is why
are you using PostgreSQL? Often when you ask that question — and I used to
be a consultant before — and when you get around this question, most of them
developers they don't really know why, you know, it's in the stack, it's
been deployed already, they have joined the project and they have to use it.

Some of them they're like “Oh, I know why, it's because it's solving this
problem that is quite hard to solve for the application and we are using
PostgreSQL to do that.“ But often enough I heard that PostgreSQL is used to
solve storage. Which is suprising as an answer because it's so wrong. It's
not true. Storage in the 60s it was easy because at the time, with the
compute we had, if you would unplug it from the power socket, then anything
that was in memory would stay exactly the way it was. And you could re-plug
like a couple weeks later and it would be as it was two weeks before. And in
the 70s we switched to other technology where it was not true anymore, but
being able to serialize something that you had in memory to disk has never
been such a problem in computing science. It's easy to do, everybody knows
how to do it, you don't need PostgreSQL to do that.

If you are a Java shop, you can serialize your objects in XML and read them
back and that's it. So if storage is the problem, you go use, for example in
the cloud, blob storage from Azure or maybe S3 from AWS or something else.
So that's storage. PostgreSQL is not about storage.

{{< figure src="/img/PostgresOpen2019/TAOP.014.png" >}}

PostgreSQL is about concurrency and isolation. The idea is that what happens
when you have more than one person trying to do the same thing, like two
updates concurrently? And the image is obviously the difference between
theory and practice: in theory it's the same, but not in practice.

The main thing around concurrent and isolation within the context of the
database — Relational Database Management System, RDMBS — is that we provide
ACID guarantees. I guess everybody knows what ACID is?

{{< figure src="/img/PostgresOpen2019/TAOP.015.png" >}}

**Atomic** basically means that if you have many things to do in the same
transaction and something goes wrong you can rollback. If you did two
inserts and one update and then you rollback then everything is cancelled.
You don't have the situation where one of the inserts went through but not
the other one and now your database doesn't make sense anymore. So that's
pretty cool.

Usually we don't type in `rollback`. Sometimes we do when testing
interactively, but in the application, have you ever implemented a
transaction that would do a `rollback` in your transaction? Maybe not.

What happens is… file system is full. I know it's 2019 but we still have
that problem in production sometimes. So file system is full, what's next?
Well with an atomic system, the transaction is rolled back and never
happened. That's it. So you're safe.

Well PostgreSQL does something that almost no other system is able to do: it
supports transactions for DDL. So if you have an application script to
migrate from one version to the next version of the schema, you had a new
column, a new table, maybe a new index, something like that, when then what
happens if file is full in the middle of the script? 

If you're not using PostgreSQL, and you had version 1 in production, the
script was to go from version 1 to version 2 and it failed in the middle. So
now you have a version that nobody ever saw nowhere. No developer ever saw
that version which is now in production… if you don't have transactions for
DDLs.

With PostgreSQL “file system is full” implies a rollback, you still have
version 1, don't deploy the app yet, that's it. Simple, done. So that's one
of the reasons why you use PostgreSQL of course.

{{< figure src="/img/PostgresOpen2019/TAOP.017.png" >}}

The C of ACID, it means **consistency**. Consistent means there are some
business rules that you know about and that you can share with PostgreSQL,
can explain to PostgreSQL, here's what's important for me to keep in mind
for the whole data set that we are going to manage; and you can have
PostgreSQL implement those guarantees for you.

So the first step for the consistency is the schema, and the data types.
Here we have a very simple table with two columns. Anything that goes into
those columns — here ID is an integer. If you have MySQL and you have an
integer column and you insert into it the string “banana”, then it will
happily take it and if you SELECT from it than it's going to say zero. But
no errors whatsoever. It's happy to work with that.

With PostgreSQL we don't do that. So if you try to insert a “banana” into an
integer column, PostgreSQL will tell you “hey I don't know what that is, but
it does not fit your model, please be careful”. And then we have constraints
like CHECK, NOT NULL, FOREIGN KEY, PRIMARY KEY… relations. 

We'll get back to that, relation are the central concept of SQL basically.
And some people think it's because we have *foreign keys* but it's not true.
A relation is just a mathematical concept where you have a set of elements
that all share the same properties. It's called attribute domains in the
relational jargon and it means that it all looks the same. Here it's an
integer and a text columns, and anything that is in this table *foo* is
going to have an integer and a text, that's it. All of them are the same.
That's what is a relation.

So consistency is pretty important.

{{< figure src="/img/PostgresOpen2019/TAOP.018.png" >}}

Then the *I* for ACID is **isolation**. It's the other side of
**atomicity**. It's a little bit more complex to understand sometimes.
Isolation means that while you are doing your queries, are you allowed to
see what is going on concurrently in the rest of the system?

So if you want to take a consistent backup for example, you need to make it
so that even if `pg_dump` is going to run for several hours because you have
terabytes of data, it needs to be a consistent snapshot of the production.
If during the backup someone else is doing inserts and updates and something
else, you don't want those to be in the backup, because you want something
consistent. You want a snapshot that doesn't move. You don't want to see
everything that's new. So `pg_dump` will typically use an isolation mode
where you don't see the changes from the other transactions. 

You can also do that in your application, and maybe it could be the default:
REPEATABLE READ. Or even SERIALIZABLE, but that one is different. REPEATABLE
READ might be what you expect from the database but it's not the default.
The default is READ COMMITTED. So maybe you want to look into that.

Anyway, every transaction in Postgres can have a different isolation level.
`pg_dump` will be SERIALIZABLE while the rest of the system is REPEATABLE
READ or READ COMMITTED, depending. So that's isolation. So you see that's
very important, and that's very hard to implement at the application level
and so maybe that's why you're using PostgreSQL actually.

{{< figure src="/img/PostgresOpen2019/TAOP.019.png" >}}

And then of course it's **durable**.

Do you know the little test to do with the power socket plug? Basically you
write a little client application that will only do INSERTs for example. And
you count how many times you got the COMMIT message back from Postgres.

Remember that when you say COMMIT, maybe the answer is going to be ROLLBACK.
Because there was a proble, Postgres was not in a position where it could
actually implement the COMMIT. “File system is full” is the easiest example
to have in mind. So you say COMMIT, maybe it's ROLLBACK. So you count how
many times when you said COMMIT it was committed actually.

And then while the test is running you unplug the power socket from the
server. In the middle of the test. Then you plug again and you count what
you have on the server and what you have on the client. If it's not the
same, there's a bug somewhere. It's not durable. 

Durability means that anything that has been known to be committed by the
client should still be there when you do that. If it's not, maybe the
hardware is faulty, maybe the BIOS configuration or many the kernel, OS
configuration is wrong. Maybe you did `fsync = off` in PostgreSQL, or maybe
you're not using PostgreSQL. And then… yeah, don't do that.

{{< figure src="/img/PostgresOpen2019/TAOP.020.png" >}}

So that's the basics around why would you use PostgreSQL. So to recap
because you have transactions. And transaction is a short way to say you are
compliant with ACID. But be careful, because some systems are naming
themselves databases nowadays, and the NoSQL systems in particular, where as
a developer if you think about them as a database, you might be in trouble
because they are not ACID-compliant.

All of the NoSQL systems that you will find are going to implement some
trade-offs. The only that is obvious is that they are not implementing SQL,
it's No SQL. Okay. But also they don't implement ACID usually. Take MongoDB
for example. It's schemaless, that's a feature. It means that you don't have
consistency, so you lose the C of ACID. It doesn't have transactions, so you
don't have the A nor the I of ACID. No atomicity, no isolation. Remains the
D of ACID, durability. It used to not implemnent that. Apparently they've
fixed it nowadays, but for a long time you wouldn't have the D of ACID.

So maybe it's fine to use it anyway in your application because it fits your
use-case. But as a developer if you think of a database as something that is
not ACID-compliant, because that's how we are taught about databases
usually, and the system you use is actually not ACID-compliant, it means
that all those guarantees that you don't have, either you don't need them,
that's cool, or if you need them, then you need to implement them yourself.

So that's the main kicker of using PostgreSQL, is that you get everything
for free and it just works and it's available and you can just, you know,
just care about the application.

And other good reasons to use it are written there and we're going to see
about them. We're going to see about why I say it's object-oriented. We have
extensions in PostgreSQL, we're going to see a couple examples. Rich
datatypes. You can do actually data processing in SQL and we're going to see
what I mean with that. Etc etc. 

<hr />

That's it for the first part of this presentation. We covered about 15 mins
of the 50 mins of this talk. I will publish the transcript for part II and
part III later next week, so stay tuned to this blog if you like this
content!

Also, as the content comes from my book anyway, you could also subscribe
below to get the free sample, or just go buy the book at the main home page
of this website: [The Art of PostgreSQL](https://theartofpostgresql.com).
