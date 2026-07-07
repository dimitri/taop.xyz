+++
title = "Range Types and Temporal Constraints"
weight = 50
summary = "PostgreSQL range types represent intervals with operators for overlap, containment, and adjacency — and pair with GiST exclusion constraints to enforce non-overlap at write time."
tags = ["range types", "tstzrange", "exclusion constraint", "GiST", "temporal", "multirange"]
course_title = "Data Modeling for Performance"
course_url = "/course/"
cta_eyebrow = "Keep going"
cta_title = "Data Modeling for Performance"
cta_body = "Range types are one chapter. The course covers primary key design, JSON documents, array columns, exclusion constraints, and the full trade-off picture for semi-structured data."
cta_url = "/course/"
cta_label = "Explore the Course"
lab_datasets = "chinook"
+++

The chinook dataset is a digital music store. At its core runs a
hierarchy: artists release albums, albums contain tracks, tracks are sold
as invoice lines. Each of the eleven tables is connected by a declared,
enforced foreign key — with one exception. The `track` table has a
`composer` column that stores attribution as plain text, exactly as typed,
with no uniqueness constraint.

That free-text field is a denormalization trap. The same person appears
under multiple spellings because nothing in the schema prevents it:

```sql
select composer, count(*) as tracks
  from chinook.track
 where composer in ('Brian May', 'May, Brian')
 group by composer
 order by tracks desc;
```

```
  composer  │ tracks
────────────┼────────
 May, Brian │      4
 Brian May  │      2
```

Six tracks by one person, silently split into two composer identities. Any
per-composer count is wrong. Any cross-dataset join on composer name is
wrong. This is the update anomaly applied to attribution data.

The fix is a normalised `composer` schema — three tables that replace the
single text column:

- **`composer.composer`** holds one row per canonical name with a `UNIQUE`
  constraint. Spelling variants (`"May, Brian"`) collapse into their
  canonical form (`"Brian May"`) at load time using string similarity.
- **`composer.track`** mirrors `chinook.track`, dropping the free-text field.
- **`composer.trackcomposer`** is the N:M junction: one row per (track,
  composer) credit. A track can credit several composers; a composer can
  appear on thousands of tracks.

Track credits answer "who wrote this song?" They do not answer "who was
in this band?" — and certainly not "who was in this band *on this date*?"
Band membership is a different fact with a temporal dimension track credits
lack. Members join, leave, and sometimes rejoin. John Frusciante left the
Red Hot Chili Peppers in 1992, came back in 1998, left again in 2009, and
came back again in 2019. Phil Taylor left Motörhead in 1984 and came back
in 1987.

Two more tables extend the schema: `composer.band` names each group, and
`composer.bandmember` links composers to bands with an `active` column — a
`tstzrange` that records exactly when each person held that membership.

![The five-table composer schema: track attribution (top) and band membership (bottom) both resolve to the shared composer hub; the active tstzrange in bandmember is the column this lesson is about](/img/diagrams/fig-composer-schema-erd.svg)

The `composer.composer` table sits at the centre. Track credits connect
from the top via `trackcomposer`; band stints connect from the bottom via
`bandmember`. This lesson focuses on the lower half — `composer.band` and
`composer.bandmember` — and on the `tstzrange` that makes temporal
membership precisely queryable.

### The schema

```sql
create extension if not exists btree_gist;

create table composer.band (
  id   serial primary key,
  name text   not null unique
);

create table composer.bandmember (
  id          serial    primary key,
  band_id     int       not null references composer.band(id),
  composer_id int       not null references composer.composer(id),
  active      tstzrange not null,
  exclude using gist (band_id with =, composer_id with =, active with &&)
);
```

`active` is a `tstzrange` — a range of `timestamptz` values with a lower and
upper bound. The upper bound is the special timestamp `'infinity'` for members
who are still active.

The `EXCLUDE USING GIST` constraint says: *no two rows with the same
`band_id` and `composer_id` may have overlapping `active` ranges.* This is
what allows Phil Taylor's two Motörhead stints to coexist — they don't overlap
— while blocking a duplicate that would. A plain `UNIQUE (band_id,
composer_id)` would forbid the second stint entirely.

`&&` is the *overlap* operator. Two ranges overlap when they share at least one
point. The exclusion constraint uses a GiST index to enforce this at write time
without any trigger or application-level check.

### The data

```sql
insert into composer.bandmember (band_id, composer_id, active) values
  (rhcp_id, frusciante_id, tstzrange('1988-01-01', '1992-05-07')),
  (rhcp_id, frusciante_id, tstzrange('1998-04-01', '2009-12-31')),
  (rhcp_id, frusciante_id, tstzrange('2019-12-15', 'infinity'));
```

Three rows, same `(band_id, composer_id)`, non-overlapping ranges. The
exclusion constraint accepts all three. Attempt to insert a range that overlaps
any of these and it rejects with a constraint violation.

### The lineup query

```sql
select b.name                                   as band,
       c.name                                   as member,
       lower(bm.active)::date                   as joined,
       case when upper(bm.active) = 'infinity' then null
            else upper(bm.active)::date end     as departed,
       (upper(bm.active) = 'infinity')          as current
  from composer.band          b
       join composer.bandmember bm on bm.band_id = b.id
       join composer.composer   c  on c.id = bm.composer_id
 order by b.name, lower(bm.active);
```

```
          band           │       member       │   joined   │  departed  │ current
═════════════════════════╪════════════════════╪════════════╪════════════╪═════════
 King Diamond            │ King Diamond       │ 1985-06-01 │            │ t
 King Diamond            │ Mikkey Dee         │ 1985-06-01 │ 1992-01-01 │ f
 King Diamond            │ Andy LaRocque      │ 1987-01-01 │            │ t
 Metallica               │ James Hetfield     │ 1981-10-28 │            │ t
 Metallica               │ Lars Ulrich        │ 1981-10-28 │            │ t
 Metallica               │ Cliff Burton       │ 1982-12-28 │ 1986-09-27 │ f
 Metallica               │ Kirk Hammett       │ 1983-04-01 │            │ t
 Motörhead               │ Lemmy Kilmister    │ 1975-06-01 │ 2015-12-28 │ f
 Motörhead               │ Lucas Fox          │ 1975-06-01 │ 1975-11-01 │ f
 Motörhead               │ Larry Wallis       │ 1975-06-01 │ 1976-05-01 │ f
 Motörhead               │ Phil Taylor        │ 1975-11-01 │ 1984-05-01 │ f
 Motörhead               │ Eddie Clarke       │ 1976-05-01 │ 1982-05-01 │ f
 Motörhead               │ Würzel             │ 1984-02-01 │ 1995-10-01 │ f
 Motörhead               │ Phil Campbell      │ 1984-02-01 │ 2015-12-28 │ f
 Motörhead               │ Pete Gill          │ 1984-05-01 │ 1987-06-01 │ f
 Motörhead               │ Phil Taylor        │ 1987-06-01 │ 1992-01-01 │ f
 Motörhead               │ Mikkey Dee         │ 1992-01-01 │ 2015-12-28 │ f
 Queen                   │ Roger Taylor       │ 1968-06-01 │            │ t
 Queen                   │ Freddie Mercury    │ 1970-06-27 │ 1991-11-24 │ f
 Queen                   │ Brian May          │ 1970-06-27 │            │ t
 Queen                   │ John Deacon        │ 1971-02-01 │ 1997-01-31 │ f
 Red Hot Chili Peppers   │ Anthony Kiedis     │ 1983-01-01 │            │ t
 Red Hot Chili Peppers   │ Flea               │ 1983-01-01 │            │ t
 Red Hot Chili Peppers   │ Chad Smith         │ 1988-01-01 │            │ t
 Red Hot Chili Peppers   │ John Frusciante    │ 1988-01-01 │ 1992-05-07 │ f
 Red Hot Chili Peppers   │ Dave Navarro       │ 1993-09-01 │ 1998-04-01 │ f
 Red Hot Chili Peppers   │ John Frusciante    │ 1998-04-01 │ 2009-12-31 │ f
 Red Hot Chili Peppers   │ John Frusciante    │ 2019-12-15 │            │ t
 Scorpions               │ Rudolf Schenker    │ 1965-01-01 │            │ t
 Scorpions               │ Klaus Meine        │ 1969-01-01 │            │ t
 Scorpions               │ Matthias Jabs      │ 1978-01-01 │            │ t
 Scorpions               │ Mikkey Dee         │ 2016-01-01 │            │ t
(32 rows)
```

Phil Taylor appears twice in Motörhead — two separate rows for two separate stints — ordered by `lower(active)`. John Frusciante appears three times in RHCP for the same reason. The `current` column is `t` for members whose upper bound is `'infinity'`.

`lower(range)` and `upper(range)` extract the bounds. Casting to `::date`
strips the time-zone component for display. A member still active gets `NULL`
for `departed`.

### Point-in-time: who was in which band on a given date?

The `@>` (containment) operator asks: *does this range contain this point?* A
single operator call answers "was this person a member at this moment?"

```sql
select b.name as band,
       c.name as member
  from composer.band          b
       join composer.bandmember bm on bm.band_id = b.id
       join composer.composer   c  on c.id = bm.composer_id
 where bm.active @> '1985-07-13 12:00:00+00'::timestamptz
 order by b.name, c.name;
```

```
         band            │      member
═════════════════════════╪══════════════════
 King Diamond            │ King Diamond
 King Diamond            │ Mikkey Dee
 Metallica               │ Cliff Burton
 Metallica               │ James Hetfield
 Metallica               │ Kirk Hammett
 Metallica               │ Lars Ulrich
 Motörhead               │ Lemmy Kilmister
 Motörhead               │ Phil Campbell
 Motörhead               │ Pete Gill
 Motörhead               │ Würzel
 Queen                   │ Brian May
 Queen                   │ Freddie Mercury
 Queen                   │ John Deacon
 Queen                   │ Roger Taylor
 Red Hot Chili Peppers   │ Anthony Kiedis
 Red Hot Chili Peppers   │ Flea
 Scorpions               │ Klaus Meine
 Scorpions               │ Matthias Jabs
 Scorpions               │ Rudolf Schenker
(19 rows)
```

The date is 13 July 1985 — Live Aid. Nineteen members were active across six
bands. Phil Taylor is not in this result: his first Motörhead stint ended in
May 1984, and his second didn't begin until June 1987. John Frusciante isn't
in RHCP yet; he joined in January 1988. Andy LaRocque joined King Diamond in
1987, so he is also absent.

![Band membership timelines: Queen, RHCP, and Motörhead, with a Live Aid point-in-time query at 1985-07-13](/img/diagrams/fig-range-band-timeline.svg)

The orange dots mark the 19 members the `@>` query returns. Phil Taylor's two
stints in Motörhead are both visible as separate bars with a gap — the gap
when Pete Gill held the drum chair.

### Members in multiple bands

Many-to-many works in both directions. A composer can belong to several bands
in succession:

```sql
select c.name                                   as composer,
       b.name                                   as band,
       lower(bm.active)::date                   as joined,
       case when upper(bm.active) = 'infinity' then null
            else upper(bm.active)::date end     as departed
  from composer.composer    c
       join composer.bandmember bm on bm.composer_id = c.id
       join composer.band       b  on b.id = bm.band_id
 where c.id in (
         select composer_id
           from composer.bandmember
          group by composer_id
         having count(distinct band_id) > 1
       )
 order by c.name, lower(bm.active);
```

```
  composer  │     band      │   joined   │  departed
════════════╪═══════════════╪════════════╪════════════
 Mikkey Dee │ King Diamond  │ 1985-06-01 │ 1992-01-01
 Mikkey Dee │ Motörhead     │ 1992-01-01 │ 2015-12-28
 Mikkey Dee │ Scorpions     │ 2016-01-01 │
(3 rows)
```

Mikkey Dee played drums for King Diamond (1985–1992), then Motörhead
(1992–2015), then joined Scorpions (2016–present) — four decades threading
three bands in sequence, visible on the timeline as three violet bars.

### The multirange variant

Thirty-two stints spread across six bands produce thirty-two `bandmember` rows.
When you only care about whether someone is *currently a member* — one row per
`(band, member)` pair — the `tstzmultirange` type collapses all stints into one
row per pair.

```sql
create table composer.bandmember_mr (
  id          serial          primary key,
  band_id     int             not null references composer.band(id),
  composer_id int             not null references composer.composer(id),
  active      tstzmultirange  not null,
  unique (band_id, composer_id)
);
```

A `tstzmultirange` is a sorted, non-overlapping collection of `tstzrange`
sub-ranges. PostgreSQL enforces non-overlap internally — any overlapping
sub-ranges on input are merged. A plain `UNIQUE` constraint replaces the GiST
exclusion constraint from the original schema; the type itself handles the
non-overlap invariant.

To populate, `range_agg()` collapses each member's per-stint rows into a
single `tstzmultirange`:

```sql
insert into composer.bandmember_mr (band_id, composer_id, active)
select band_id,
       composer_id,
       range_agg(active)
  from composer.bandmember
 group by band_id, composer_id;
```

```
 stints_in_original │ rows_in_multirange
════════════════════╪════════════════════
                 32 │                 30
(1 row)
```

Thirty-two stints become thirty rows: Phil Taylor's two Motörhead stints merge
into one `tstzmultirange` row, and Frusciante's three RHCP stints into another.

### Point-in-time against a multirange

The `@>` operator is defined on `tstzmultirange` with the same syntax:

```sql
select b.name as band,
       c.name as member
  from composer.band           b
       join composer.bandmember_mr bm on bm.band_id = b.id
       join composer.composer      c  on c.id = bm.composer_id
 where bm.active @> '1985-07-13 12:00:00+00'::timestamptz
 order by b.name, c.name;
```

The result is identical. On the multirange model, a single row covers all of
Frusciante's stints; `@>` checks whether the timestamp falls inside *any*
sub-range. The date 1985-07-13 falls before his first stint starts (1988),
so he is correctly excluded.

![RHCP line-up as tstzrange (7 rows) compared to tstzmultirange (5 rows); the query at 2004-01-01 hits Frusciante in both models](/img/diagrams/fig-range-multirange.svg)

The top half shows seven `tstzrange` rows for the RHCP lineup: three separate
rows for Frusciante's three stints. The bottom half shows five
`tstzmultirange` rows: Frusciante's three stints are one row with three
sub-ranges. The query at 2004-01-01 finds Frusciante in both models — in the
top half because his second `tstzrange` row contains that date; in the bottom
half because one sub-range of his `tstzmultirange` contains it.

### Expanding a multirange back to stints

To expand a `tstzmultirange` back to individual stint rows, use `unnest()`:

```sql
select b.name                                    as band,
       c.name                                    as member,
       lower(s)::date                            as joined,
       case when upper(s) = 'infinity'::timestamptz then null
            else upper(s)::date end              as departed,
       upper(s) = 'infinity'::timestamptz        as current
  from composer.band           b
       join composer.bandmember_mr bm on bm.band_id = b.id
       join composer.composer      c  on c.id = bm.composer_id
       cross join lateral unnest(bm.active) as s
 order by b.name, joined;
```

```
          band           │       member       │   joined   │  departed  │ current
═════════════════════════╪════════════════════╪════════════╪════════════╪═════════
 King Diamond            │ King Diamond       │ 1985-06-01 │            │ t
 King Diamond            │ Mikkey Dee         │ 1985-06-01 │ 1992-01-01 │ f
 King Diamond            │ Andy LaRocque      │ 1987-01-01 │            │ t
 Metallica               │ James Hetfield     │ 1981-10-28 │            │ t
 Metallica               │ Lars Ulrich        │ 1981-10-28 │            │ t
 Metallica               │ Cliff Burton       │ 1982-12-28 │ 1986-09-27 │ f
 Metallica               │ Kirk Hammett       │ 1983-04-01 │            │ t
 Motörhead               │ Lemmy Kilmister    │ 1975-06-01 │ 2015-12-28 │ f
 Motörhead               │ Lucas Fox          │ 1975-06-01 │ 1975-11-01 │ f
 Motörhead               │ Larry Wallis       │ 1975-06-01 │ 1976-05-01 │ f
 Motörhead               │ Phil Taylor        │ 1975-11-01 │ 1984-05-01 │ f
 Motörhead               │ Eddie Clarke       │ 1976-05-01 │ 1982-05-01 │ f
 Motörhead               │ Würzel             │ 1984-02-01 │ 1995-10-01 │ f
 Motörhead               │ Phil Campbell      │ 1984-02-01 │ 2015-12-28 │ f
 Motörhead               │ Pete Gill          │ 1984-05-01 │ 1987-06-01 │ f
 Motörhead               │ Phil Taylor        │ 1987-06-01 │ 1992-01-01 │ f
 Motörhead               │ Mikkey Dee         │ 1992-01-01 │ 2015-12-28 │ f
 Queen                   │ Roger Taylor       │ 1968-06-01 │            │ t
 Queen                   │ Freddie Mercury    │ 1970-06-27 │ 1991-11-24 │ f
 Queen                   │ Brian May          │ 1970-06-27 │            │ t
 Queen                   │ John Deacon        │ 1971-02-01 │ 1997-01-31 │ f
 Red Hot Chili Peppers   │ Anthony Kiedis     │ 1983-01-01 │            │ t
 Red Hot Chili Peppers   │ Flea               │ 1983-01-01 │            │ t
 Red Hot Chili Peppers   │ Chad Smith         │ 1988-01-01 │            │ t
 Red Hot Chili Peppers   │ John Frusciante    │ 1988-01-01 │ 1992-05-07 │ f
 Red Hot Chili Peppers   │ Dave Navarro       │ 1993-09-01 │ 1998-04-01 │ f
 Red Hot Chili Peppers   │ John Frusciante    │ 1998-04-01 │ 2009-12-31 │ f
 Red Hot Chili Peppers   │ John Frusciante    │ 2019-12-15 │            │ t
 Scorpions               │ Rudolf Schenker    │ 1965-01-01 │            │ t
 Scorpions               │ Klaus Meine        │ 1969-01-01 │            │ t
 Scorpions               │ Matthias Jabs      │ 1978-01-01 │            │ t
 Scorpions               │ Mikkey Dee         │ 2016-01-01 │            │ t
(32 rows)
```

`unnest(tstzmultirange)` returns one `tstzrange` per sub-range — the same
32 rows as querying the original `bandmember` table directly. Phil Taylor's
two Motörhead stints and Frusciante's three RHCP stints are fully restored.

### When to use each model

The **`tstzrange` model** (one row per stint) is the right default. It records
the full history, supports queries like "how many stints lasted more than five
years?" and makes point-in-time lookup fast with a GiST index on the `active`
column.

The **`tstzmultirange` model** (one row per member-band pair) is useful when:

- You always need to ask "is this person currently a member?" and never need
  to decompose stints individually
- You want to use `&&` (overlap) against a range of dates to find everyone who
  was active *at any point* during a period — one `@>` call checks the whole
  multirange, no `OR` required
- Row count matters and you have many members with many rejoins

Both models support the same `@>` operator for point-in-time queries.
