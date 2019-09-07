+++
date = "2019-09-07T22:55:00+02:00"
title = "The R in ORM"
tags = ["SQL", "Relation", "Theory", "ORM"]
categories = ["PostgreSQL","YeSQL"]
coverImage = "/img/ORM.png"
+++

Ok, let's face it, I like SQL. A lot. I think it's a fine DSL given how
powerful it is, and I respect its initial goal to attract non developers and
try to build English sentences rather than code.

Also, I understand that manually hydrating your collection of objects in
your backend developement language is not the best use of your time. And
that building SQL as strings makes your code ugly. I get it.

What I do not understand is the fallacy behind most ORM tools. I am going to
share my opinion on the topic, and it's not a popular one. You might not
like it, though I would like that ORM writers and users understand more of
SQL before giving up on it.

#### The R in ORM stands for Relation.

#### Any SQL query defines a new Relation.

#### A Relation is a collection of objects, all of them having the same properties.

Your ORM job is to map a collection of objects as given by your Relational
Database Management System into a collection of objects in memory.
Literally. There is NOTHING else to it.

Yet here we are, with ORM technologies that are completely hiding SQL and
having you, the application developer, learn something else on-top of SQL to
express queries. And in lots of cases, this new syntax does not understand
SQL, so that for instance you can't express sub-queries.

Let me say it again: any SQL query defines a new relation, which is a
collection of objects that all have the same properties. The FROM clause in
SQL introduces a relation, that you then process with the other clauses. Of
course, the FROM clause can introduces SQL relations that are specified as a
SQL query. Because a SQL query IS a relation.

If your ORM does not understand that, it does not understand relations. It
does not understand SQL.

Why would you use a tool that does not understand SQL as a way to make using
SQL simpler in your code? I just don't get it.

Again, ORM should be very simple. A relation in SQL is a collection of
objects. The ORM job is to map this collection of objects as a...
collection... of objects... in your programming language of choice.

To do that though, ORM must understand SQL. And SQL relations. And
understand that each and every single SQL query that you execute is defining
a new relation.

Of course the `TABLE` query defines a new relation. It is not the most
interesting one, yet it seems that it is the only one that most ORM tools
around there understand. And then try to build up from there. From what lots
of them call *base tables* in your model. Hilarity ensues.

You might like your ORM. Maybe you're lucky enough to work with an ORM that
understands SQL and relations. Or maybe you think that SQL is a simple and
limited tool anyway, and you would rather use your ORM rather than learn
SQL.

Well, I wrote a book to open your eyes on what you can do with SQL. It's
named [The Art of PostgreSQL](https://theartofpostgresql.com), and once
you've read it, you might want to use SQL to its full power!


