+++
title = "SQL is Code"
weight = 10
summary = "Your queries live in your application's source tree, so treat them like the rest of your code: format them for reading, comment intent, and put them under version control."
tags = ["SQL", "Style", "Code Quality"]
book_chapter = "Chapter 8, SQL is Code"
+++

Here is a stance I want you to adopt: the queries you send to PostgreSQL are part of your application logic, not throwaway strings. Even a [simple join](/yesql/querying-data/what-is-a-join/) decides which columns to project, how to filter rows, and in what order to return them. That is logic, and it belongs in your source tree alongside everything else.

Once you accept that SQL is code, the consequences follow naturally. You apply the same standards you already use elsewhere: consistent formatting, meaningful names, comments that explain intent, and version control so changes are reviewable.

The biggest practical win is formatting. We read code far more than we write it, so optimize for the reader. Here is a query crammed onto one line, in the old all-caps habit:

```sql
SELECT title, name FROM album LEFT JOIN track USING(albumid) WHERE albumid = 1 ORDER BY 2;
```

It works, but you have to parse it before you can understand it. Now the same query, with top-level clauses right-aligned on their own lines:

```sql
  select title, name
    from album left join track using(albumid)
   where albumid = 1
order by trackid;
```

The structure is obvious at a glance. Notice I also changed `order by 2` to `order by trackid`. Ordering by output column number is handy at the prompt, but it makes refactoring fragile: reorder the `select` list and the sort silently changes meaning. Naming the column makes intent explicit and survives edits.

When you do something unusual, say why in a comment. The goal is the same as in any language: the reader should never have to second-guess the author's intentions.

```sql
  -- artists whose name was reused as a track title by another artist
  select artist.name as artist,
         track.name  as track
    from      artist
         join track on track.name = artist.name;
```

Because your queries are now files in the repository, you can test them too. Given a known input, a query should return a known output. That safety net lets you rewrite a query, for example inlining a [CTE](/yesql/querying-data/sql-aggregates/) as a subquery, and confirm the result is unchanged.

Treat SQL like the code it is, and it stops being the mysterious part of your stack.
