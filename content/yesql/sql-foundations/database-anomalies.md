+++
title = "The Three Database Anomalies"
weight = 50
summary = "Storing the same fact in more than one place is the root cause of three predictable failures. Understanding update, insertion, and deletion anomalies is what makes normalization feel obvious rather than arbitrary."
tags = ["SQL", "Data Modeling", "Normalization", "Schema Design", "Fundamentals"]
lab_datasets = "f1db"
pglite = true
+++

Storing the same fact in more than one place is the root cause of a class of predictable failures. Wikipedia's article on Database Normalization defines the three anomalies as:

- **Update anomaly** — "The same information can be expressed on multiple rows; therefore updates to the relation may result in logical inconsistencies."
- **Insertion anomaly** — "There are circumstances in which certain facts cannot be recorded at all."
- **Deletion anomaly** — "Under certain circumstances, the deletion of data representing certain facts necessitates the deletion of data representing completely different facts."

These are not abstract concerns. Each one shows up in real schemas, produces real bugs, and has a real fix.

### Update anomaly

The *Employees' Skills* relation stores each employee's address on every row that records one of their skills. Employee 519 appears twice — and the two rows disagree on the address:

| Employee ID | Employee Address    | Skill           |
|-------------|---------------------|-----------------|
| 426         | 87 Sycamore Grove   | Typing          |
| 426         | 87 Sycamore Grove   | Shorthand       |
| 519         | 94 Chestnut Street  | Public Speaking |
| **519**     | **96 Walnut Avenue**| **Carpentry**   |

The address is not a fact about a skill — it is a fact about an employee. Storing it once per skill row means a single move requires updating every row for that employee. If the `UPDATE` covers only some rows (a network timeout, a batch job interrupted mid-run), the relation is left recording two different addresses for the same person with no way to determine which is correct.

The `f1db` schema has the same structure. Driver nationality is stored as plain text on the `drivers` row — one copy per driver. Renaming "British" to "English" must touch every row that carries that string:

```sql
select nationality,
       count(*) as drivers,
       'renaming ''' || nationality || ''' requires updating '
           || count(*) || ' rows'
       as anomaly
  from f1db.drivers
 where nationality in ('British', 'German', 'French')
 group by nationality
 order by drivers desc;
```

```
 nationality │ drivers │                    anomaly
═════════════╪═════════╪═══════════════════════════════════════════════
 British     │     162 │ renaming 'British' requires updating 162 rows
 French      │      72 │ renaming 'French' requires updating 72 rows
 German      │      49 │ renaming 'German' requires updating 49 rows
(3 rows)
```

A normalised design holds each nationality name once in a separate `nationalities` table and references it by foreign key from `drivers`. The rename becomes a single `UPDATE` on one row — guaranteed consistent by construction, regardless of how many drivers share the nationality.

### Insertion anomaly

The *Faculty and Their Courses* relation records faculty members only through their course assignments. A newly hired faculty member with no course yet assigned cannot be represented:

| Faculty ID | Faculty Name    | Faculty Hire Date | Course Code |
|------------|-----------------|-------------------|-------------|
| 389        | Dr. Giddens     | 10-Feb-1985       | ENG-206     |
| 407        | Dr. Saperstein  | 19-Apr-1999       | CMP-101     |
| 407        | Dr. Saperstein  | 19-Apr-1999       | CMP-201     |
| 424        | Dr. Newsome     | 29-Mar-2007       | *???*       |

Dr. Newsome was hired on 29 March 2007 but has not yet been assigned a course. The schema offers no way to record this fact: Course Code is part of the identifying key, so inserting a row without one either violates the constraint or forces a placeholder NULL into a column that should carry a real value. The faculty member simply cannot exist in the database until they teach something.

The root cause is a *functional dependency mismatch*: Faculty Hire Date depends only on Faculty ID, not on Course Code. Hiring date belongs in a separate `faculty` table; the `faculty_courses` join table should record only the assignment relationship.

### Deletion anomaly

Using the same *Faculty and Their Courses* relation, deleting a course assignment can silently destroy unrelated information. Dr. Giddens teaches only one course. When that course is dropped from the schedule and the row is deleted, Dr. Giddens disappears entirely:

| Faculty ID | Faculty Name    | Faculty Hire Date | Course Code       |
|------------|-----------------|-------------------|-------------------|
| 389        | Dr. Giddens     | 10-Feb-1985       | ENG-206 ← DELETE  |
| 407        | Dr. Saperstein  | 19-Apr-1999       | CMP-101           |
| 407        | Dr. Saperstein  | 19-Apr-1999       | CMP-201           |

After the delete, there is no record that Dr. Giddens ever existed or when she was hired. The decision to remove a course assignment has caused the inadvertent loss of faculty employment data — two completely unrelated facts stored in the same row, so they can only be removed together.

### The fix: normalisation

The fix in both cases is the same decomposition: a `faculty` table (Faculty ID, Faculty Name, Hire Date) and a `faculty_courses` table (Faculty ID, Course Code). Deleting a course assignment removes one row from `faculty_courses`; the faculty member's record in `faculty` is untouched. Dr. Newsome can be inserted into `faculty` the day she is hired, before any course assignment exists.

Normalisation is formalised as a hierarchy of design rules called *normal forms*. Each form eliminates a specific class of redundancy:

| Normal form | Eliminates |
|-------------|-----------|
| 1NF | Multi-valued cells; each cell holds one atomic value |
| 2NF | Partial dependencies on a composite key |
| 3NF | Transitive dependencies between non-key columns |
| BCNF | Any determinant that is not a candidate key |

The practical target for most production schemas is BCNF: every fact is stored exactly once, and every other occurrence is replaced by a reference. That is the rule the three anomalies violate — and the rule normalization restores.
