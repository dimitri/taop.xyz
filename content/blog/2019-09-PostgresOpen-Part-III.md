+++
date = "2019-09-25T11:14:00+02:00"
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

<!--more-->

<center>
<iframe width="560" height="315" src="https://www.youtube.com/embed/q9IXCdy_mtY" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</center>

Some people still prefer to read the text, so here it is. This text is the
third part of the transcript of the video. 

The first part is available at [The Art of PostgreSQL: The Transcript, part
I](/blog/2019-09-postgresopen/).

The second part is available at [The Art of PostgreSQL: The Transcript, part
II](/blog/2019-09-postgresopen-part-ii/).

<hr />

So, how to think in SQL? 

{{< figure src="/img/PostgresOpen2019/TAOP.045.png" >}}

Because, what I'm trying to convey here is that SQL
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
keywords that are related to the **relation** concept. So **WITH** is a CTE, or
Common Table Expression. It produces a new relation that you can reuse later
in the query. **SELECT** is the projection operator.

Oh, by the way, this query is based on a Formula One database with all the
races and the drivers and the results, and it's going to give you the top-3
pilots in number of points that they accumulated in a season, by decade.
Let's see the result.

{{< figure src="/img/PostgresOpen2019/TAOP.048.png" >}}

So in the '50s it was Fangio. So if someone told you that you're driving
like a Fangio, which is a common French thing to say, some people take it as
a compliment because he was number one, but he's also the guy who broke the
most number of cars to get there. So… I don't know. And maybe you can see we
have a French guy there (Alain Prost) and then Schumacher of course.

So for each decade, the '50s, the '60s, the '70s etc, you have the top-3
drivers. And that's where you use a LATERAL JOIN because you can have a
sub-query and you can inject things into the sub-query, thanks to it being
on the LATERAL side of a JOIN. So you inject a WHERE clause that comes from
the decade, and then you can GROUP BY and LIMIT to get the top-3 of them.

It's [lateral] currently the best way to write a top-n query. When you don't
have it it's very complex to write, when you know about it, it's like “oh, I
know how to do it”. Any questions so far?

{{< figure src="/img/PostgresOpen2019/TAOP.050.png" >}}

What I'm trying to say now is that SQL is code. So if it's code maybe you
need some tooling that is going to look like what you have usually when you
write code.

I've put the SQL query here again for perspective. My rule is that if a
query fits on a slide, it's a simple query. Okay, in that case, I had to use
a very small font that nobody can read… so maybe, maybe it's not simple
enough. But it's the kind of query you're going to write, and oh… something
I didn't say before… what is that?

A comment. Because SQL is code so of course you have comments. Maybe your
colleagues, they don't know `generate_series`, they've never seen that. So
if you use that and then of course you have a review process. You don't push
code directly in production, right? So somebody is going to have to review
your code. And they've never seen a `generate_series` before, and they're
going to say “no I don't want to accept this, it's foreign to me, I don't
understand it. It's going to be impossible to maintain in the future. Please
do it in Python or anything.” So you add a nice comment to your code. And
you colleague is going to be like “oh that's very nice I didn't know that,
thank you”. So, you know, comments, of course.

And then what you can do with integrating SQL into your application code,
the best way to do it that I've found is that you actually use `.sql` files.
Because then you have syntax highlighting, it's actually code. The day you
have a problem in production with the queries, then you can just send a link
to the DBA and he's going to copy/paste the query and play around with it
and then send you a Pull Request that fixes the query. And because it's just
a `.sql` file, that's what we do. If you're not doing it that way, maybe
you're losing out on some of the process around SQL in your code.

So how to do that? We are going to see about that.

And maybe you also want to have regression testing around the queries, and
let's see about that too.

{{< figure src="/img/PostgresOpen2019/TAOP.051.png" >}}

For you guys who are using an ORM in your code, I'm running short on time so
I will not explain more about it but, just don't do it. It's not worth it.
Do that instead.

{{< figure src="/img/PostgresOpen2019/TAOP.052.png" >}}

So those projects like YeSQL began with a Clojure implementation from Kris
Jenkins, and basically the integration looks like this:

{{< figure src="/img/PostgresOpen2019/TAOP.053.png" >}}

You write queries in a SQL file, with some comments, and it's going to
expose the query here. You load the queries and then all the queries are
going to be exposed a function calls. And the result is going to be a native
object in your programming language.

{{< figure src="/img/PostgresOpen2019/TAOP.054.png" >}}

So the integration in the code is going to be so easy and also the query is
just a SQL file that you are able to share very easily with your DBA
friends. Because now they're friends because it's easy for you to work with
them. And also the DBA will be able to review when you do code reviews.

{{< figure src="/img/PostgresOpen2019/TAOP.055.png" >}}

And then you can implement regression testing on top of it. So I wrote
RegreSQL in Go because I wanted to see if I would like Go or not. And it
took me less than a day, so if you want to have the same thing in Java,
Python, Ruby, whatever you're using, my guess is it's going to take you
maximum two days to get it so don't focus too much on this implementation.

The idea is very simple. You have the SQL files, and those are files in your
file system, right? in your code, as we saw just before. And so what you do
is you create query plans. You associate for each query some parameters, and
then you run the queries and you keep the result of them as an out file. You
know, `COPY FROM` the query, that's a CSV file, you store that. That's the
expected result. And then when you change the query, you run the tests again
and you compare the output, the current output with what you expected.
That's unit testing. it's very simple. You do a diff in between the two
files and you know if there's something that changed.

So when your DBA is providing you with an optimized version of a query, well
you integrate it into your system and you run the regression tests and you
know if it's still behaving the same as before, or maybe not. So it's easy
to do.

{{< figure src="/img/PostgresOpen2019/TAOP.057.png" >}}

And so that's the main parts of the presentation about SQL and why I think
that SQL is code and how to make it so that actually in your development
process SQL is code. And then before we wrap up, I wanted to show you some
powerful queries that you can with PostgreSQL extensions.

Up to now it was… maybe not so much boring, but not very… I didn't see much
sparkles, so maybe I can do that. 

{{< figure src="/img/PostgresOpen2019/TAOP.058.png" >}}

First query is going to be about geolocation. Maybe you know about GeoLite.
They provide you with a dataset of geolocation. It's easy you input an IP
address and in output you have a location on Earth. And then you need
someone to collect all those things. And MaxMind is the company behind
GeoLite and they say that you can use it for free as long as you say where
it comes from. I just did. So I can use it for free. That's the licence, so
yeah, you know.

So that's Geolite and you have a location ID and you have two tables with
the things. And yeah we use an IP range. The datatype is `ip4r` is provided
by an extension that you can find easily, and it provides you with IP ranges
of addresses. And this operator `>>=` maybe you don't know how to read it
yet, but think about it the first time you saw this equal operator `=` you
didn't know how to read it either. So you need to learn about that. So this
one `>>=` reads *contains*. So the IP range contains this address. That's
easy.

{{< figure src="/img/PostgresOpen2019/TAOP.059.png" >}}

And also we can have, in PostgreSQL, exclusion constraints. So you can build
you *blocks* table in a way that you guarantee that any range has no
overlapping range anywhere else in the table. So when you give it one IP
address in the lookup, you're going to lookup either zero or one answer.
That's it. Because there's no overlapping. Okay? And PostgreSQL is going to
guarantee that.

{{< figure src="/img/PostgresOpen2019/TAOP.060.png" >}}

Which means that know you can write this query, which normally wouldn't pass
code review. And I didn't comment on it because I wanted the query to fit in
the slide. So the problem is that we use a comma in the FROM clause, which
means it's a CROSS JOIN. Don't do that. Never!

But we have the guarantee that this geoloc relation, the result of this
query is going to be zero or one row. It's a strong guarantee because we
have the constraint. So the cross join is going to be against zero or one
row, so maybe it's okay. And I was lazy so that's the way I did it.

And then we have an ORDER BY … LIMIT 10. It's called a kNN. K here is 10,
and then we're going to have the 10 closest rows. That's the IP address of a
previous conference for PostgreSQL that happened to be in Dublin, and that
was the 10 pubs nearby the conference center. Because you talk for an hour
and then you're thirsty. You know, that's what happens, so… 

And it's a very simple query so if you want to implement geolocation in your
application, maybe it's like a 10 lines query to implement it. It's like, I
don't know, half an hour of work and then done. Well I don't do the visuals
and the mappings so you do that, but here you have the query, that's easy.

{{< figure src="/img/PostgresOpen2019/TAOP.061.png" >}}

And I'm running out of time so… this one was interesting, it was bashing on
MongoDB but so anyway.

{{< figure src="/img/PostgresOpen2019/TAOP.062.png" >}}

You have the slides, go read over them.

{{< figure src="/img/PostgresOpen2019/TAOP.064.png" >}}

And this one is, I don't have time to explain it, but it's basically a Model
View Controler in a single SQL query and the result of the query copy/pasted
from the console is that:

{{< figure src="/img/PostgresOpen2019/TAOP.065.png" >}}

That's the kind of things you can do with SQL and Postgres.
    
{{< figure src="/img/PostgresOpen2019/TAOP.067.png" >}}

<hr />

That's it for this presentation.

Also, as the content comes from my book anyway, you could also subscribe
below to get the free sample, or just go buy the book at the main home page
of this website: [The Art of PostgreSQL](https://theartofpostgresql.com).
