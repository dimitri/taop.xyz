+++
date = "2018-08-24T12:11:33+02:00"
title = "Geolocation with PostgreSQL"
tags = ["PostgreSQL", "YeSQL", "Point", "Geolocation", "Extensions", "ip4r"]
categories = ["PostgreSQL","YeSQL"]
coverImage = "/img/earth.jpg"
coverMeta = "in"
coverSize = "partial"
thumbnailImage = "/img/earth-tz-logo.jpg"
thumbnailImagePosition = "left"
+++

We have loaded Open Street Map points of interests in the article [The Most
Popular Pub Names](/blog/2013/08/the-most-popular-pub-names/) — which
compares PostgreSQL with MongoDB for simple geographical queries, and is
part of our [PostgreSQL Extensions](/tags/extensions/) article series. In
today's article, look at how to geolocalize an IP address and locate the
nearest pub, all within a single SQL query!

For that, we are going to use the awesome
[ip4r](https://github.com/RhodiumToad/ip4r) extension from
[RhodiumToad](http://blog.rhodiumtoad.org.uk/).

<!--more-->
<!--toc-->

## Geolocation Data Loading

The first step is to find an *geolocation* database, and several providers
are offering that. The one I did choose for that example is the
[http://www.maxmind.com](http://www.maxmind.com) free database available at
[GeoLite Free Downloadable
Databases](http://dev.maxmind.com/geoip/legacy/geolite/).

After having had a look at the files in there, we define the table schema we
want and load the archive, using pgloader. So, first, the target schema is
created using the following script:

~~~ sql
create extension if not exists ip4r;
create schema if not exists geolite;

create table if not exists geolite.location
(
   locid      integer primary key,
   country    text,
   region     text,
   city       text,
   postalcode text,
   location   point,
   metrocode  text,
   areacode   text
);
       
create table if not exists geolite.blocks
(
   iprange    ip4r,
   locid      integer
);

create index blocks_ip4r_idx on geolite.blocks using gist(iprange);
~~~

And the data can now be imported to those target tables thanks to the
following pgloader command, quite involved:

~~~
/*
 * Loading from a ZIP archive containing CSV files.
 */

LOAD ARCHIVE
   FROM http://geolite.maxmind.com/download/geoip/database/GeoLiteCity_CSV/GeoLiteCity-latest.zip
   INTO postgresql://appdev@/appdev

   BEFORE LOAD EXECUTE 'geolite.sql'

   LOAD CSV
        FROM FILENAME MATCHING ~/GeoLiteCity-Location.csv/
             WITH ENCODING iso-8859-1
             (
                locId,
                country,
                region     [ null if blanks ],
                city       [ null if blanks ],
                postalCode [ null if blanks ],
                latitude,
                longitude,
                metroCode  [ null if blanks ],
                areaCode   [ null if blanks ]
             )
        INTO postgresql://appdev@/appdev
        TARGET TABLE geolite.location
             (
                locid,country,region,city,postalCode,
                location point using (format nil "(~a,~a)" longitude latitude),
                metroCode,areaCode
             )
        WITH skip header = 2,
             drop indexes,
             fields optionally enclosed by '"',
             fields escaped by double-quote,
             fields terminated by ','

  AND LOAD CSV
        FROM FILENAME MATCHING ~/GeoLiteCity-Blocks.csv/
             WITH ENCODING iso-8859-1
             (
                startIpNum, endIpNum, locId
             )
        INTO postgresql://appdev@/appdev
        TARGET TABLE geolite.blocks
             (
                iprange ip4r using (ip-range startIpNum endIpNum),
                locId
             )
        WITH skip header = 2,
             drop indexes,
             fields optionally enclosed by '"',
             fields escaped by double-quote,
             fields terminated by ',';
~~~

The pgloader command describe the file format so that pgloader can parse the
data from the CSV file and transform it in memory to the format we expect in
PostgreSQL. The location in the CSV file is given as two separate fields
`latitude` and `longitude`, which we use to form a single `point` column.

In the same vein, in the pgloader command we also describe how to transform
a IP address range from a couple of integers to a more classic
representation of the same data:

~~~ lisp
CL-USER> (pgloader.transforms::ip-range "16777216" "16777471")
"1.0.0.0-1.0.0.255"
~~~

The pgloader command also finds the files we want to load independantly of
the real name of the directory, here `GeoLiteCity_20180327`. So when there's
a new release of the _Geolite_ files, you can run the pgloader all over
again and expect it to load the new data.

-->

And here's what the output of the pgloader command looks like. Note that I
have stripped the timestamps from the logs output, in order for the line to
make sense when printed in those pages:

~~~
$ pgloader --verbose geolite.load
NOTICE Starting pgloader, log system is ready.
LOG Data errors in '/private/tmp/pgloader/'
LOG Parsing commands from file #P"/Users/dim/dev/yesql/src/1-application-development/data/geolite/geolite.load"
LOG Fetching 'http://geolite.maxmind.com/download/geoip/database/GeoLiteCity_CSV/GeoLiteCity-latest.zip'
LOG Extracting files from archive '/var/folders/bh/t1wcr6cx37v4h87yj3qj009r0000gn/T/GeoLiteCity-latest.zip'
NOTICE unzip -o "/var/folders/bh/t1wcr6cx37v4h87yj3qj009r0000gn/T/GeoLiteCity-latest.zip" -d "/var/folders/bh/t1wcr6cx37v4h87yj3qj009r0000gn/T/GeoLiteCity-latest/"
NOTICE Executing SQL block for before load
NOTICE ALTER TABLE "geolite"."location" DROP CONSTRAINT IF EXISTS "location_pkey";
NOTICE COPY "geolite"."location"
NOTICE Opening #P"/private/var/folders/bh/t1wcr6cx37v4h87yj3qj009r0000gn/T/GeoLiteCity-latest/GeoLiteCity_20180327/GeoLiteCity-Location.csv"
NOTICE copy "geolite"."location": 234105 rows done,  11.5 MB,   2.1 MBps
NOTICE copy "geolite"."location": 495453 rows done,  24.3 MB,   2.2 MBps
NOTICE copy "geolite"."location": 747550 rows done,  37.1 MB,   2.2 MBps
NOTICE CREATE UNIQUE INDEX location_pkey ON geolite.location USING btree (locid)
NOTICE ALTER TABLE "geolite"."location" ADD PRIMARY KEY USING INDEX "location_pkey";
NOTICE DROP INDEX IF EXISTS "geolite"."blocks_ip4r_idx";
NOTICE COPY "geolite"."blocks"
NOTICE Opening #P"/private/var/folders/bh/t1wcr6cx37v4h87yj3qj009r0000gn/T/GeoLiteCity-latest/GeoLiteCity_20180327/GeoLiteCity-Blocks.csv"
NOTICE copy "geolite"."blocks": 227502 rows done,   7.0 MB,   1.8 MBps
NOTICE copy "geolite"."blocks": 492894 rows done,  15.2 MB,   1.9 MBps
NOTICE copy "geolite"."blocks": 738483 rows done,  22.9 MB,   2.0 MBps
NOTICE copy "geolite"."blocks": 986719 rows done,  30.7 MB,   2.1 MBps
NOTICE copy "geolite"."blocks": 1246450 rows done,  38.9 MB,   2.2 MBps
NOTICE copy "geolite"."blocks": 1489726 rows done,  47.1 MB,   2.2 MBps
NOTICE copy "geolite"."blocks": 1733633 rows done,  55.1 MB,   2.2 MBps
NOTICE copy "geolite"."blocks": 1985222 rows done,  63.3 MB,   2.2 MBps
NOTICE CREATE INDEX blocks_ip4r_idx ON geolite.blocks USING gist (iprange)
LOG report summary reset
             table name     errors       read   imported      bytes      total time
-----------------------  ---------  ---------  ---------  ---------  --------------
               download          0          0          0                     0.793s
                extract          0          0          0                     0.855s
            before load          0          5          5                     0.033s
                  fetch          0          0          0                     0.005s
-----------------------  ---------  ---------  ---------  ---------  --------------
   "geolite"."location"          0     928138     928138    46.4 MB         20.983s
     "geolite"."blocks"          0    2108310    2108310    67.4 MB         30.695s
-----------------------  ---------  ---------  ---------  ---------  --------------
        Files Processed          0          2          2                     0.024s
COPY Threads Completion          0          4          4                    51.690s
 Index Build Completion          0          0          0                    49.363s
         Create Indexes          0          2          2                    49.265s
            Constraints          0          1          1                     0.002s
-----------------------  ---------  ---------  ---------  ---------  --------------
      Total import time          ✓    3036448    3036448   113.8 MB       2m30.344s
~~~

We can see that pgloader has dropped the indexes before loading the data,
and created them again once the data is loaded, in parallel to loading data
from the next table. This parallel processing can be a huge benefit on beefy
servers.

So we now have the following tables to play with:

~~~ psql
                     List of relations
 Schema  │   Name   │ Type  │ Owner  │ Size  │ Description 
═════════╪══════════╪═══════╪════════╪═══════╪═════════════
 geolite │ blocks   │ table │ appdev │ 89 MB │ 
 geolite │ location │ table │ appdev │ 64 MB │ 
(2 rows)
~~~

## Finding an IP Address in our Ranges

Here's what the main data look like:

~~~ sql
table geolite.blocks limit 10;
~~~

The TABLE command is per SQL standard, so we might as well use it:

~~~ psql
       iprange       │ locid  
═════════════════════╪════════
 1.0.0.0/24          │ 617943
 1.0.1.0-1.0.3.255   │ 104084
 1.0.4.0/22          │     17
 1.0.8.0/21          │  47667
 1.0.16.0/20         │ 879228
 1.0.32.0/19         │  47667
 1.0.64.0-1.0.81.255 │ 885221
 1.0.82.0/24         │ 902132
 1.0.83.0-1.0.86.255 │ 885221
 1.0.87.0/24         │ 873145
(10 rows)
~~~

What we have here is a classic *ip range* column where we can see that the
datatype output function is smart enough to display ranges either in their
[CIDR notation](http://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing)
or in the more general *start-end* notation when no CIDR applies.

The *ip4r* extension provides several operators to work with the dataset we
have, some of those operators are supported by the index we just created.
And just for the fun of it here's a catalog query to inquire about them:

~~~ sql
select amopopr::regoperator
  from pg_opclass c
       join pg_am am on am.oid = c.opcmethod
       join pg_amop amop on amop.amopfamily = c.opcfamily
 where opcintype = 'ip4r'::regtype and am.amname = 'gist';
~~~

The catalog query above joins the PostgreSQL catalogs for operator classes,
index access methods on the notion of an operator family in order to
retrieve the list of operators associated with the `ip4r` data type and the
GiST access method:

~~~ psql
    amopopr     
════════════════
 >>=(ip4r,ip4r)
 <<=(ip4r,ip4r)
 >>(ip4r,ip4r)
 <<(ip4r,ip4r)
 &&(ip4r,ip4r)
 =(ip4r,ip4r)
(6 rows)
~~~

Note that we could have been using the psql `\dx+ ip4r` command instead of
course, but that query directly list operators that the *GiST* index knows
how to solve. The operator `>>=` reads as *contains* and is the one we're
going to use here.

~~~ sql
select iprange, locid
  from geolite.blocks
 where iprange >>= '91.121.37.122';
~~~

And here's the range in which we find the IP address 91.121.37.122, and the
location it's associated with:

~~~ psql
         iprange          │ locid 
══════════════════════════╪═══════
 91.121.0.0-91.121.71.255 │    75
~~~

This lookup is fast, thanks to our specialized GiST index, its timing is
under a millisecond.

## Geolocation meta-data

Now with the *MaxMind* schema that we are using in that example, the
interesting data actually is to be found in the other table, the
`geolite.location` one. Let's use another IP address now, I'm told by the
unix command `host` that `google.us has address 74.125.195.147` and we can
inquire where is that IP from:

~~~ sql
select *
 from      geolite.blocks
      join geolite.location using(locid)
where iprange >>= '74.125.195.147';
~~~

Our data locates the Google IP address in Mountain View, which is credible:

~~~ psql
─[ RECORD 1 ]───────────────────────────
locid      │ 2703
iprange    │ 74.125.191.0-74.125.223.255
country    │ US
region     │ CA
city       │ Mountain View
postalcode │ 94043
location   │ (-122.0574,37.4192)
metrocode  │ 807
areacode   │ 650
~~~

Now you can actually draw that on a map as you have the location information
as a *point* datatype containing both the *longitude* and *latitude*.

## Emergency Pub

What if you want to make an application to help lost souls find the nearest
pub from where they are currently? Now that you know their location from the
*IP address* they are using in their browser, it should be easy enough
right?

As we downloaded a list of pubs from the UK, we are going to use an IP
address that should be in the UK too.

{{< alert info >}}

See my project <https://github.com/dimitri/pubnames> for loading the same
set of data on your local database, or read the article [The Most Popular
Pub Names](/blog/2013/08/the-most-popular-pub-names/) for more about this
OpenStreetMap data loading.

{{< /alert >}}

~~~ bash
$ host www.ox.ac.uk
www.ox.ac.uk has address 129.67.242.154
www.ox.ac.uk has address 129.67.242.155
~~~

Knowing that, we can search the geolocation of this IP address:

~~~ sql
select *
  from      geolite.location l
       join geolite.blocks using(locid)
 where iprange >>= '129.67.242.154';
~~~

And the Oxford University is actually hosted in Oxford, it seems:

~~~ psql
─[ RECORD 1 ]─────────────
locid      │ 375290
country    │ GB
region     │ K2
city       │ Oxford
postalcode │ OX1
location   │ (-1.25,51.75)
metrocode  │ ¤
areacode   │ ¤
iprange    │ 129.67.0.0/16
~~~


What are the ten nearest pubs around if you're just out of the Oxford
University? Well, let's figure that out before we get thirsty!

<!-- 

    set parallel_setup_cost to 10000;

 -->

~~~ sql
   select pubs.name,
          round((pubs.pos <@> l.location)::numeric, 3) as miles,
          ceil(1609.34 * (pubs.pos <@> l.location)::numeric) as meters
   
     from geolite.location l
          join geolite.blocks using(locid)
          left join lateral
          (
              select name, pos
                from pubnames
            order by pos <-> l.location
               limit 10
          ) as pubs on true
          
    where blocks.iprange >>= '129.67.242.154'
 order by meters;
~~~

And here's the list, obtained in around about a millisecond on my laptop:

~~~ psql
        name        │ miles │ meters 
════════════════════╪═══════╪════════
 The Bear           │ 0.268 │    431
 The Half Moon      │ 0.280 │    451
 The Wheatsheaf     │ 0.295 │    475
 The Chequers       │ 0.314 │    506
 The Old Tom        │ 0.315 │    507
 Turl Bar           │ 0.321 │    518
 St Aldate's Tavern │ 0.329 │    530
 The Mad Hatter     │ 0.337 │    542
 King's Arms        │ 0.397 │    639
 White Horse        │ 0.402 │    647
(10 rows)
~~~

{{< alert warning >}}

The first run of this query wasn't very fast, until we realized with friends
on the IRC channel for PostgreSQL help that the plan was using parallel
processing. The size of the dataset means that the parallel setup cost is
going to ruin our performance here, so I've been doing the following to get
the query to run in 1ms rather than 15ms:

~~~ sql
set parallel_setup_cost to 10000;
~~~

{{< /alert >}}

So with PostgreSQL and some easily available extensionsm, we are actually
capable of performing advanced geolocation lookups in a single SQL query.
The timing of this query makes it possible to use it in production and serve
users requests directly from it, too!

## Conclusion

While some *geolocation* data provider are giving you some libs and code to
do quite fast lookups, any interesting thing you want to do with the
*geolocation* data is about the ***meta data***. And that's where yet again
[PostgreSQL](http://www.postgresql.org/) shines: you can actually use
specialized data types and operators, *JOINs* and *kNN* searches, all from
within a single query. You get back only those results you are interested
into, and the application is then responsible for adding value to that,
rather than processing the data itself.

Typically what the application here would be doing is drawing a map and
locating the pubs on it, adding maybe descriptions and votes and notes on
each address, maybe even the draft menu. An ideal application might even be
able to join the draft menu of each nearby pub against your own preferences
and offer you a nice short list ordered by what you're most likely to want
to drink at this hour.

Living in the future is both exciting and frightening!
