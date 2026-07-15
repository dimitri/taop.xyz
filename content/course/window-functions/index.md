+++
title = "Course 1 — Master Window Functions"
layout = "course-window-functions"
type = "page"
course_num = 1
course_title = "Master Window Functions"
course_tagline = "Write analytical SQL without collapsing rows or resorting to application-side processing."
course_dataset = "f1db — Formula One racing"
course_date = "April 2026"
course_next_slug = "aggregation"
course_next_title = "Reliable Aggregation"

[[modules]]
num = 1
title = "Foundations of Window Functions"
tier = "Core"
topics = [
  "OVER clause — turns aggregates into window functions",
  "ORDER BY within a window",
  "PARTITION BY — independent groups per window",
  "Difference with GROUP BY — window keeps all rows, GROUP BY collapses them",
  "Row vs window context"
]

[[modules]]
num = 2
title = "Ranking & Row Navigation"
tier = "Core"
topics = [
  "ROW_NUMBER",
  "RANK & DENSE_RANK",
  "NTILE",
  "LEAD & LAG"
]

[[modules]]
num = 3
title = "Running & Moving Aggregates"
tier = "Core"
topics = [
  "SUM() OVER — running totals",
  "Moving averages",
  "Frame clauses: ROWS vs RANGE"
]

[[modules]]
num = 4
title = "Frame Semantics Deep Dive"
tier = "Core"
topics = [
  "UNBOUNDED PRECEDING & FOLLOWING",
  "CURRENT ROW",
  "Frame definitions — ROWS, RANGE, GROUPS",
  "Frame edge cases with duplicate values",
  "EXCLUDE clause"
]

[[modules]]
num = 5
title = "Advanced Analytical Patterns"
tier = "Advanced"
topics = [
  "Gaps & islands — counter reset detection",
  "Cohort analysis with FIRST_VALUE()",
  "Sessionization — pit-stop stint detection",
  "Percentiles: PERCENT_RANK, CUME_DIST, NTILE"
]

[[modules]]
num = 6
title = "Performance & Query Design"
tier = "Advanced"
topics = [
  "Execution plans and the WindowAgg node",
  "Sorting costs and spec sharing",
  "Index considerations for window ORDER BY",
  "Anti-patterns: filtering on window output vs source columns"
]

[[modules]]
num = 7
title = "Composing Complex Queries"
tier = "Advanced"
topics = [
  "CTEs for multi-pass computations",
  "Subquery filter pattern — filtering window results",
  "LATERAL joins with window functions",
  "Chained window passes",
  "Query refactoring from correlated subqueries"
]

[[modules]]
num = 8
title = "Designing Analytical Workloads"
tier = "Architect"
topics = [
  "Materialized views for pre-computed standings",
  "Incremental computation — rolling metrics",
  "ETL/ELT patterns: deduplication, surrogate keys, pre-computation",
  "Trade-offs with OLAP systems (Redshift, BigQuery, DuckDB)",
  "Data architecture patterns — raw / integrated / presentation layers"
]
+++
