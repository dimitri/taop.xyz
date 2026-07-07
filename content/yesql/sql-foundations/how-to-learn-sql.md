+++
title = "How to Learn SQL"
weight = 10
summary = "There's no secret sauce — learn the two foundations (relations and declarative thinking), then practice in small steps and build from there."
tags = ["SQL", "Learn SQL", "Relation", "declarative"]
book_chapter = "the Introduction and Chapter 11, Structured Query Language"
aliases = ["/blog/2019-09-how-to-learn-sql/"]
lab_datasets = "factbook"
+++

What makes SQL so special that `JOINs` and `GROUP BY` feel hard to remember, even for developers who've learned far more complex things? In my experience, the issue is almost never syntax. It's the foundations the SQL language is built on. There are two:

1. **At the heart of SQL there's the notion of a relation.**
2. **SQL is a declarative programming language.**

Until you understand [what a SQL relation is](/yesql/sql-foundations/what-is-a-relation/), everything is complex. Until you understand that SQL is declarative, writing queries is a fight. Not a pretty one. Let's take both in turn.

### SQL is a declarative programming language

SQL is a declarative programming language — a paradigm where you **declare** what you expect. Your job is to declare the result set you want to obtain, in terms relevant to the result rather than the steps needed to get there.

This differs from most programming languages, where your job is to transform your understanding of the solution into a step-by-step recipe. In SQL you need to think in terms of the *problem* you want to solve. After that, the RDBMS figures out a plan and executes it. It is quite fair to say that SQL is a very high-level programming language: even as a developer you don't need to come up with a detailed solution, rather your job is to understand the problem well enough to be able to translate it.

### At the heart of SQL there's the notion of a relation

The result of a SQL query is itself a relation: a collection of objects that all have the same list of attributes, each with its own data type. SQL is a strongly typed language — at query planning time, the data type of every column in the result set must be known.

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

```
    date    │     shares      │   trades    │      dollars
════════════╪═════════════════╪═════════════╪══════════════════
 2017-02-01 │   1,161,001,502 │   5,217,859 │ $44,660,060,305
 2017-02-02 │   1,128,144,808 │   4,586,343 │ $38,586,483,435
 2017-02-03 │   1,084,735,476 │   4,396,471 │ $37,020,557,608
 ...
(20 rows)
```

This query builds a relation of *quadruples* `(date, shares, trades, dollars)`. Each row has four columns, each with a name and a data type.

### Say it in English

A SQL query is declaring a result set. That previous query defines *all known activity from our books in a given month, in date order, described by its date and the pretty-printed numbers of shares, trades, and dollars exchanged that day.*

That sentence is the English version of the query. It declares the result — it does not say how to find the data. From this declaration, the SQL engine finds, filters, and shapes the data to return exactly what you asked for.

### A model of the SQL execution engine

![PostgreSQL query pipeline: SQL text → Parser → Rewriter → Planner/Optimizer → Executor → result rows](/img/diagrams/fig-query-pipeline.svg)

When I used to be a PostgreSQL consultant, I did quite a bit of training. There was this guy who didn't understand SQL. At all. It was all magic to him. Until I began our chapter about explain plans. Then he said *"I know that, that's like AS400 assembly! Now I understand everything!"*

Maybe you're like this trainee and will find it better to understand SQL from a look at the query plan:

```sql
EXPLAIN (costs off) select …

 Index Scan using factbook_date_idx on factbook
   Index Cond: ((date >= '2017-02-01'::date)
            AND (date < '2017-03-01'::date))
```

PostgreSQL uses an index scan here — and because the index already returns rows in the order we declared, it doesn't even have to sort. Ask for a different order and the planner adds a Sort node on top of the intermediate relation. It's relations all the way down.

### Thinking in SQL

When you write a query, you declare the result set you want. A result set is just another relation. SQL manipulates relations with operators: append, sort, filter, project, group, aggregate, merge. The power of SQL lies in composing relations until you obtain exactly the one you need.

A good exercise: before writing a query, describe the result set you expect in a single sentence, in your own language — your native language if the query is complex enough. Then translate that sentence into SQL.

### Sharpen the saw

Now that you have the basics, revisit [SQL aggregates](/yesql/aggregation/sql-aggregates/) and `GROUP BY`, then `HAVING`. Get back to mastering [JOINs](/yesql/joins-and-relations/what-is-a-join/) — all of them, including `LATERAL`. Then Common Table Expressions (and the trickier `RECURSIVE` variant), and finally **window functions**: there's SQL before window functions, and SQL after. Few constructs are such a game changer.

### Practice, practice, practice

SQL is hard to master, especially if you miss the first steps. Make sure you understand the notion of a relation first, and that your job when writing a query is to declare the final relation you want. Then PostgreSQL does the rest.

Don't just learn this in the abstract — for every query you write, begin with a relation you can refine until you get exactly the result set you need. Two queries a day keeps the doctor away, or something like that. It will do wonders for your SQL skills.
