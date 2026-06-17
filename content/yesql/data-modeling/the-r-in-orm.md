+++
title = "The R in ORM"
weight = 10
summary = "The R stands for Relation. Any SQL query defines a relation, and an ORM's whole job is to map that collection of objects to objects in your language — nothing more."
tags = ["ORM", "Relation", "SQL", "Theory"]
book_chapter = "Chapter 27, Object Relational Mapping"
+++

Let's face it: I like SQL. A lot. It's a fine DSL given how powerful it is, and I
respect its original goal — to read like English sentences rather than code.

I also understand that manually hydrating objects in your backend language isn't
the best use of your time, and that building SQL as strings makes code ugly. I
get it. What I *don't* understand is the fallacy behind most ORM tools. This is
an unpopular opinion, but I'd like ORM writers and users to understand more of
SQL before giving up on it.

> **The R in ORM stands for Relation.**
>
> **Any SQL query defines a new Relation.**
>
> **A Relation is a collection of objects, all having the same properties.**

Your ORM's job is to map a collection of objects from your database into a
collection of objects in memory. Literally. There is *nothing* else to it.

Yet many ORMs completely hide SQL and make you, the application developer, learn
*another* query language on top of it — one that often can't even express
sub-queries. Let me say it again: any SQL query defines a new relation. The
`FROM` clause introduces a relation, and that relation can itself be specified as
a SQL query — because a SQL query *is* a relation.

If your ORM doesn't understand that, it doesn't understand relations. It doesn't
understand SQL. So why use a tool that doesn't understand SQL as a way to make
using SQL simpler?

The `TABLE` query defines a relation, of course — just not a very interesting
one. Yet it seems to be the only relation most ORMs understand, building up from
what they call *base tables*. Hilarity ensues.

Maybe you're lucky enough to work with an ORM that genuinely understands SQL and
relations. Or maybe you think SQL is a simple, limited tool and you'd rather lean
on your ORM. Either way, it's worth seeing for yourself just how much you can do
with SQL — and then deciding how much of it you want your ORM to hide.
