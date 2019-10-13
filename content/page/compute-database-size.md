+++
date = "2019-10-14T00:05:00+02:00"
title = "Compute database size"
tags = ["PostgreSQL", "Database Size", 
        "Normalisation", "Denormalisation", "Archiving"]
coverImage = "/img/charles-zGn2cg9qBvU-unsplash.jpg"
+++

<div>
    <p style="text-align: right;">
    Photo by 
<a style="background-color:black;color:white;text-decoration:none;padding:4px 6px;font-family:-apple-system, BlinkMacSystemFont, &quot;San Francisco&quot;, &quot;Helvetica Neue&quot;, Helvetica, Ubuntu, Roboto, Noto, &quot;Segoe UI&quot;, Arial, sans-serif;font-size:12px;font-weight:bold;line-height:1.2;display:inline-block;border-radius:3px" href="https://unsplash.com/@charlesdeluvio?utm_medium=referral&amp;utm_campaign=photographer-credit&amp;utm_content=creditBadge" target="_blank" rel="noopener noreferrer" title="Download free do whatever you want high-resolution photos from Charles 🇵🇭"><span style="display:inline-block;padding:2px 3px"><svg xmlns="http://www.w3.org/2000/svg" style="height:12px;width:auto;position:relative;vertical-align:middle;top:-2px;fill:white" viewBox="0 0 32 32"><title>unsplash-logo</title><path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z"></path></svg></span><span style="display:inline-block;padding:2px 3px">Charles 🇵🇭</span></a>
   </p>
</div>

It is well known that database design should be as simple as possible, and
follow the normalization process. Except in some cases, sometimes, for
scalability purposes. Partitioning might be used to help deal with large
amount of data for instance.

But what is a large amount of data? Do you need to pay attention to those
scalability trade-offs now, or can you wait until later? How far can you go
with a naive schema?

To answer those questions, it might be best to estimate the evolution of the
size of your database in the following months. Here's a simple tool that
allows you to do just that, given some information about your current
database:

{{< dbgraph >}}

With this graph adjusted to your parameters, you can have a quick estimation
of the size of your database over time. Of course, it's a simplified
approach which means the size growth is linear here.

As a rule of thumb, don't worry about your schema when in the next couple of
years you're going to have to deal with less than 100 GB of data.

Between 100 GB and 1 TB of data, depending on where the data is located you
might want to prepare for growth: typically, if 80% or more of your data is
all found in the same table, then you might have to take care of archiving
the data you're not using anymore. Good news: when it's all in a single
table, archiving is very easy to implement!

If you're going to have to deal with 1 TB to 10 TB in the next couple years,
then it's fair to have a detailed look at your schema design. Some kind of
denormalization might be needed here, to support some of your query traffic.

If you're reaching above 10 TB of data in the next couple years, then you
need to have a good approach to being able to handle it and this work should
begin now, definitely! Maybe have a look at sharding if that applies to your
use case (typically, multi-tenant or real-time analytics). Have a look at
Citus Data? (spoiler, I work there).

Again, when your database is going to handle less than 100 GB in the next 3
years, just normalize your schema the best you can! Not sure how to best
normalize a database schema? You're in luck: my book [The Art Of
PostgreSQL](/#) contains a whole chapter on this topic, and advanced
denormalization techniques when you need them, too!
