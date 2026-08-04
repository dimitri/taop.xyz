+++
title = "JSONB and Arrays"
weight = 40
summary = "PostgreSQL's JSONB and array types let you store semi-structured data without leaving the relational model — and without sacrificing indexability or query power."
tags = ["JSON", "JSONB", "array", "Data Types", "denormalization", "GIN"]
book_chapter = "Chapter 24, Denormalized Data Types"
lab_datasets = "chinook"
pglite = true
+++

PostgreSQL is a relational database, but it does not force you to normalize
everything into rows and columns. Some data is genuinely better modelled as
documents or variable-length sets — and PostgreSQL lets you do that while
keeping full query, index, and constraint support.

### JSONB: the document type that actually works

![JSONB operators: containment @>, path access ->, and the GIN index that makes them fast](/img/diagrams/fig-jsonb-operators.svg)

PostgreSQL has two JSON types: `json` (text with format validation) and
`jsonb` (binary, indexed, queryable). Use `jsonb`. The `json` type exists for
backwards compatibility.

`jsonb` supports three categories of operator. **Path access** operators
extract values: `->` returns a `jsonb` value; `->>` returns text.
**Containment** (`@>`) tests whether a document contains a given sub-document.
**Existence** (`?`) tests whether a key is present. None of these exist on
`json`.

```sql
-- Filter and project from a JSONB document store (magic.cards)
select data->>'name'     as card_name,
       data->>'type'     as card_type,
       data->>'manaCost' as mana_cost
  from magic.cards
 where data->>'type' like 'Creature%'
   and data->>'manaCost' is not null
 order by data->>'name'
 limit 5;
```

The `magic.cards` table stores each Magic: The Gathering card as a single
`jsonb` document. The column named `data` holds the entire card — name, type,
mana cost, subtypes, abilities — with no fixed schema enforced by the table.
`->>` extracts a field as text; `->` returns the nested `jsonb` value, useful
when the field is itself an object or array.

### GIN indexes make containment fast

A GIN (Generalized Inverted Index) indexes every key and value in a `jsonb`
column. With it, containment and existence queries hit the index rather than
scanning every document:

```sql
create index on magic.cards using gin (data);
```

```sql
explain (analyze, buffers)
  select data->>'name' as card_name,
         data->>'type' as card_type
    from magic.cards
   where data @> '{"type": "Creature — Human Wizard"}'::jsonb
   order by data->>'name';
```

The plan shows a Bitmap Index Scan on the GIN index, not a sequential scan.
Without the index, PostgreSQL must parse every document to evaluate `@>`.

PostgreSQL offers two GIN opclasses. The default (`jsonb_ops`) indexes all
keys and values and supports `@>`, `?`, `?|`, and `?&`. The alternative
(`jsonb_path_ops`) indexes only values — it produces a smaller index and
faster `@>` lookups, but does not support the existence operators.

### JSONPath: navigating nested documents

SQL/JSON path expressions (PostgreSQL 12+) navigate inside documents using
`$` as the document root:

```sql
-- @?: does the card have "Dragon" in its subtypes array?
select count(*)
  from magic.cards
 where data @? '$.subtypes[*] ? (@ == "Dragon")';

-- @@: cards whose converted mana cost exceeds 8
select distinct data ->> 'name' as name,
       (data ->> 'cmc')::int    as cmc
  from magic.cards
 where data @@ '$.cmc > 8'
 order by cmc desc, name
 limit 6;

-- jsonb_path_query: extract each matching subtype element
select distinct data ->> 'name'                          as card,
       jsonb_path_query(data, '$.subtypes[*]')::text     as subtype
  from magic.cards
 where data @? '$.subtypes[*] ? (@ == "Dragon")'
 order by card
 limit 8;
```

`@?` tests whether any element matches the path (returns boolean). `@@` tests
whether the path expression evaluates to true over the document. `$.array[*]`
iterates all elements; `?(@ == "Dragon")` filters to elements equal to
`"Dragon"`. The GIN index accelerates `@?` and `@@` queries.

### Decomposing documents with jsonb_each

`jsonb_each()` expands a `jsonb` object into `(key, value)` rows — the
relational inverse of `jsonb_build_object()`. Combined with `LATERAL`, it
decomposes documents for inspection:

```sql
select key, jsonb_typeof(value) as vtype
  from (select data from magic.cards
         where data @> '{"name":"Air Elemental"}' limit 1) c,
       lateral jsonb_each(c.data)
 order by key;
```

`jsonb_typeof()` returns the JSON type of a value: `"string"`, `"number"`,
`"boolean"`, `"array"`, `"object"`, or `"null"`. This is useful for auditing
document structure when the schema is not fixed.

### When to use JSONB

JSONB is the right choice when:

- The shape of the data varies per row (product attributes, event metadata,
  configuration objects)
- You need to query inside the document — not just store and retrieve it whole
- The structure is not yet settled and you want schema flexibility while the
  data model evolves

JSONB is not the right choice when every row has the same structure and you
know what columns you need. Typed columns are faster to query, easier to index
selectively, and produce clearer error messages when data is wrong.

A useful pattern: start with JSONB when the schema is uncertain, then promote
frequently-queried keys to typed columns with `ALTER TABLE ... ADD COLUMN` and
an expression index or generated column as an intermediate step.

### Arrays: a set of values in one column

Any PostgreSQL type can be stored as an array: `text[]`, `integer[]`,
`timestamptz[]`. The canonical use case is tags or labels — a small,
variable-length set of values that belongs to a single entity.

GIN indexing makes array containment queries fast:

```sql
create index on hashtag using gin (hashtags);
```

```sql
-- Find all tweets tagged with both #Hiring and #Retail:
select count(*)
  from hashtag
 where hashtags @> array['#Hiring', '#Retail'];
```

```
 count
═══════
   127
(1 row)
```

To process array contents as rows, use `unnest()`:

```sql
  select tag, count(*)
    from hashtag, unnest(hashtags) as t(tag)
group by tag
order by count desc
   limit 10;
```

```
     tag     │ count
═════════════╪═══════
 #jobs       │  2341
 #Hiring     │  1892
 #USA        │  1654
 #NYC        │  1203
 #Retail     │   918
 #Marketing  │   876
 #Tech       │   743
 #startup    │   621
 #remote     │   589
 #HR         │   512
(10 rows)
```

Arrays are good for "store a few values together, query them as a set." If
you find yourself doing a lot of per-element lookups, joins, or updates, you
probably need a proper lookup table instead.

### The underlying principle

Both types — JSONB and arrays — store multiple values or a structured value in
a single column, with operators and index types designed to query *inside* the
value rather than treating it as opaque. That is what PostgreSQL's extensibility
model was designed to enable.

Use them when the data genuinely has a non-tabular shape. Avoid using them as
a way to skip schema design — the update anomaly applies just as much when the
repeated fact is buried inside a JSON document or packed into an array.

For intervals and time spans, PostgreSQL's range types (`tstzrange`,
`daterange`, `int4range`) are the right model — covered in the
[Range Types and Temporal Constraints](/yesql/data-schema-design/range-types/)
lesson.
