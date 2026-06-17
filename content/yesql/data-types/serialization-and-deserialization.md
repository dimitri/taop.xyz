+++
title = "Serialization and Deserialization"
weight = 10
summary = "A database is not a place to dump strings and parse them back. Its type system is the contract that keeps your data consistent across every part of your application."
tags = ["Data Types", "Consistency", "RDBMS", "Type System"]
book_chapter = "Chapter 21, Serialization and Deserialization"
+++

It is tempting to think of an RDBMS as a place to *store* your in-memory
objects: you serialize them on the way in, deserialize them on the way out, and
treat the database as a fancy disk. That framing misses the point entirely.

Saving a value to disk and reading it back is not a problem you need a database
for. A flat file does that. What you actually get from PostgreSQL is something
much more valuable: a *transactional* system that guarantees the **consistency**
of your data — the C in ACID.

Why does that matter? Because a real application is never one program. It's an
admin panel, a customer back-office, a public front-end, accounting reports —
often written in different languages by different teams, sometimes by
third-party tools. For all of those to agree on the same business rules, you
need one core that enforces correctness for everyone. That core is your
database, and the way it enforces correctness is through its **type system**.

This is the boundary I want you to internalize: the type system is the contract
between your application and your data. When you pick the right column type, you
hand the work of validation to PostgreSQL instead of scattering string-parsing
and casting logic across every service that touches the table.

Here's the difference in one line. Ask PostgreSQL to accept an impossible date:

```sql
select date '2010-02-29';
```

```
ERROR:  date/time field value out of range: "2010-02-29"
LINE 1: select date '2010-02-29';
                    ^
```

2010 was not a leap year, so February 29th does not exist — and PostgreSQL
*knows* that, because its `date` type implements the Gregorian calendar. A
column typed as `text` would have happily stored that string, and every reader
would later have to discover, independently, that it's garbage.

That's the trade. Store a date as `text` and you've signed up to validate it in
application code, forever, in every language you use. Store it as `date` and the
database refuses bad input at the door, once, for everyone.

So before reaching for a generic string column, ask: *is there a type that
already understands this value?* Most of the time there is — and letting the
database enforce it is the whole reason it's there. Next, take
[a tour of the types PostgreSQL offers](/yesql/data-types/a-tour-of-postgresql-data-types/).
