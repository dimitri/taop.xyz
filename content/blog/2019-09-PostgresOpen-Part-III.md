+++
date = "2019-09-24T16:15:00+02:00"
title = "The Art of PostgreSQL: The Transcript, part III"
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

Some people still prefer to read the text, so here it is. This text is the
second part of the transcript of the video. The first part is available at
[The Art of PostgreSQL: The Transcript, part I
](/blog/2019-09-postgresopen/).

<!--more-->
<hr />

{{< figure src="/img/PostgresOpen2019/TAOP.045.png" >}}

So, how to think in SQL? Because, what I'm trying to convey here is that SQL
is poweful and maybe you should be doing more SQL and less application code.
Or maybe you should condiser that part of your application code is actually
going to be written in SQL. And the goal of this talk is so that we realize
what is possible to do in SQL. And then there's the question of is it
advisable that you would do it as much of the implementation in SQL as I'm
going to show you, but the answer to that is more complex and requires more
understanding of the company dynamics and the skill levels of the developers
and things like that. So I'm not going to answer that. I'm just going to try
and show you how far you can go in SQL.

So how to think in SQL?

SQL is “Structured Query Language”. It's declarative. In most programming
languages, it's imperative, or object-oriented but that's still imperative.
Then what you do is, when you have a problem, you think hard about how to
reach a solution, and then you write the code that is implementing what you
think is going to be the solution. And usually when there's a bug it's
because you're thinking was wrong and what you though would be the solution
is actually not the solution.

A declarative programming language is different. You explain to the computer
the result that you want. So [you explain] the problem you have. Not so much
the solution. So when you do SQL queries, you need to be able to think in
terms of what is the problem I want to solve and you need to explain to
Postgres the result set you are interested into. Not how to build it, but
what it is. You need to define the result set. That's what you do in SQL.

So that's why I think for SQL beginners it's a little weird and strange and
not very easy to do, but as everything, the more you practice, the easier it
gets.

Another useful tip I think for thinking in SQL… Unix says everything is a
file, so if you want to, you know, print something on the printer, you just
`cat` your file to the printer device and then some pages are getting out.
If you want to connect to a network, you just open a socket file and then
you write to a file and it's actually a socket and it goes to the network.
Everything is a file. Java says everything is an object and actually the
first chapter is some other data types (Primitive types) and the second
chapter is objects, so… like integers are not objects but everything is an
object. In Python you have many things to think about and tools to work
with. In SQL you have relations.

{{< figure src="/img/PostgresOpen2019/TAOP.046.png" >}}

So what is a SQL relation? It's basically a collection of data that all
share the same query attributes, domains, which means a given number of
columns and each column is of a known data type, and every row for this
column will have the same data type implemented in it. That's a relation.

And any SQL you are going to write is going to define a new relation, based
on other relations. So when you're writing SQL you're composing relations to
build another one. So the FROM clause for example introduces relations,
which is why you could use a sub-query in a FROM clause: because a query is
defining a relation and of course you can SELECT FROM any relation,
including a sub-query.

So thinking in SQL means understanding relations and to play with them and
compose them. And to compose them you can use JOINs or set operators like
UNION, EXCEPT, and INTERSECT. And in terms of JOINs we have INNER and OUTER
JOINs, CROSS JOINs, NATURAL JOIN. Some of them have syntax differences and
some of them are semantically very different. 

We even have LATERAL JOINs. Who's good with LATERAL JOINs? Again that's
something quite new in SQL but it's part of the tool set that you have, so
if you don't know what it is, maybe sometime you will need it and rather
than writing a very efficient query that you can then just use the result
of, you're going to have to implement it in your application code and
retrieve so many data when you only needed that much.

{{< figure src="/img/PostgresOpen2019/TAOP.047.png" >}}

So here's an example with a LATERAL JOIN. And I tried to put in bold the
keywords that are related to the **relation** concept. So WITH is a CTE, or
Common Table Expression.


<hr />

That's it for the first part of this presentation. We covered from about 15
mins in to XXX mins of this talk. I will publish the transcript for part III
later next week, so stay tuned to this blog if you like this content!

Also, as the content comes from my book anyway, you could also subscribe
below to get the free sample, or just go buy the book at the main home page
of this website: [The Art of PostgreSQL](https://theartofpostgresql.com).
