+++
title = "Batch Updates and Concurrency"
date = "2018-07-23T22:45:43+02:00"
tags = ["PostgreSQL","YeSQL","Concurrency","MOMA","Batch","UPDATE"]
categories = ["PostgreSQL","YeSQL"]
coverImage = "/img/batch-filling-bottles.jpg"
coverMeta = "in"
coverSize = "partial"
thumbnailImage = "/img/batch-process.jpg"
thumbnailImagePosition = "left"

+++

This article fits in the [PostgreSQL Concurrency](/tags/concurrency) series,
where we installed a tweeter like application schema and had all the
characters from Shakespeare's *A Midsummer Night's Dream* tweet their own
lines in our database in [PostgreSQL Concurrency: Data Modification
Language](/blog/2018/06/PostgreSQL-DML.md).

A previous article in the series covered how to manage concurrent retweets
in an efficient way: [Computing and
Caching](/blog/2018/07/computing-and-caching/), where we learn how to
maintain a cache right in your PostgreSQL database, thanks for materialized
views. We even went as far as maintaining an _external_ cache in another
application layer using PostgreSQL
[LISTEN](https://www.postgresql.org/docs/current/static/sql-listen.html) and
[NOTIFY](https://www.postgresql.org/docs/current/static/sql-notify.html)
features and a Golang application.

Today's article is going to address concurrency in the context of updating
data in a batch. This activity is quite common, as soon as your system is
connected to other systems either internally or with external providers.
While it's pretty easy to ingest new data, and easy enough to update data
from an external source when nothing happens in your database, doing the
operation safely with concurrent activity is more complex. Once more though,
PostgreSQL comes with all the tooling you need to handle that situation.

<!--more-->
<!--toc-->

## Batch Update, MoMA Collection

[The Museum of Modern Art (MoMA) Collection](https://github.com/MuseumofModernArt/collection)
hosts a database of the museum's collection, with monthly updates. The
project is best described in their own words:

> MoMA is committed to helping everyone understand, enjoy, and use our
> collection. The Museum’s website features 75,112 artworks from 21,218
> artists. This research dataset contains 131,585 records, representing all
> of the works that have been accessioned into MoMA’s collection and
> cataloged in our database. It includes basic metadata for each work,
> including title, artist, date made, medium, dimensions, and date acquired
> by the Museum. Some of these records have incomplete information and are
> noted as “not Curator Approved.”

Using *git* and *git lfs* commands, it's possible to retrieve versions of
the artist collection for the last months. From one month to the next, lots
of the data remains unchanged, and some is updated.

~~~ sql
begin;

create schema if not exists moma;

create table moma.artist
 (
   constituentid   integer not null primary key,
   name            text not null,
   bio             text,
   nationality     text,
   gender          text,
   begin           integer,
   "end"           integer,
   wiki_qid        text,
   ulan            text
 );

\copy moma.artist from 'artists/artists.2017-05-01.csv' with csv header delimiter ','

commit;
~~~

Now that we have loaded some data, let's have a look at what we have:

~~~ sql
select name, bio, nationality, gender
  from moma.artist
 limit 6;
~~~
 
Here are some of the artists being presented at the MoMA:
 
~~~ psql
      name       │         bio         │ nationality │ gender 
═════════════════╪═════════════════════╪═════════════╪════════
 Robert Arneson  │ American, 1930–1992 │ American    │ Male
 Doroteo Arnaiz  │ Spanish, born 1936  │ Spanish     │ Male
 Bill Arnold     │ American, born 1941 │ American    │ Male
 Charles Arnoldi │ American, born 1946 │ American    │ Male
 Per Arnoldi     │ Danish, born 1941   │ Danish      │ Male
 Danilo Aroldi   │ Italian, born 1925  │ Italian     │ Male
(6 rows)
~~~

## Updating the Data

After having successfully loaded the data from May, let's say that we have
received an update for June. As usual with updates of this kind, we don't
have a *diff*, rather we have a whole new file with a new content.

A *batch update* operation is typically implemented that way:

  - Load the new version of the data from file to a PostgreSQL table or a
    *temporary* table.

  - Use the *update* command ability to use *join* operations to update
    existing data with the new values.
  
  - Use the *insert* command ability to use *join* operations to insert new
    data from the *batch* into our target table.

Here's how to write that in SQL in our case:

~~~ sql
begin;

create temp table batch
 (
        like moma.artist
   including all
 )
 on commit drop;

\copy batch from 'artists/artists.2017-06-01.csv' with csv header delimiter ','

with upd as
(
     update moma.artist
        set (name, bio, nationality, gender, begin, "end", wiki_qid, ulan)
        
          = (batch.name, batch.bio, batch.nationality,
             batch.gender, batch.begin, batch."end",
             batch.wiki_qid, batch.ulan)

       from batch
       
      where batch.constituentid = artist.constituentid

        and (artist.name, artist.bio, artist.nationality,
             artist.gender, artist.begin, artist."end",
             artist.wiki_qid, artist.ulan)
         <> (batch.name, batch.bio, batch.nationality,
             batch.gender, batch.begin, batch."end",
             batch.wiki_qid, batch.ulan)

  returning artist.constituentid
),
    ins as
(
    insert into moma.artist
         select constituentid, name, bio, nationality,
                gender, begin, "end", wiki_qid, ulan
           from batch
          where not exists
                (
                     select 1
                       from moma.artist
                      where artist.constituentid = batch.constituentid
                )
      returning artist.constituentid
)
select (select count(*) from upd) as updates,
       (select count(*) from ins) as inserts;

commit;
~~~

Our *batch update* implementation follows the specifications very closely.
The ability for the *update* and *insert* SQL commands to use *join*
operations are put to good use, and the *returning* clause allows to display
some statistics about what's been done.

Also, the script is careful enough to only update those rows that actually
have changed thanks to using a *row comparator* in the update part of the
*CTE*.

Finally, note the usage of an *anti-join* in the insert part of the *CTE* in
order to only insert data we didn't have already.

Here's the result of running this *batch update* script:

~~~ psql
BEGIN
CREATE TABLE
COPY 15186
 updates │ inserts 
═════════╪═════════
      35 │      21
(1 row)

COMMIT
~~~

An implicit assumption has been made in the creation of this script. Indeed,
it considers the *constituentid* from MoMA to be a reliable primary key for
our data set. This assumption should, of course, be checked before deploying
such an update script to production.

<hr />

{{< figure class="right"
             src="/img/MasteringPostgreSQLinAppDev-Cover-th.png"
            link="https://masteringpostgresql.com" >}}
            
This article is extracted from my book [Mastering PostgreSQL in Application
Development](https://masteringpostgresql.com), which teaches SQL to
developers so that they may replace thousands of lines of code with very
simple queries. The book has a full chapter about *Data Manipulation and
Concurrency Control* in PostgreSQL, including caching with materialized
views, check it out!

<hr />

## Concurrency Patterns

While in this solution the update or insert happens in a single query, which
means using a single *snapshot* of the database and a within a transaction,
it is still not prevented from being used concurrently. The tricky case
happens if your application were to run the query above twice at the same
time.

What happens is that as soon as the concurrent sources contain some data for
the same *primary key*, you get a *duplicate key* error on the insert. As
both the transactions are concurrent, they are seeing the same *target*
table where the new data does not exists, and both will conclude that they
need to *insert* the new data into the *target* table.

There are two things that you can do to avoid the problem. The first thing
is to make it so that you're doing only one *batch update* at any time, by
building your application around that constraint.

A good way to implement that idea is with a manual *lock* command as explain
in the [explicit
locking](http://www.postgresql.org/docs/9.2/static/explicit-locking.html)
documentation part of PostgreSQL:

~~~ sql
LOCK TABLE target IN SHARE ROW EXCLUSIVE MODE;
~~~

That *lock level* is not automatically acquired by any PostgreSQL command,
so the only way it helps you is when you're doing that for every transaction
you want to serialize. When you know you're not at risk (that is, when not
playing the *insert or update* dance), you can omit that *lock*.

Another solution is using the new in PostgreSQL 9.5 *on conflict* clause for
the *insert* statement.

## On Conflict Do Nothing

When using PostgreSQL version 9.5 and later, it is possible to use the *on
conflict* clause of the *insert* statement to handle concurrency issues, as
in the following variant of the script we already saw. Here's a *diff* of
the first update script and the second one, that handles concurrency
conflicts:

~~~ diff
--- artists.update.sql	2017-09-07 23:54:07.000000000 +0200
+++ artists.update.conflict.sql	2017-09-08 12:49:44.000000000 +0200
@@ -5,11 +5,11 @@
         like moma.artist
    including all
  )
  on commit drop;
 
-\copy batch from 'artists/artists.2017-06-01.csv' with csv header delimiter ','
+\copy batch from 'artists/artists.2017-07-01.csv' with csv header delimiter ','
 
 with upd as
 (
      update moma.artist
         set (name, bio, nationality, gender, begin, "end", wiki_qid, ulan)
@@ -41,10 +41,11 @@
                 (
                      select 1
                        from moma.artist
                       where artist.constituentid = batch.constituentid
                 )
+    on conflict (constituentid) do nothing
       returning artist.constituentid
 )
 select (select count(*) from upd) as updates,
        (select count(*) from ins) as inserts;
 
~~~

Notice the new line *on conflict (constituentid) do nothing*. It basically
implements what it says: if inserting a new row causes a conflict, then the
operation for this row is skipped.

The conflict here is a *primary key* or a *unique* violation, which means
that the row already exists in the target table. In our case, this may only
happen because a concurrent query just inserted that row while our query is
in flight, in between its lookup done in the *update* part of the query and
the *insert* part of the query.

## Conclusion

PostgreSQL implements several facilities that we can rely on to maintain an
application cache for data that changes often:

  - In [Computing and Caching](/blog/2018/07/computing-and-caching/), we saw
    how to use a MATERIALIZED VIEW to get a fixed snapshot of the data, and
    then easily REFRESH it to implement our **cache invalidation policy**.
    
    This technique is well adapted to use cases where you want to rebuild
    your cache every once in a while, maybe every night, or several times a
    day, down to maybe every five minutes if the refreshing of the cache is
    really fast.
    
  - In [PostgreSQL Event Based
    Processing](/blog/2018/07/postgresql-event-based-processing/) we saw how
    to use TRIGGERs to maintain a transactionally correct cache, and the
    impact of such a choice on the scalability properties of your database
    backend.
    
    This solution is well suited to use case where the application only
    receives a small amount of UPDATE traffic, and quite far apart, and
    can't tolerate any lag when using the cache.
    
  - In [PostgreSQL LISTEN/NOTIFY](/blog/2018/07/postgresql-listen/notify/)
    we saw how to build an online cache maintenance service with
    PostgreSQL's advanced notification features.
    
    This solution is well suited to use cases where a small amount of lag
    can be tolerated, up to maybe some seconds, most typically measured in
    the hundreds of milliseconds.
    
Adding to this cache management facilities, today's article shows how to
manage *batch updates* to your data set in a cincurrency safe way, thanks to
the [INSERT … ON CONFLICT … DO
UPDATE](https://www.postgresql.org/docs/current/static/sql-insert.html),
documented as part of the INSERT command.

Again, we see that core PostgreSQL features allow application developers to
build exactly the facility they need. PostgreSQL really is
[YeSQL](/tags/yesql/)!
