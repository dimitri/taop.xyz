+++
title = "Preventing SQL Injections"
date = "2018-11-10T15:40:01+01:00"
tags = ["PostgreSQL","YeSQL","Security","SQL Injection"]
categories = ["PostgreSQL","YeSQL"]
coverImage = "/img/sql-injection.jpg"
coverMeta = "in"
coverSize = "partial"
thumbnailImage = "/img/sql-injection-icon.png"
thumbnailImagePosition = "left"
aliases = ["/blog/2018/08/preventing-sql-injections/"]

+++

An *SQL Injection* is a security breach, one made famous by the [Exploits of
a Mom](https://xkcd.com/327/) `xkcd` comic episode in which we read about
*little Bobby Tables*:

{{< figure class="center"
             src="/img/exploits_of_a_mom.png"
            link="https://xkcd.com/327/" >}}

PostgreSQL implements a protocol level facility to send the static SQL query
text separately from its dynamic arguments. An SQL injection happens when
the database server is mistakenly led to consider a dynamic argument of a
query as part of the query text. Sending those parts as separate entities
over the protocol means that SQL injection is no longer possible.

<!--toc-->
<!--more-->

## PostgreSQL protocol: PQExecParam

The PostgreSQL protocol is fully documented and you can read more about
*extended query* support on the [Message
Flow](https://www.postgresql.org/docs/current/static/protocol-flow.html)
documentation page. Also relevant is the `PQexecParams` driver API,
documented as part of the [command execution
functions](https://www.postgresql.org/docs/current/static/libpq-exec.html)
of the `libpq` PostgreSQL C driver.

A lot of PostgreSQL application drivers are based on the libpq C driver,
which implements the PostgreSQL protocol and is maintained alongside the
main server's code. Some drivers variants also exist that don't link to any
C runtime, in which case the PostgreSQL protocol has been implemented in
another programming language. That's the case for variants of the JDBC
driver, and the `pq` Go driver too, among others.

It is advisable that you read the documentation of your current driver and
understand how to send SQL query parameters separately from the main SQL
query text; this is a reliable way to never have to worry about *SQL
injection* problems ever again.

In particular, ***never*** build a query string by concatenating your query
arguments directly into your query strings, i.e. in the application client
code. Never use any library, ORM or another tooling that would do that. When
building SQL query strings that way, you open your application code to
serious security risk for no reason.

## PostgreSQL protocol: server-side prepared statements

Another way to send the query string and its arguments separately on the
wire is to use server-side prepared statements. This is a pretty common way
to do it, mostly because `PQexecParams` isn't well known, though it made its
debut in PostgreSQL 7.4, released November 17, 2003. To this day, a lot of
PostgreSQL drivers still don't expose this facility.

Server-side Prepared Statements can be used in SQL thanks to the PREPARE and
EXECUTE commands syntax, as in the following example:

~~~ sql
prepare foo as
 select date, shares, trades, dollars
   from factbook
  where date >= $1::date
    and date  < $1::date + interval '1 month'
  order by date;
PREPARE
~~~

And then you can execute the prepared statement with a parameter that way,
still at the `psql` console:

~~~ sql
execute foo('2010-02-01');
~~~

If you're curious about it, here's the result we have when running this
query:

~~~ psql
    date    │   shares   │ trades  │   dollars   
════════════╪════════════╪═════════╪═════════════
 2010-02-01 │ 1558526732 │ 5633190 │ 43290463362
 2010-02-02 │ 1768180556 │ 6148888 │ 48391414625
 2010-02-03 │ 1603665758 │ 5693174 │ 44986991925
 2010-02-04 │ 2213497823 │ 7717240 │ 60148012581
 2010-02-05 │ 2427569880 │ 8905315 │ 65664171455
 2010-02-08 │ 1613044351 │ 5812392 │ 43592103468
 2010-02-09 │ 1935306014 │ 7027904 │ 50413934490
 2010-02-10 │ 1553714023 │ 5733271 │ 40915973371
 2010-02-11 │ 1648721018 │ 5939464 │ 44934557649
 2010-02-12 │ 2130203765 │ 6159665 │ 69545693638
 2010-02-16 │ 1617687910 │ 5258883 │ 45638709582
 2010-02-17 │ 1523567498 │ 5207224 │ 40810393758
 2010-02-18 │ 1432125288 │ 4953840 │ 40105345403
 2010-02-19 │ 1556863679 │ 4807694 │ 45236985452
 2010-02-22 │ 1386189749 │ 4807423 │ 40330077452
 2010-02-23 │ 1609958052 │ 5682556 │ 44853459493
 2010-02-24 │ 1552246071 │ 5405469 │ 42994120717
 2010-02-25 │ 1766446801 │ 6100559 │ 49503093455
 2010-02-26 │ 1781712668 │ 5197619 │ 49390248716
(19 rows)
~~~

Now, while it's possible to use the
[prepare](https://www.postgresql.org/docs/current/sql-prepare.html) and
[execute](https://www.postgresql.org/docs/current/sql-execute.html) SQL
commands directly in your application code, it is also possible to use it
directly at the PostgreSQL protocol level. This facility is named [Extended
Query](https://www.postgresql.org/docs/current/protocol-flow.html#PROTOCOL-FLOW-EXT-QUERY) and is well documented.

Reading the documentation about the protocol implementation, we see the
following bits. First the PARSE message:

> In the extended protocol, the frontend first sends a Parse message, which
> contains a textual query string, optionally some information about data
> types of parameter placeholders, and the name of a destination
> prepared-statement object [...]

Then, the BIND message:

> Once a prepared statement exists, it can be readied for execution using a
> Bind message. [...] The supplied parameter set must match those needed by
> the prepared statement.

Finally, to receive the result set the client needs to send a third message,
the EXECUTE message. The details of this part aren't relevant to this blog
post though.

It is very clear from the documentation excerpts above that the query string
parsed by PostgreSQL doesn't contain the parameters. The query string is
sent in the BIND message. The query parameters are sent in the EXECUTE
message. When doing things that way, it is impossible to have SQL
injections.

Remember: SQL injection happens when the SQL parser is fooled into believing
that a parameter string is in fact a SQL query, and then the SQL engine goes
on and executes that SQL statement. When the SQL query string lives in your
application code, and the user-supplied parameters are sent **separately**
on the network, there's no way that the SQL parsing engine might get
confused.

## A good example in Python, using asyncpg

The following example uses the
[asyncpg](https://magicstack.github.io/asyncpg/current/index.html)
PostgreSQL driver. It's open source and the sources are available at the
[MagicStack/asyncpg](https://github.com/MagicStack/asyncpg) repository,
where you can browse the code and see that the driver implements the
PostgreSQL protocol itself, and uses server-side prepared statements.

The following piece of code is an example of using the _asyncpg_ driver. The
example is safe from SQL injection by design, because the server-side
prepared statement protocol sends the query string and its arguments in
separate protocol messages.

Here's some client application code:

~~~ Python
async def fetch_month_data(year, month):
    "Fetch a month of data from the database"
    date = datetime.date(year, month, 1)
    sql = """
  select date, shares, trades, dollars
    from factbook
   where date >= $1::date
     and date  < $1::date + interval '1 month'
order by date;
"""
    pgconn = await asyncpg.connect(CONNSTRING)
    stmt = await pgconn.prepare(sql)

    res = {}
    for (date, shares, trades, dollars) in await stmt.fetch(date):
        res[date] = (shares, trades, dollars)

    await pgconn.close()

    return res
~~~

When you're using a [proper SQL integration
mechanism](https://tapoueh.org/blog/2017/06/how-to-write-sql/) such as
[anosql](https://github.com/honza/anosql), it becomes very easy to both work
on your queries interactively at the `psql` prompt then integrate them in
your code base, or use them directly from the code base in the `psql`
interactive REPL. That includes collaborating easily with your DBA.

## A wrong example in Python, using psycopg2

In the following example We are using the
[psycopg](http://initd.org/psycopg/) Python driver. Psycopg is based on the
PostgreSQL C implementation of the client-server protocol, `libpq`. The
documentation of this driver addresses [passing parameters to SQL
queries](http://initd.org/psycopg/docs/usage.html#passing-parameters-to-sql-queries)
right from the beginning.

*Psycopg* is not making good use of the functionality we just described, and
our `factbook-month.py` program above makes use of the `%s` syntax for SQL
query arguments. The interpolating of the query arguments is done on the
client side by the psycopg code, and a full query string is then sent to the
PostgreSQL server:

~~~ Python
def fetch_month_data(year, month):
    "Fetch a month of data from the database"
    date = "%d-%02d-01" % (year, month)
    sql = """
  select date, shares, trades, dollars
    from factbook
   where date >= date %s
     and date  < date %s + interval '1 month'
order by date;
"""
    pgconn = psycopg2.connect(CONNSTRING)
    curs = pgconn.cursor()
    curs.execute(sql, (date, date))

    res = {}
    for (date, shares, trades, dollars) in curs.fetchall():
        res[date] = (shares, trades, dollars)

    return res
~~~

So while it looks like the code is doing the right thing by passing the
arguments separately from the query string in the Python code, as seen in
the following line, you still need to trust Psycopg2 to be free of any SQL
injection faults.

~~~ Python
    # This looks fine. The interpolation still happens client side. Oops.
    curs.execute(sql, (date, date))
~~~

## Conclusion

SQL Injection is still a pretty serious problem in modern software
development. It's a huge security risk, and it's surprisingly easy to
protect your applications from this risk forever, at least when using
PostgreSQL.

At the protocol level, PostgreSQL knows how to receive the SQL query strings
separately from the sql parameters, often supplied dynamically by your
users. The PostgreSQL protocol even comes with two different ways to
implement that, either using the PQexecParams method from `libpq` or the
Extended Query message flow when doing server-side prepared statements: the
famous parse/bind/execute sequence of messages.

Say no to SQL injection today! Check your driver's implementation and how
you're using it in your application code, and make it so that parameters are
sent separately from the query strings. Then breathe easily and have a good
week-end folks!
