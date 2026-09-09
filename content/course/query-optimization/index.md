+++
title = "Course 6 — Query Optimization Fundamentals"
layout = "course-query-optimization"
type = "page"
course_num = 6
course_title = "Query Optimization Fundamentals"
course_tagline = "Systematic bottleneck identification, query rewriting, index strategy, and verified improvements."
course_dataset = "f1db, chinook, geoname, public.hashtag"
course_date = "June 2026"
course_prev_slug = "read-query-plans"
course_prev_title = "Read Query Plans"

[[modules]]
num = 1
title = "Finding What to Optimize"
tier = "Core"
topics = [
  "Triage with pg_stat_statements",
  "Separating CPU-bound from I/O-bound time",
  "A fast recap: the cost model and statistics",
  "From a ranked list to a plan"
]

[[modules]]
num = 2
title = "Indexing for Performance"
tier = "Core"
topics = [
  "Index types in f1db; GiST kNN search on geoname; GIN array containment on hashtag",
  "Selectivity and index choice",
  "Composite indexes and column order; partial indexes",
  "Index-only scans and the visibility map",
  "Covering indexes with INCLUDE clause",
  "BRIN: physical order on geoname IDs",
  "When an index won't help"
]

[[modules]]
num = 3
title = "Query Rewriting Techniques"
tier = "Core"
topics = [
  "Predicate pushdown",
  "EXISTS vs IN for subqueries",
  "CTE optimization fences — MATERIALIZED vs inlined",
  "Window function and aggregate rewrites",
  "Removing unnecessary work: DISTINCT, COUNT semantics"
]

[[modules]]
num = 4
title = "Common Anti-Patterns"
tier = "Core"
topics = [
  "Non-sargable predicates — function on indexed column — and expression index fix",
  "OFFSET pagination vs keyset pagination",
  "SELECT * and row width impact"
]

[[modules]]
num = 5
title = "Statistics: Correlated Columns"
tier = "Advanced"
topics = [
  "Misestimation from correlated columns",
  "ndistinct: multi-column GROUP BY cardinality",
  "mcv: correlated but not functionally dependent",
  "Expression statistics; confirming the fix in pg_stats_ext",
  "SET STATISTICS: one column's sample; choosing the right tool"
]

[[modules]]
num = 6
title = "Configuration Tuning"
tier = "Advanced"
topics = [
  "work_mem: sorts and hashes",
  "effective_cache_size",
  "random_page_cost and seq_page_cost",
  "Parallel query",
  "Reading these settings together"
]

[[modules]]
num = 7
title = "Systematic Optimization Workflow"
tier = "Advanced"
topics = [
  "Fix: one change at a time",
  "Worked examples: join selectivity, materialized CTEs, decomposing a join",
  "Verify: compare plans",
  "Production monitoring: closing the loop",
  "Rollback discipline"
]

[[modules]]
num = 8
title = "Performance Architecture"
tier = "Architect"
topics = [
  "Partitioning and partition pruning; the reporting workload pattern",
  "Chinook: optimizing with foreign keys",
  "Performance budgets and caching; materialized views",
  "Generated columns; JSON and array indexing strategies",
  "Scaling out with Citus; three rules for denormalizing",
  "When not to optimize"
]
+++
