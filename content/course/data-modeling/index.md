+++
title = "Course 3 — Data Modeling for Performance"
layout = "course-data-modeling"
type = "page"
course_num = 3
course_title = "Data Modeling for Performance"
course_tagline = "Schema design from relational foundations through constraints, indexes, and safe schema evolution."
course_dataset = "chinook & f1db — plus EAV, JSONB, and temporal examples"
course_date = "May 2026"
course_prev_slug = "aggregation"
course_prev_title = "Reliable Aggregation"
course_next_slug = "advanced-joins"
course_next_title = "Advanced JOIN Techniques"

[[modules]]
num = 1
title = "The Relational Model"
tier = "Core"
topics = [
  "Normal forms and the three database anomalies",
  "First through fifth normal forms",
  "Contrasting schemas: chinook (enforced FKs) vs f1db (no FKs)",
  "Constraint inventory via pg_constraint",
  "Foreign key enforcement trade-offs"
]

[[modules]]
num = 2
title = "Primary Keys and Constraints"
tier = "Core"
topics = [
  "Natural vs surrogate primary keys",
  "UUID generation with gen_random_uuid() and uuidv7()",
  "Check constraints",
  "Generated stored columns (GENERATED ALWAYS AS STORED)",
  "NOT NULL migration pattern",
  "Exclusion constraints with btree_gist — temporal overlap prevention"
]

[[modules]]
num = 3
title = "Relationships at Scale"
tier = "Core"
topics = [
  "Hierarchy chains and fan-out (artist → album → track → invoice_line)",
  "Junction tables — many-to-many",
  "Self-referential relationships and recursive CTEs",
  "Nullable foreign keys — optional relationships, orphan rows",
  "Foreign key actions: CASCADE, SET NULL, RESTRICT"
]

[[modules]]
num = 4
title = "Index Design and Access Patterns"
tier = "Advanced"
topics = [
  "Index types: B-tree, GiST, GIN, SP-GiST, BRIN, Hash, RUM, Bloom",
  "Fillfactor and HOT updates",
  "Unique constraints and partial unique indexes",
  "Composite indexes, partial indexes, covering indexes (INCLUDE)",
  "Functional / expression indexes",
  "Index column options: ASC/DESC, NULLS FIRST/LAST, operator classes"
]

[[modules]]
num = 5
title = "Modeling for Analytics"
tier = "Advanced"
topics = [
  "The star join — fact + dimension tables",
  "Intentional denormalisation for historical accuracy",
  "Materialized view vs live query",
  "Three-level MV dependency chain with concurrent refresh",
  "Arrays to reduce row count (array_agg)"
]

[[modules]]
num = 6
title = "Evolving Schemas Safely"
tier = "Advanced"
topics = [
  "Adding a column without a table rewrite (PostgreSQL 11+)",
  "Adding constraints safely — NOT VALID + VALIDATE CONSTRAINT",
  "Building indexes without downtime — CREATE INDEX CONCURRENTLY",
  "Production role hierarchy — cluster admin, schema owner, app roles",
  "Three-step pattern: add column → backfill → enforce NOT NULL",
  "Rolling back schema deployments"
]

[[modules]]
num = 7
title = "Advanced Modeling Trade-offs"
tier = "Architect"
topics = [
  "The EAV anti-pattern and JSONB as a replacement",
  "Normalising free-text fields: trigram similarity and many-to-many schema",
  "Modeling band membership with tstzrange exclusion constraints",
  "Multirange variant (tstzmultirange) for multiple stint windows"
]

[[modules]]
num = 8
title = "Data Architecture"
tier = "Architect"
topics = [
  "JSONB document model vs relational model",
  "Querying JSONB: ->, ->>, #>, path operators, @?, @@",
  "Containment with GIN index (@>)",
  "JSONB as an audit trail (to_jsonb + trigger)",
  "Building and decomposing JSONB (jsonb_build_object, jsonb_agg)",
  "SQL/JSON path language (PostgreSQL 12+)",
  "Expression index on extracted JSONB fields"
]
+++
