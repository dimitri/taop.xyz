+++
title = "The psql REPL: Your SQL Workbench"
weight = 30
summary = "psql is the interactive read-eval-print loop where you build queries one step at a time. A small psqlrc and a handful of backslash commands turn it into a serious workbench."
tags = ["SQL", "psql", "Tooling"]
book_chapter = "Chapter 7, The SQL REPL — An Interactive Setup"
+++

New PostgreSQL users often go hunting for a fancy visual query tool and are surprised when the answer is `psql`, the command-line client that ships with PostgreSQL. Most experts never think twice about it. It is a REPL — a read-eval-print loop — and that is exactly what you want while [learning a schema or shaping a query](/yesql/sql-foundations/how-to-learn-sql/). We usually only see a query in its finished form; the REPL is where you iterate from a rough first cut to the real thing.

Start by giving yourself a good environment. `psql` reads `~/.psqlrc` at startup, so put your defaults there:

```
\set PROMPT1 '%~%x%# '
\x auto
\set ON_ERROR_STOP on
\set ON_ERROR_ROLLBACK interactive
\pset null '¤'
set intervalstyle to 'postgres_verbose';
```

A few of these earn their keep immediately. `\x auto` switches to expanded, one-field-per-line output when a row is too wide for the terminal, which makes wide result sets readable. `ON_ERROR_ROLLBACK interactive` quietly issues a savepoint before each statement in a transaction, so a typo no longer aborts the whole block — you fix the line and carry on. The prompt shows a `*` whenever a transaction is open, so you always know your state.

Beyond the config, three habits will speed you up.

`\timing` tells you how long each query took, so you notice a slow one before it reaches production:

```
f1db# \timing
Timing is on.
f1db# select count(*) from track;
 count
═══════
  3503
(1 row)

Time: 0.842 ms
```

`\e` opens your `$EDITOR` on the last query. For anything past a couple of lines, editing in a real editor and running it on save beats retyping at the prompt.

`\set` defines variables you reference with `:name`, or `:'name'` to inject a quoted literal — handy for parameterizing a query you are iterating on:

```sql
\set artist 'Red Hot Chili Peppers'
select title from album
  join artist using(artistid)
 where artist.name = :'artist';
```

The backslash commands like `\d`, `\l+`, and `\df` are themselves just catalog queries. Set `\set ECHO_HIDDEN true` and `psql` will print the SQL it runs behind them — a free lesson in querying the system catalogs.

Spend an afternoon in `psql` with the manual open. It pays for itself many times over.
