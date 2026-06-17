+++
title = "How to Learn SQL"
weight = 10
summary = "There's no secret sauce — learn the two foundations (relations and declarative thinking), then practice in small steps and build from there."
tags = ["SQL", "Learn SQL", "Relation", "declarative"]
book_chapter = "the Introduction and Chapter 11, Structured Query Language"
+++

Here we are, another SQL query to write. You wish you knew how to write it
mechanically, like a loop in your favorite programming language — or at least
have a clear skeleton to tweak until it gives the result set you expect. So
instead of working on your query, you google *how to write a SQL query?* or even
*how to learn SQL?* I've been there too.

I want to share how I did it, and how I continue to do it. There's no magic
secret sauce — it's all basic work. Learn the main concepts and how they play
together, practice simple steps, then build from there.

You've done this before. You know how to write code in Python, Java, Ruby, Go,
JavaScript, or others. You learned just enough spreadsheet formulas to know a
relative from an absolute cell address. In short, you've learned advanced tricks
in other environments. So what makes SQL so special that `JOINs` and `GROUP BY`
feel hard to remember?

In my case, what took time to make sense were the foundations the SQL language
is built on. There are two:

1. **At the heart of SQL there's the notion of a relation.**
2. **SQL is a declarative programming language.**

Until you understand [what a SQL relation is](/yesql/sql-foundations/what-is-a-relation/),
everything is complex. Until you understand that SQL is declarative, writing
queries is a fight. Let's dive into both, starting with the declarative part.

### SQL is a declarative programming language

Declarative programming is a paradigm where you **declare** what you expect. In
SQL, your job is to declare the result set you want — in terms relevant to the
result, not the steps to get there.

### At the heart of SQL there's the notion of a relation

And the result of a query is itself a relation: a collection of objects that all
have the same list of attributes, each with its own data type.

```sql
\set start '2017-02-01'

  select date,
         to_char(shares, '99G999G999G999') as shares,
         to_char(trades, '99G999G999') as trades,
         to_char(dollars, 'L99G999G999G999') as dollars
    from factbook
   where date >= date :'start'
     and date  < date :'start' + interval '1 month'
order by date;
```

This query builds a relation of *quadruples* `(date, shares, trades, dollars)`.
Each row has four columns, each with a name and a data type.

### Say it in English

A SQL query defines a relation: a collection of objects sharing the same
properties. The query above defines *all known activity from our books in a
given month, in date order, described by its date and the pretty-printed numbers
of shares, trades, and dollars for that day.*

That sentence is the English version of the query. It declares the result we
expect — it does not say *how* to find the data. From that declaration, the SQL
engine finds, filters, and shapes the data to return exactly what you asked for.

### A model of the SQL execution engine

When I worked as a PostgreSQL consultant I did a lot of training. One trainee
found SQL pure magic — until we got to explain plans. Then: *"I know that, that's
like AS400 assembly! Now I understand everything!"* Maybe you're like him and
will find SQL clearer from the query plan:

```sql
EXPLAIN (costs off) select …

 Index Scan using factbook_date_idx on factbook
   Index Cond: ((date >= '2017-02-01'::date)
            AND (date < '2017-03-01'::date))
```

Here PostgreSQL uses an index scan — and because the index returns rows in the
order we declared, it doesn't even have to sort. Ask for a different order and
the planner adds a Sort node on top. It's relations all the way down.

### Thinking in SQL

When you write a query, you declare the result set you want — which is just
another relation. SQL manipulates relations with operators: append, sort,
filter, project, group, aggregate, merge. The power of SQL lies in composing
relations until you obtain exactly the one you need.

A good exercise: before writing a query, describe the result set you expect in a
single sentence, in your own language. Then translate it to SQL.

### Sharpen the saw

Now that you have the basics, revisit
[SQL aggregates](/yesql/querying-data/sql-aggregates/) and `GROUP BY`, then
`HAVING`. Get back to mastering [JOINs](/yesql/querying-data/what-is-a-join/) —
all of them, including `LATERAL`. Then Common Table Expressions (and the trickier
`RECURSIVE` variant), and finally **window functions**: there's SQL before window
functions, and SQL after. Few constructs are such a game changer.

### Practice, practice, practice

SQL is hard to master, especially if you miss the first steps — so make sure you
understand the notion of a relation, and that your job is to *declare* the final
relation you want. Then PostgreSQL does the rest.

Don't just learn this in the abstract — for every query you write, begin with a
relation you can refine until you get the result set you need. Two queries a day
keeps the doctor away. It will do wonders for your SQL skills.
