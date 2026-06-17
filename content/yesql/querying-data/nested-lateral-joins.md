+++
title = "Nested LATERAL Joins: Top-N Per Group"
weight = 50
summary = "The classic \"top-N per group\" problem, solved elegantly — and then nested — with PostgreSQL's LATERAL keyword."
tags = ["LATERAL", "JOIN", "Top-N", "jsonb"]
book_chapter = "Chapter 19, Understanding Relations and Joins"
book_url = "https://sales.theartofpostgresql.com/the-art-of-postgresql-book/"
cta_eyebrow = "Run it yourself"
cta_title = "The companion lab is free and open source"
cta_body = "This query ships in the PostgreSQL Starter Kit, with a Docker setup and real datasets so you can run every step locally."
cta_url = "https://github.com/dimitri/TheArtOfPostgreSQL"
cta_label = "Get the Starter Kit"
+++

The "top-N per group" is a classic SQL problem. PostgreSQL's `LATERAL` keyword
makes it elegant — and you can even nest them.

## The problem

We want the most recent articles per category, and for each article the first
three comments — in a classic schema with categories, articles, and comments as
first-class relations:

```
taop@taop=# \dt sandbox.*
         List of relations
 Schema  │   Name   │ Type  │ Owner
═════════╪══════════╪═══════╪═══════
 sandbox │ article  │ table │ taop
 sandbox │ category │ table │ taop
 sandbox │ comment  │ table │ taop
 sandbox │ lorem    │ table │ taop
(4 rows)
```

## Step 1 — a basic join

Start simple: how many articles do we have per category?

```sql
  select category.name, count(article.id)
    from sandbox.category
         join sandbox.article on article.category = category.id
group by category.name
order by count desc;
```

```
    name    │ count
════════════╪═══════
 box office │   343
 news       │   329
 sport      │   170
 music      │   158
(4 rows)
```

## Step 2 — add LATERAL

`LATERAL` lets the subquery reference columns from the tables listed before it.
That's what makes "the latest article *for this category*" expressible:

```sql
select category.name, article.title,
       to_char(article.pubdate, 'YYYY-MM-DD') as pubdate
  from sandbox.category
  join lateral (
      select id, title, pubdate
        from sandbox.article
       where category = category.id
    order by pubdate desc
       limit 1
  ) as article on true;
```

## Step 3 — nest a second LATERAL

Now nest another `LATERAL` to pull the top comments per article. The inner
subquery references `article.id`, which itself came from a lateral subquery:

```sql
select category.name, article.title,
       comment.id, to_char(comment.pubdate, 'YYYY-MM-DD') as pubdate
  from sandbox.category
  join lateral (
      select id, title, pubdate
        from sandbox.article
       where category = category.id
    order by pubdate desc
       limit 1
  ) as article on true
  join lateral (
      select id, content, pubdate
        from sandbox.comment
       where article = article.id
    order by pubdate desc
       limit 3
  ) as comment on true;
```

Four categories × one article × three comments = twelve rows, exactly the
top-N-per-group shape we wanted.

## Step 4 — aggregate with JSON

Finally, collapse the comments into a single structured column with
`jsonb_agg()`, so each row carries its article *and* its comments:

```sql
  select category.name as category,
         article.pubdate,
         title,
         jsonb_pretty(comments) as comments
    from sandbox.category
         left join lateral
         (
            select id, title, article.pubdate,
                   jsonb_agg(comment) as comments
              from sandbox.article
                  left join lateral
                  (
                      select comment.pubdate,
                             substring(comment.content from 1 for 25) || '…' as content
                        from sandbox.comment
                       where comment.article = article.id
                    order by comment.pubdate desc
                       limit 3
                  )
                  as comment on true
              where category = category.id
           group by article.id
           order by article.pubdate desc
              limit 1
         )
         as article on true
order by category.name, article.pubdate desc;
```

One query, no application-side loops, no N+1 — the database does the work and
hands back exactly the shape your API wants to return.
