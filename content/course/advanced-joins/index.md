+++
title = "Course 4 — Advanced JOIN Techniques"
layout = "course-toc"
type = "page"
course_num = 4
course_title = "Advanced JOIN Techniques"
course_tagline = "SQL as relational algebra — all join types, LATERAL, semi/anti-joins, and recursive CTEs."
course_dataset = "f1db, chinook, tweet, geoname"
course_date = "June 2026"
course_prev_slug = "data-modeling"
course_prev_title = "Data Modeling for Performance"
course_next_slug = "query-optimization"
course_next_title = "Query Optimization Fundamentals"

[[modules]]
num = 1
title = "JOIN Fundamentals"
tier = "Core"
topics = [
  "INNER JOIN",
  "USING clause — why to avoid NATURAL JOIN",
  "LEFT JOIN, RIGHT JOIN, FULL OUTER JOIN, CROSS JOIN",
  "NULL behavior in joins — three-valued logic, IS DISTINCT FROM"
]

[[modules]]
num = 2
title = "Multi-Table JOIN Strategies"
tier = "Core"
topics = [
  "Progressive enrichment — star-from-the-center pattern",
  "Composite FK joins — multi-column ON condition",
  "Self-JOIN and the window-function alternative",
  "Recursive reach with WITH RECURSIVE, SEARCH, and CYCLE (PostgreSQL 14)"
]

[[modules]]
num = 3
title = "JOIN Pitfalls"
tier = "Core"
topics = [
  "Non-equality joins — range and inequality conditions",
  "JOIN amplification — the cause",
  "The COUNT(DISTINCT) fix and the aggregate-first fix"
]

[[modules]]
num = 4
title = "LATERAL JOINs"
tier = "Advanced"
topics = [
  "LATERAL as a manual loop — think Python's for-in",
  "Top-N per group with LATERAL",
  "Reading a LATERAL execution plan — Nested Loop + loops counter",
  "LATERAL over geographic data: top-N cities per country",
  "LATERAL with distance operator: kNN geographic search (GiST <->)",
  "LATERAL for social graph — top tweet per user",
  "Hashtag co-occurrence via array unnesting and self-join"
]

[[modules]]
num = 5
title = "Aggregation and Window Functions with JOINs"
tier = "Advanced"
topics = [
  "GROUP BY after JOIN — fact-table aggregation",
  "Filtered aggregates with FILTER clause",
  "Window functions over joined data — cumulative points by race"
]

[[modules]]
num = 6
title = "Complex Query Composition"
tier = "Advanced"
topics = [
  "CTEs for readability and multi-step logic",
  "Subqueries in join position — derived tables, aggregate-before-join",
  "Semi-JOIN: EXISTS — stop-early semantics, Semi Join plan node",
  "Anti-JOIN: NOT EXISTS — Anti Join plan node",
  "The NOT IN null trap",
  "Set operators: UNION, INTERSECT, EXCEPT",
  "DISTINCT ON — first row per group"
]

[[modules]]
num = 7
title = "JOIN Performance"
tier = "Advanced"
topics = [
  "Three join algorithms: Nested Loop, Hash Join, Merge Join",
  "Reading execution plans with EXPLAIN (ANALYZE, BUFFERS)",
  "Hash Join: Batches > 1 means spill to disk",
  "Index impact on join performance — before/after baseline",
  "Join order and planner limits (join_collapse_limit, geqo_threshold)"
]

[[modules]]
num = 8
title = "Architecture: Designing Join-Heavy Systems"
tier = "Architect"
topics = [
  "Materialized views — pre-compute vs on-demand, staleness trade-off",
  "Confident queries: chinook (enforced FKs) vs f1db (no FKs)",
  "Denormalization strategy — when to eliminate a join",
  "Access patterns drive schema design",
  "Course synthesis: CTEs + aggregation-before-join + window functions"
]
+++
