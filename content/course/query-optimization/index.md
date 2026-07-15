+++
title = "Course 5 — Query Optimization Fundamentals"
layout = "course-toc"
type = "page"
course_num = 5
course_title = "Query Optimization Fundamentals"
course_tagline = "Systematic bottleneck identification, query rewriting, index strategy, and verified improvements."
course_dataset = "f1db, chinook, geoname, public.hashtag"
course_date = "June 2026"
course_prev_slug = "advanced-joins"
course_prev_title = "Advanced JOIN Techniques"
course_next_slug = "read-query-plans"
course_next_title = "Read Query Plans"

[[modules]]
num = 1
title = "How PostgreSQL Executes Queries"
tier = "Core"
topics = [
  "Cost model settings (seq_page_cost, random_page_cost)",
  "Table statistics — pg_stats: MCVs, histograms, n_distinct",
  "Row estimates from EXPLAIN",
  "Query lifecycle statistics with pg_stat_statements"
]

[[modules]]
num = 2
title = "Reading and Interpreting EXPLAIN"
tier = "Core"
topics = [
  "Basic EXPLAIN — startup cost, total cost, rows, width",
  "EXPLAIN ANALYZE — actual timing and row counts",
  "BUFFERS — cache hits vs disk reads",
  "Plan node types: Seq Scan, Index Scan, Hash Join, Nested Loop, Merge Join"
]

[[modules]]
num = 3
title = "Identifying Performance Bottlenecks"
tier = "Core"
topics = [
  "Sequential scan cost on large tables",
  "Misestimation from correlated columns — CREATE STATISTICS fix",
  "Sort cost — full materialization before first row",
  "Join selectivity and predicate ordering"
]

[[modules]]
num = 4
title = "Query Rewriting Techniques"
tier = "Advanced"
topics = [
  "Predicate pushdown",
  "EXISTS vs IN for subqueries",
  "CTE optimization fences — MATERIALIZED vs inlined",
  "Removing unnecessary work: DISTINCT, COUNT semantics"
]

[[modules]]
num = 5
title = "Common Anti-Patterns"
tier = "Advanced"
topics = [
  "Non-sargable predicates — function on indexed column — and expression index fix",
  "OFFSET pagination vs keyset pagination",
  "SELECT * and row width impact"
]

[[modules]]
num = 6
title = "Indexing for Performance"
tier = "Advanced"
topics = [
  "Index types: B-tree, Hash, GiST, GIN, BRIN",
  "Selectivity and index choice",
  "Composite indexes and column order",
  "Partial indexes",
  "Covering indexes with INCLUDE clause",
  "Index-only scans and the visibility map",
  "GiST kNN scan and GIN array containment"
]

[[modules]]
num = 7
title = "Advanced Optimization Patterns"
tier = "Advanced"
topics = [
  "Tables and views inventory (pg_class)",
  "Materialized CTEs (WITH … AS MATERIALIZED)",
  "Query decomposition with named CTEs"
]

[[modules]]
num = 8
title = "Systematic Optimization Workflow"
tier = "Architect"
topics = [
  "Step 1 — Observe: pg_stat_statements, pg_stat_user_tables",
  "Step 2 — Diagnose: plan signals (filter removal, spill, batches, estimate divergence)",
  "Step 3 — Fix: ANALYZE, index creation, query rewrite, work_mem, VACUUM",
  "Step 4 — Verify: plan comparison, pg_stat_statements confirmation",
  "Partitioning and partition pruning",
  "Parallel query: Gather, Gather Merge",
  "Performance budgets, query SLAs, caching ladder",
  "When not to optimize — Amdahl's law, SLA-driven stopping condition"
]
+++
