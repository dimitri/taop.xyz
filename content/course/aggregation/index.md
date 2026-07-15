+++
title = "Course 2 — Reliable Aggregation"
layout = "course-aggregation"
type = "page"
course_num = 2
course_title = "Reliable Aggregation"
course_tagline = "Avoid correctness traps, master conditional aggregates, and build reports you can trust."
course_dataset = "f1db — Formula One racing"
course_date = "May 2026"
course_prev_slug = "window-functions"
course_prev_title = "Master Window Functions"
course_next_slug = "data-modeling"
course_next_title = "Data Modeling for Performance"

[[modules]]
num = 1
title = "Foundations of Aggregation"
tier = "Core"
topics = [
  "GROUP BY semantics and evaluation order",
  "Aggregate functions: SUM, COUNT, AVG, MIN, MAX",
  "NULL handling and boolean aggregates (bool_and, bool_or)",
  "Row vs group context"
]

[[modules]]
num = 2
title = "Correctness in Aggregates"
tier = "Core"
topics = [
  "Duplicate rows and COUNT DISTINCT",
  "WHERE vs HAVING — filtering before or after aggregation",
  "Filtered aggregates with FILTER clause",
  "DISTINCT vs GROUP BY"
]

[[modules]]
num = 3
title = "Multi-Level Aggregation Patterns"
tier = "Core"
topics = [
  "CTEs for multi-step aggregation",
  "Chaining CTEs — nested max/sum pattern",
  "Nested aggregation with multiple CTEs and GROUPING SETS"
]

[[modules]]
num = 4
title = "Advanced GROUP BY Features"
tier = "Advanced"
topics = [
  "GROUPING SETS",
  "ROLLUP — hierarchical subtotals",
  "CUBE — all dimension combinations",
  "GROUPING() function to identify synthetic NULLs"
]

[[modules]]
num = 5
title = "Combining Aggregates with Other SQL Features"
tier = "Advanced"
topics = [
  "Aggregation with joins — aggregate-then-join pattern",
  "Conditional aggregation with CASE inside SUM",
  "Window functions vs GROUP BY",
  "A complete reporting query: FILTER, HAVING, COUNT DISTINCT combined"
]

[[modules]]
num = 6
title = "Performance & Scalability of Aggregations"
tier = "Advanced"
topics = [
  "Hash vs sort aggregation",
  "Reading aggregation plans — HashAggregate vs GroupAggregate",
  "Pre-aggregation strategies with materialized views",
  "Profiling with EXPLAIN (ANALYZE, BUFFERS)"
]

[[modules]]
num = 7
title = "Designing Reliable Reporting Queries"
tier = "Advanced"
topics = [
  "Idempotent aggregation — fixed time bounds",
  "Ordered-set aggregates: percentile_cont, percentile_disc, mode()",
  "Gap filling with generate_series",
  "Datetime fence-post trap — BETWEEN vs half-open interval",
  "Drift detection with LAG()",
  "Bi-temporal modeling — valid time, transaction time, SCDs"
]

[[modules]]
num = 8
title = "Aggregation in Data Architectures"
tier = "Architect"
topics = [
  "Materialized views — full refresh vs CONCURRENTLY",
  "Incremental aggregation with upsert (INSERT … ON CONFLICT)",
  "ETL/ELT patterns and MERGE (PostgreSQL 15+)",
  "OLAP vs OLTP trade-offs",
  "Distributed aggregation with Citus"
]
+++
