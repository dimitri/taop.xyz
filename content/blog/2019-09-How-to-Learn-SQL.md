+++
date = "2019-09-17T00:15:00+02:00"
title = "How to Learn SQL?"
tags = ["SQL", "Relation", "Learn SQL", "Learn PostgreSQL"]
categories = ["PostgreSQL","YeSQL"]
coverImage = "/img/online-school.jpg"
+++

Here we are, another SQL query to write. You wish you knew how to write that
mechanically, like you would a loop in your favorite programming language.
Or at least have a pretty clear idea of a skeleton to tweak until it gives
the result set you expect. So instead of working on your SQL query, you
google [How to write a SQL query?](#) or maybe even [How to learn SQL?](#)
Right. I feel you, I've been there too, even if quite some time ago…

So here my article where I teach you how to learn SQL.

I want to share with you how I did it, and how I continue to do it. There's
no magic secret sauce to it though, it's all basic work. Again, we have to
learn the main concepts and how they play together, then practice simple
steps, and then build from there.

<!--more-->

You did the same thing already, several times, I'm sure. You know how to
write code in one or several of Python, Java, Ruby, PHP, C, C++, Go,
JavaScript, Rust, or even some other languages. You mastered just enough of
spreadsheet formulas to know the difference of a relative and an absolute
cell address, remember how to do the classic sums and simple formulaes.
Maybe you even played with more esoteric languages such as J, or R. Or know
how to render nice graphics with either MatPlotlib or maybe d3js.

In short, you've been learning advanced tricks in other environments before.
So what makes SQL so special that you barely remember `SELECT * FROM table
WHERE ...` and find `JOINs` and `GROUP BY` hard to remember about?

In my case, what took some time to make sense for me where the bits the SQL
language is built on, its foundations. What are the foundations of SQL?

#### 1. At the heart of SQL there's the notion of a relation
#### 2. SQL is a declarative programming language
  
Those two statements have very practical consequences. Until you understand
[what a SQL relation is](/blog/2019-09-sql-relations/) everything is going
to be complex. Until you understand that SQL is declarative, the time you
spend writing queries is going to be a fight. Not a pretty one, mind you.

So here I want to spend some time diving into both topics. Let's even begin
with the declarative language parts. This is the fundamental you need to
understand.

### SQL is a declarative programming language

I have been taught imperative programming, and then teachers would go on
with object oriented concepts. Arguing that it allows for a much better code
organisation and re-use. Then I was introduced to functional programming,
which avoids side effects and prone very small functions with very
descriptive names. I liked that a lot!

I found later that you can make a mess of your code base with any paradigm
really.

So what is declarative programming? It's a paradigm where you **declare**
what you expect. In the case of SQL, your job is to declare the result set
you expect, in terms that are relevant to the result of the query.

### At the heart of SQL there's the notion of a relation

And the result of the query is going to be a relation. A relation is a
collection of objects that all have the same list of attributes, each with
its own domain. Or data type, as we say nowadays.

A tuple is a t-uple. When `t = 2` that's a *couple*. When `t = 3` that's a
*triple*. When `t = 4` that's a *quadruple*. When `t = 5` that's a
*quintuple*. When you don't know the number of attributes the abstract
relation you talk about in a teaching article that is broad and general,
then you say `t`, and then it's a *tuple*.

~~~ sql
\set start '2017-02-01'

  select date,
         to_char(shares, '99G999G999G999') as shares,
         to_char(trades, '99G999G999') as trades,
         to_char(dollars, 'L99G999G999G999') as dollars
    from factbook
   where date >= date :'start'
     and date  < date :'start' + interval '1 month'
order by date;
~~~

So this query builds a relation of *quadruples* `(date date, shares text,
trades text, dollars text)`. Each row of the result set has 4 columns. The
first one has the name *date* and is of type *date*, because that is the
data type of the attribute in the base relation `factbook`. The second
attribute is named *shares* and its attribute domain (data type) is *text*,
because that's the return type of the function `to_char`. Etc. You got it,
of course.

### Say it in English

Now, we said that SQL is declarative, and that a SQL query is declaring the
result set that is expected from executing it. In other words, a SQL query
defines a relation: a collection of objects sharing the same properties, a
collection of tuples.

The previous query defines the relation that contains all the known activity
from our books in a given month period starting at `start`, in date order,
such as the activity is defined by its date, the pretty printed number of
shares exchanged that day, the pretty printed number of trades exchanged
that day, and the pretty printed number of dollars printed that day.

The sentence you just read is the English version of the SQL query in the
previous paragrah. Read it again. It defines the result set we expect from
running the query. It does not say how to find the data, it declares the
result.

From this declaration, the SQL engine has to find the data and filter it and
massage it in a way that returns exactly what you ask for.

### A model of SQL execution engine

When I used to be a PostgreSQL consultant, I have done quite a bit of
training. There was this guy who didn't understand SQL. At all. It was all
magic to him. Until I began our chapter about explain plans. Then he said *“I
know that, that's like AS400 assembly! Now I understand everything!”*

Well, maybe you're like this trainee and will find it better to understand
SQL from having a look at the query plan.

``` sql
EXPLAIN (costs off) select …

 Index Scan using factbook_date_idx on factbook
   Index Cond: ((date >= '2017-02-01'::date)
            AND (date < '2017-03-01 00:00:00'::timestamp without time zone))
```

With this particular query, PostgreSQL chooses to use an index scan to find
the data in our date range of interest. That's because the index also
returns the data in the order we declared for the result set, so PostgreSQL
does not even have to sort it! Smart.

What if we want the result set relation to be sorted by number of dollars,
with the greater numbers first?

``` sql
explain (costs off, verbose)

  select date,
         to_char(shares, '99G999G999G999') as shares,
         to_char(trades, '99G999G999') as trades,
         to_char(dollars, 'L99G999G999G999') as dollars
    from factbook
   where date >= date :'start'
     and date  < date :'start' + interval '1 month'
order by dollars desc;


 Sort
   Output: date,
           (to_char(shares, '99G999G999G999'::text)), 
           (to_char(trades, '99G999G999'::text)), 
           (to_char(dollars, 'L99G999G999G999'::text))
   Sort Key: (to_char(factbook.dollars, 'L99G999G999G999'::text)) DESC
   ->  Index Scan using factbook_date_idx on public.factbook
         Output: date,
                 to_char(shares, '99G999G999G999'::text), 
                 to_char(trades, '99G999G999'::text), 
                 to_char(dollars, 'L99G999G999G999'::text)
         Index Cond: ((factbook.date >= '2017-02-01'::date)
                  AND (factbook.date < '2017-03-01 00:00:00'::timestamp without time zone))
(6 rows)
```

This time the execution plan is quite different. The index is still good for
implement the `WHERE` clause filtering. As we want the rows in a different
ordering though, PostgreSQL implements a sort node on-top of the relation
obtained by scanning the index. This sort node output is another relation,
which happens to match the definition we gave, so that's it.

In this execution plan you can see that PostgreSQL first does an index scan
on the `factbook` relation to implement the WHERE clause of our query. Then
it implements a Sort node on that intermediate relation to implement the
ORDER BY clause of our query.

The SELECT clause, also named the projection, has been evaluated right from
the begining this time, because it's such a simple query.

It's relations all the way down. Internally PostgreSQL calls then *tuple
store* when passing the result sets from bottom plan nodes to their upper
nodes.

### Thinking in SQL

When you write a SQL query, you declare the result set you want to obtain. A
result set is just another relation. SQL manipulates relations with
different kinds of operators: append, sort, filter, project, group,
aggregate, merge, etc.

The projection applies some computations on top of the raw data that you
have. The filtering keeps or rejects entries in the relation that the
current node is building. The sorting, well sorts the current relation in a
given order. Etc.

All pretty simple really. The power of SQL lies in composing relations
together until you obtain exactly the final relation that contains exactly
what you need.

A good exercise for being able to write a SQL query is to first describe the
result set you expect from it using a single sentence in your own language.
It's easier in your native language of course, so for complex queries I will
switch from English to French. Don't worry, I will decipher it back to
English as soon as I make sense of what I'm trying to achieve!

### Sharpen The Saw

You now have the basics to understand SQL. What's next? Well, same as
always. How do you get comfortable at something new? Practicing is how you
do it. You begin with simple things, and then add some more.

Now that you master the very basics of SQL, it might be time to revisit [SQL
aggregates](/blog/2019-09-sql-aggregates/) and the GROUP BY clause. While
there, you might want to have a look at GROUPING SETS. Very powerful
construct.

The next step might be the HAVING clause, this one is easy to understand and
useful in many cases. It's a filter that applies to each group you are
building with the GROUP BY clause, because your declaration is not always
interested in every group found in your data set.

Once you have played around with those concepts, a good next step is to get
back to master JOINs. All of them, INNER JOIN, OUTER JOIN. CROSS JOIN and
NATURAL JOIN. LATERAL JOIN too. That's more advanced, and it relieves a
limitation found in the other joins. Make sure you understand the
limitation, and LATERAL JOIN will have no secret for you. I'll write more
about them here, in time, of course.

A good step after that would be Common Table Expressions, or CTE. A very
easy concept that allows to write SQL queries as pipelines. Beware of the
more complex variant, the RECURSIVE CTE.

Now you can have a look at WINDOW FUNCTIONS too. There's SQL before window
functions, and SQL after window functions. That's how powerful those are.
Few constructs in SQL are such a game changer, so you need to make sure you
understand how to use them. Life changer.

### Practice, practice, practice

You get the idea now. SQL is hard to master, and even more so if you miss
the first steps. I got you here. You need to make sure you understand the
notion of a relation first. And that your job when writing a SQL query is to
declare the final relation you want to retrieve the data from. Define the
realtion, watch PostgreSQL do the rest for you.

To define a relation, SQL provides you with a lots of tools (clauses) that
you can compose in advanced ways. Begin with simple things, and build from
there.

I don't mean just in general. I mean for every single query you have to
write, begin with a relation that you can refine until you get exactly the
result set of your dreams. Or the one the Marketing department asked you to
provide, anyways.

Two queries a day keeps the doctor away, or something like that. Just find
an occasion to write a couple queries a day. That will help you understand
your database a lot better, and will do wonders to your SQL skills.

Of course, some people need more that those abstract advice. They need
examples that have been carefully curated to help learn SQL, and they need
examples of result declarations in English and then in SQL, and to see the
result, and then to copy/paste the query example and run it themselves and
tweak it and read the EXPLAIN plan for it.

You're covered. I wrote a book with exactly that content. You're on the
website for the book. Either get the sample by giving me your email below,
or just go buy [The Art of PostgreSQL](https://theartofpostgresql.com) at
the home page!

