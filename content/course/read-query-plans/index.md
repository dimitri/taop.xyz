+++
title = "Course 6 — Read Query Plans"
layout = "course-read-query-plans"
type = "page"
course_num = 6
course_title = "Read Query Plans"
course_tagline = "Fluent EXPLAIN reading — every node type, its performance profile, and what to do about it."
course_dataset = "f1db, chinook, geoname, public.hashtag"
course_date = "June 2026"
course_prev_slug = "query-optimization"
course_prev_title = "Query Optimization Fundamentals"

[[modules]]
num = 1
title = "Introduction to EXPLAIN"
tier = "Core"
topics = [
  "Basic EXPLAIN syntax — cost range, rows, width",
  "Plan tree structure — indentation = parent/child, leaf = scan",
  "Cost anatomy: startup vs total cost",
  "Sequential Scan node and the Filter annotation",
  "EXPLAIN options: VERBOSE, SETTINGS, WAL, GENERIC_PLAN"
]

[[modules]]
num = 2
title = "EXPLAIN ANALYZE in Practice"
tier = "Core"
topics = [
  "Actual timing and row counts (actual time, actual rows, loops)",
  "Running EXPLAIN ANALYZE safely — BEGIN/ROLLBACK wrapper",
  "Actual vs estimated row divergence",
  "Loops — inner-side per-loop averages vs totals",
  "BUFFERS: shared hit vs read; track_io_timing"
]

[[modules]]
num = 3
title = "Understanding Plan Node Types"
tier = "Core"
topics = [
  "Scan nodes: Seq Scan, Index Scan, Index Only Scan, Bitmap Heap Scan, CTE Scan",
  "GiST Index Scan: Order By vs Index Cond in kNN mode",
  "Join nodes: Hash Join, Nested Loop (Memoize), Merge Join",
  "Aggregation and sort: Sort, Incremental Sort, HashAggregate, WindowAgg",
  "Set operation nodes: Append (UNION ALL), Recursive Union",
  "Parallel nodes: Gather, Gather Merge"
]

[[modules]]
num = 4
title = "Detecting Performance Issues"
tier = "Advanced"
topics = [
  "Row estimate mismatch — divergence propagates up the tree",
  "Expensive Sort — startup ≈ total cost; Limit above Sort doesn't help",
  "Hash Join batches — Batches > 1 means spill to disk",
  "Rows Removed by Filter — fetch-then-discard ratio as index signal"
]

[[modules]]
num = 5
title = "From Plan to Optimization"
tier = "Advanced"
topics = [
  "Index recommendations from Seq Scan + Filter signals",
  "Join rewrite: pushing predicates into JOIN ON for earlier filtering",
  "Cost-based decisions: reading planner cost numbers"
]

[[modules]]
num = 6
title = "Advanced Plan Analysis"
tier = "Advanced"
topics = [
  "Bitmap Index Scan — moderate selectivity, two-phase page-order fetch",
  "GIN Bitmap Heap Scan for array containment — posting-list intersection",
  "Subplan nodes: InitPlan, SubPlan — correlated subqueries",
  "CTE Scan node — materialized tuplestore, single execution",
  "Window function plans — WindowAgg + Sort, Incremental Sort"
]

[[modules]]
num = 7
title = "Building a Diagnostic Workflow"
tier = "Advanced"
topics = [
  "Diagnostic step 1: scan ratios from pg_stat_user_tables",
  "Diagnostic step 2: plan comparison — default vs forced alternative",
  "Machine-readable plans with FORMAT JSON (explain.depesz.com, pev2)",
  "Repeatable benchmarking — cold vs warm cache, variance across runs"
]

[[modules]]
num = 8
title = "Observability and Performance Strategy"
tier = "Architect"
topics = [
  "Currently running queries: pg_stat_activity (state, wait_event, query)",
  "Table bloat and VACUUM — n_dead_tup, autovacuum signals",
  "Lock monitoring — blocked sessions and blocking queries",
  "Statistics management: pg_stats, default_statistics_target, CREATE STATISTICS",
  "Planner limitations: join search space, independence assumption, generic plans",
  "Chinook: confident inner-join cardinality with enforced foreign keys"
]
+++
