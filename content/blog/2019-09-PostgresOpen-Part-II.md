+++
date = "2019-09-23T12:15:00+02:00"
title = "The Art of PostgreSQL: The Transcript, part II"
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
second part of the transcript of the video. The first part is available at
[The Art of PostgreSQL: The Transcript, part I
](/blog/2019-09-postgresopen/).

<hr />

{{< figure src="/img/PostgresOpen2019/TAOP.021.png" >}}

As a developer writing SQL is the main thing you do with PostgreSQL. Because
you know it's ACID, you don't have to care about that. So what you need to
care about is implementing your business in the application. So you do SQL.

Here's a very simple use case that I found. The data was open data at the
time, but it's not easy to download anymore. I will need to change the
example later but I didn't do that yet.

{{< figure src="/img/PostgresOpen2019/TAOP.023.png" >}}

So when you download the data you have a CSV file that looks like this, with
the year, the date, the number of shares exchanged on the stock exchange
that day, the number of trades that exchanged those shares and the amount of
dollars that were present. What you can see here is that I'm picking `text`
as the data type for those columns where obviously it's numeric. 

But there's a comma to separate the thousands, there's a dollar sign. So if
you just say to PostgreSQL “hey, it's numbers”, it will not be happy with
that. Then we use `COPY` on the client side. So you know the `\copy`
(backslash-copy), it runs in `psql` and so the source file is going to be
required on the client side of the connection. So you can actually use that
over a connection to a server. You don't need to upload the file to the
PostgreSQL server before you do that. That's why it's `\copy` (backslash
copy) rather than `COPY`.

And COPY is actually not just a command in Postgres it's also a protocol.
It's a streaming protocol. So if you have a huge set of data, it's going to
be streamed. So that's pretty fast, it's pretty efficient. And also if you
write your application code in Python or Java or something… as soon as you
have more than a couple of lines to INSERT into the database in the same
table, you should use COPY. It's way faster. The threshold I usually have in
mind is like 10 lines. If you're uploading 10 lines of data into the same
table, use COPY. It's a protocol that is implemented in your driver already.
So just use COPY from the driver.

{{< figure src="/img/PostgresOpen2019/TAOP.024.png" >}}

But then we don't want to use `text`, we want to use `integer` and
`numeric`. Because it's money here, you use `numeric`, right? You knew that
right? You don't use `float` for money, otherwise you lose money. So don't
do it.

And the thing that I wanted to show here is: who knew that you can do in a
single SQL command, that is going to do a single table rewrite, you can
actually rewrite three different columns in the same statement and use text
processing functions to transform the data and make it suitable for the new
data type. Who knew you could do that?

So, another way to do that would have been for me to use `copy from program`
and you could run like a `sed` or an `awk` or `Python` filter to filter the
data out and make it look like what PostgreSQL is going to expect. But if I
had done that, then I couldn't have shown you that you can do it in a single
statement of three columns at a time and an `ALTER TABLE`.

{{< figure src="/img/PostgresOpen2019/TAOP.025.png" >}}

Something that many developers told me, when I was a consultant, and even
now when I do meetups and things like that… many developers they don't like
SQL because it's a black box. And they're like “yeah, we don't even know the
algorithm that is going to be used. We write a query and what is going to
happen on the server? nobody knows… so we prefer to write the code our own
way.”

{{< figure src="/img/PostgresOpen2019/TAOP.026.png" >}}

So here's an example on top of the data we say already. It's the list of the
10 days in the dataset where you have the most dollars exchanged that day,
in the New York Stock Exchange. So it's a top-10, it's easy, right. You run
through the data and at the end of it you sort the data and at the end of it
you just output the top 10 lines. 

So the example is in Python here. When you want to write that in Python,
maybem if you have like a couple of millions of lines in the database, maybe
you don't want to have all that in memory at the same time. Because all you
want at the end is the top-10. So the amount of lines you want in memory at
any time is 10. Not 2 millions. Not 2 billions. So, to do that in Python you
use `heapq` and there's an API, like you *heapify* the list of 10 and then
you `heappushpop` and if it's greater than what you have already it replaces
an entry and if not it's not included, that's it. And the whole data
structure in memory is going to have 10 lines, for the whole running of your
script. So it's easy to control and it's nice. Okay.

How do you do that in Postgres?

{{< figure src="/img/PostgresOpen2019/TAOP.027.png" >}}

Well, ORDER BY LIMIT 10, that's it. Maybe that's simpler that way. I don't
know what you think, but if I had to write and maintain this (Python
version) or this (SQL version), I think I would do the SQL version.

But then the question I have is how do you know that this query is going to
use the same thinking we did before? Only 10 lines in memory at all time
rather than using all the memory for all the rows. And if you have one
billion rows it's a problem. So how do you figure that out in Postgres?
    
Well you use EXPLAIN.

{{< figure src="/img/PostgresOpen2019/TAOP.028.png" >}}

My favorite variant of EXPLAIN is using ANALYZE, VERBOSE, and BUFFERS
options, because that's where you have the most information. You need to be
careful though because ANALYZE will actually run the query. So if you have
for example an UPDATE that is slow because of a foreign key that does not
have an index or things like that, as it happens, and you want to EXPLAIN
the update… you can EXPLAIN an UPDATE. Maybe you want to BEGIN, ANALYZE the
UPDATE, and then ROLLBACK. So that the UPDATE didn't happen when you work
around it. So EXPLAIN ANALYZE is running the query.

And what we see here is a sort method **top-N heapsort** using this amount
of memory. I think we covered it. PostgreSQL implements exactly the same
algorithm as what we did manually in Python before.

So rather than writing all the code that is doing exactly that, but client
side, which means you need to fetch 2 millions lines before you do anything,
and then you sort them out. Maybe you can sort them out and send only 10
lines to the client and it's way faster and way more efficient. And it's
only 4 lines of SQL.

Question from the audience: some other systems like SQL server are going to
give you hints about maybe where you should look at because the query is not
as fast as you expect it to be.

Answer: PostgreSQL itself will not do that but we have several Open Source
tooling around it like the website
[explain.depesz.com](https://explain.depesz.com) or
[PEV](http://tatiyants.com/pev/#/plans) which is a visual explain tool.
Those will do that for you. So one of those lines (from the EXPLAIN output)
will be in red, splashy, and that's where you should focus. You actually
have all the information you need (in the explain plan) if you know how to
read it. But it takes some practice. So using something visual to get there
is a good use of your time.

{{< figure src="/img/PostgresOpen2019/TAOP.029.png" >}}

Usually when you have this kind of data and you're working on an application
in a team, one of the first things people are going to ask you, either the
marketing department or maybe the finance department, or maybe accountants,
I don't know. Some of your colleagues are going to be interested into some
kind of monthly reports. So how do you write a monthly report in SQL?

It's pretty easy.

{{< figure src="/img/PostgresOpen2019/TAOP.030.png" >}}

Here I'm showing off several things like… I'm using `psql` in that example
and the `\set` command is setting a value to a variable in `psql` and then I
can use the variable value here (`:'start'`). So whatever the month is I can
change that and run the same query again and again. And I can also pass the
value of that at the command line of the script. At the `psql` command line
rather than in the file itself. Just so you know.

And then we're using `to_char` to do some pretty formatting. And then, oh,
that's something you should pay attention to. We don't use BETWEEN for the
dates. Do you know why? I could have said `BETWEEN start AND end` but I
didn't do that, because BETWEEN is going to be inclusive for both the start
and the end. Here I say the last day is the first day plus one month, and
Postgres will figure that out. Remember, I told you, it's object oriented.
So the `+` operator with two integers, the result is an integer, or maybe a
bigint. If it's a date and an interval, then it's something completely
different, but it's still a `+` operator that you're using. It's like
operator overloading in C++ except that it's very simple to use and it just
works. And so `interval '1 month'` because it's attached to a date then
PostgreSQL will look-up in the calendar and decide how many days that month
was. Of course the example I picked is February so it will have to decide
how many days you had that year in February. But PostgreSQL can do that for
you.

So if you use BETWEEN and this kind of expression (`date ... + interval '1
month'`) then you might count March the first twice. Once in your February
report and once in your March report. So that's a bug, and then you have the
accountants running to you and trying to explain the data with you because
they will never have the same result as you have. And you're like “I don't
understand your problem”… and yeah that's a bug here. So you use greater or
equal and less than strict, and you don't have that bug. So that's a small
trick. Maybe you knew about it already but I've run through many developers
enough that I would, you know, take some time on it.

{{< figure src="/img/PostgresOpen2019/TAOP.031.png" >}}

So here's the result without surprise. Okay, it's some data. We don't know
the numbers so we don't focus on them but there's a bug. Can you spot the
bug?

Missing days, exactly, congrats. So we have 28 days that year in February,
but only 19 rows output. Maybe marketing department, or accounting won't be
very happy about that. Maybe they want to have the days without activity. 

{{< figure src="/img/PostgresOpen2019/TAOP.032.png" >}}

So let's fix it, it's easy. You run the same query right and then you do a
lookup in the calendar in your application. Here it's in Python but it could
be anything else. And if the day of the calendar has some data associated
with it, then you output that data, but otherwise you output zero. And
here's the result, fixed.

{{< figure src="/img/PostgresOpen2019/TAOP.033.png" >}}

Or is it really? So where is that code going to be used actually? So maybe
it's going to be used in only one place and then it's fixed. Good enough.

{{< figure src="/img/PostgresOpen2019/TAOP.035.png" >}}

But maybe you have an application with different kind of people using it,
like the frontend people, backoffice people. Maybe you have a little started
in the finance department that was, you know, a quick PHP script where your
backend used to be in Java and now it's being rewritten in Django. You know,
real life happens. So maybe it's not that easy to say to everybody “hey,
just use the calendar lookup”… because mostly what happens is that the
calendar default implementation in Python is going to be surprisingly
different from the one in Java. Maybe because of the way they handle the
default timezone, and maybe you have some other bugs. I don't know, it can
get pretty complex.

But the thing that is common for all of those is that they are talking to
our beloved PostgreSQL database. So maybe you wan to solve the days with no
activity in SQL.

So who think that you know how to solve that in SQL? Like, you know, just a
gut feeling, let's see.

{{< figure src="/img/PostgresOpen2019/TAOP.037.png" >}}

So there's one thing that is very useful in PostgreSQL and it's called
`generate_series`. And as I said before we like boring names in PostgreSQL,
so can you guess what `generate_series` is going to do? It's going to
generate a series. And it's going to begin with the first date and then it's
going to go up to the next date but it's inclusive, like BETWEEN is. So we
say we go up to `+ 1 month - 1 day`, so that we don't step over to the next
month, because that would be a problem. And we do that one day at a time, we
step `1 day`. It could be `1 hour` or it could be `13 hours` if that's your
business requirement. Here it's one day at a time, that's easy.

So we generate a series of dates, that's our calendar. And then we do a LEFT
JOIN. For each day of the calendar we're going to look if we have data or
not in the main table. That's easy. That's exactly the lookup that was
implemented in Python before. It's exactly the same thing but it's done with
PostgreSQL on the database side.

So we generate some values and we do a LEFT JOIN and here's the result,
fixed, in SQL. Easy, right?

Question: How come you have zeroes here, where does that come from? 

Answer: That's a good question, because those zeroes didn't exist in the
data set. We invented zeroes, we didn't have any data. LEFT JOIN is going to
provide you with NULL values. And `coalesce` is going to return the first
argument of the function here that is not NULL.

I encourage you to look at PostgreSQL documentation to have more details
about it. In some communities when you tell people “yeah, go look at the
documentation”, maybe it's a little rude to do that… you know the RTFM
situation. In our case, we take pride in the PostgreSQL documentation that
it is being very well maintained. So if you do a patch for PostgreSQL that
is technically very good, like something awesome, but not documented, it's
going to be rejected. Any patch that goes into PostgreSQL needs to maintain
the documentation that goes with it, in the same patch. So we are very proud
of our documentation system. So we when say “please read the docs” it's
because we've been spending time writing it the good way, the think, and we
would be happy that it's useful. So in the PostgreSQL community it's polite.
So… don't take it the wrong way.

{{< figure src="/img/PostgresOpen2019/TAOP.039.png" >}}

Usually the next step for Marketing is going to be “okay, I want week on
week evolution as a percentage in the same result set.” So, the slide is a
copy/paste of the result because it's easier to explain it that way.

{{< figure src="/img/PostgresOpen2019/TAOP.040.png" >}}

And I've tried to change some colors, there's a color code. So basically you
want from this Wednesday, you want to know that it was 10% less dollars
exchanged than the previous Wednesday. Okay, you understand the result set?
It's just a percentage of difference with the previous week, same day the
week before.

So who know how to implement that in SQL? Okay, the other, I think you don't
know SQL. I'm sorry. We'll get back to that, it's a strong statement I know.

{{< figure src="/img/PostgresOpen2019/TAOP.041.png" >}}

So to implement it we use a CTE here on the left and maybe you recognize it,
it's exactly the same query as before. The `generate_series` with a LEFT
JOIN. Ah, there's a little difference, let's go back to that later. So we
compute that and we use `computed_data` here as a from clause for the next
part of the query. And we compute the difference of dollars between the
dollards from last week and the dollars from this week.

But how do we get those dollars from last week? It's because we use window
functions. The window functions allow us in one query… The projection
operator, the select clause is the projection operator, it works one row at
a time — and here we want to see the values from another row. So we are
going to say it's a peer row, a friend. So we have many friends now. And
with window functions the other values from our friends' rows. 

And who are going to be our friend here? Well it depends on the clause you
put in the OVER clause. So PARTITION BY and ORDER BY. PARTITION BY, you can
think about it a little like GROUP BY. So it's going to say our friends are
going to be the other rows who have the same value as us for the PARTITION
BY clause. So we PARTITION BY `extract(isodow from date)`. 

ISODOW you know what that means? DOW is Day Of Week. And of course in some
countries Sunday is one, the first, and some other countries it's Monday.
And then in come countries we begin at zero, not one, so Sunday is zero,
Monday is one. Well it's crazy. So of course there's an ISO standard about
it. So we use the ISO definition for the Day Of Week. And so anything that
is a Wednesday is going to be 3 and anything that is 3 is going to be rows
that we are allowed to see from the current one. 

So we are going to be able to see any row that has the same Day Of Week as
the current row. And we are going to see them in an order that we speficy,
by date. And we're going to `lag(…, 1)` so we're going to be able to see the
one that is a week before us.

Question: Is there a reason that you are using `to_char` in the main query
but `extract(isodow ...)` in the window function?

Answer: so yeah the `to_char` here is going to be “Wednesday” or maybe going
to use the locale that you have on your computer, and this (`extract(isodow
...)`) is going to be a number, so maybe it's easier reason about numbers
from that clause. And also those queries are for slides and showing off
things.

And so that's a window function. So, who's been using window functions
before? Nice (there was quite some people in the audience that did!).

It was invented in '92 like around, you know, UTF-8 and maybe IPv6, things
that everybody uses everyday, nowadays… no? maybe not… So that's SQL
from 92. So if you are not comfortable with it and it's 2019 maybe it's time
to learn SQL again.

So then the copy/paste from the result of the query is what we saw before.

{{< figure src="/img/PostgresOpen2019/TAOP.044.png" >}}

And the SQL standard, the current version is 2016. And any new version of
the standard is deprecating every produced one. So there's only one current
version of the SQL standard. So '92 is interesting for historic purposes. If
you do historic research, that's very interesting. If you do production
database or application development, you don't care about that. The only one
that you care about is 2016.

<hr />

That's it for the first part of this presentation. We covered from about 15
mins in to 30 mins of this talk. I will publish the transcript for part III
and then part IV later this week, so stay tuned to this blog if you like
this content!

Also, as the content comes from my book anyway, you could also subscribe
below to get the free sample, or just go buy the book at the main home page
of this website: [The Art of PostgreSQL](https://theartofpostgresql.com).
