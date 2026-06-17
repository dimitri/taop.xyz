+++
title = "Where Does Business Logic Belong?"
weight = 20
summary = "Every query already embeds business logic. The real question is not whether to put logic in the database, but how much — and the answer turns on correctness and efficiency."
tags = ["SQL", "Business Logic", "Architecture"]
book_chapter = "Chapter 5, Business Logic"
+++

Teams argue endlessly about whether business logic belongs in the application or the database. I think that framing is wrong. Every SQL query you write already contains business logic, so the question is not *whether* but *how much*.

Look at this query and ask what it encodes:

```sql
  select name
    from track
   where albumid = 193
order by trackid;
```

The `select` says your use case only cares about track names. The `where` says you want album 193. The `order by` says tracks should appear in disc order, and that `trackid` happens to capture that order. That is four business decisions in five lines. There is no logic-free query.

So the useful question is where to *implement* a given use case, and you decide that on two axes: correctness and efficiency. Consider a concrete case: list each album by an artist with its total duration.

In SQL, that is one statement:

```sql
  select album.title as album,
         sum(milliseconds) * interval '1 ms' as duration
    from album
         join artist using(artistid)
         left join track using(albumid)
   where artist.name = 'Red Hot Chili Peppers'
group by album
order by album;
```

```
         album         │           duration
═══════════════════════╪══════════════════════════════
 Blood Sugar Sex Magik │ @ 1 hour 13 mins 57.073 secs
 By The Way            │ @ 1 hour 8 mins 49.951 secs
 Californication       │ @ 56 mins 25.461 secs
(3 rows)
```

The alternative is to fetch the artist, then the albums, then loop over albums fetching tracks, and finally sum the durations in application code.

That alternative loses on **correctness**. Each separate query runs in its own snapshot. If a concurrent user reassigns an album between two of your fetches, you can silently report a duration of zero. The single SQL statement always runs against one consistent snapshot, so the anomaly cannot happen.

It also loses on **efficiency**. The application version is five network round trips instead of one. With a typical 1–2 ms latency between app and database, you have burned ten milliseconds before doing any real work, while the server computes the whole result in under one millisecond. Multiply that by your concurrent users and the gap only widens.

Push the [aggregation](/yesql/querying-data/sql-aggregates/) and [joins](/yesql/querying-data/what-is-a-join/) into the query the database was built to run them. That is usually the correct *and* the efficient choice.
