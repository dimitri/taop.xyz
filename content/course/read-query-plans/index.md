+++
title = "Course 5 — Read Query Plans"
layout = "course-read-query-plans"
type = "page"
course_num = 5
course_title = "Read Query Plans"
course_tagline = "Fluent EXPLAIN reading — every node type, its performance profile, and what to do about it."
course_dataset = "f1db, chinook, geoname, public.hashtag"
course_date = "June 2026"
course_prev_slug = "advanced-joins"
course_prev_title = "Advanced JOIN Techniques"
course_next_slug = "query-optimization"
course_next_title = "Query Optimization Fundamentals"

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
title = "Plan Node Types: Scans and Joins"
tier = "Core"
topics = [
  "Scan nodes: Seq Scan, Index Scan, Index Only Scan, Bitmap Index/Heap Scan, BitmapAnd/BitmapOr, Function Scan, GiST kNN Scan",
  "Join nodes: Hash Join, Nested Loop (with Memoize), Merge Join, Semi Joins, Anti Joins"
]

[[modules]]
num = 4
title = "Plan Node Types: Aggregation and Parallel Execution"
tier = "Advanced"
topics = [
  "Aggregation and sort nodes: Sort, Incremental Sort, HashAggregate, GroupAggregate, WindowAgg",
  "Set operations, subplans, and utility nodes: Append/MergeAppend, partition pruning, Recursive Union, InitPlan/SubPlan, CTE Scan, Limit, Materialize",
  "Parallel nodes: Gather, Gather Merge, Partial/Finalize Aggregate, and JIT compilation markers"
]

[[modules]]
num = 5
title = "Statistics and the Planner"
tier = "Advanced"
topics = [
  "What ANALYZE collects, and reading an estimate from the MCV list or the histogram",
  "What default_statistics_target buys you",
  "Correlation and cost, not just row count; estimates are assumptions, not measurements"
]

[[modules]]
num = 6
title = "Detecting Performance Issues"
tier = "Advanced"
topics = [
  "Row estimate mismatch — divergence propagates up the tree",
  "Expensive Sort — startup ≈ total cost; Limit above Sort doesn't help",
  "Hash Join batches — Batches > 1 means spill to disk",
  "Rows Removed by Filter — fetch-then-discard ratio as index signal"
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
