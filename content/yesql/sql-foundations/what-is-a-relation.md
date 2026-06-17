+++
title = "What is an SQL Relation?"
weight = 20
summary = "The central concept of SQL, in plain terms: a relation is a bag of objects that all share the same attributes — and every query defines a new one."
tags = ["SQL", "Relation", "Theory"]
book_chapter = "Chapter 19, Understanding Relations and Joins"
+++

If you're like me, understanding SQL took a long time. It took me years to build
a good mental model of how queries are implemented, and from there, how to reason
in SQL. Today I want to introduce the central concept of the language: what is an
SQL relation?

The term comes from mathematics and relational theory, whose formal definitions
use jargon that isn't especially friendly. So let me simplify.

In SQL, a relation is a *bag* of *objects* that all share the same
*characteristics*: a list of attributes, each with a known data type.

We call those objects *tuples*. An object with three attributes is a *triple*,
one with four a *quadruple*, and so on. For an unknown number `t` of attributes,
we say `t-uple` — a *tuple*. If you've ever worked with a collection of objects
in Java, Python, Ruby, or PHP, you've already worked with a *relation*.

The most common relation in SQL is a table — hence the `TABLE` command. But the
real point is this:

> **Any SQL query defines a new relation.** The result set of a SQL query is
> always a collection of tuples.

SQL gives you different ways to compose relations together — set operators and
join operators. Our next step dives into
[SQL JOINs](/yesql/querying-data/what-is-a-join/), the operators that combine two
relations into a new one.
