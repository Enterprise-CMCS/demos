"""
Generate a PostgreSQL database using fake python data.
Dynamically pulls table schemas and pre-defined values from the DEMOS git repo's
Prisma-generated SQL migration files.

This module provides a registry and base classes for defining and generating
interconnected tables of fake data for various tables using Faker and Pandas.
"""

import uuid
import random
import os
import re
from datetime import datetime, timezone, date, timedelta
from pathlib import Path
from faker import Faker
import pandas as pd

# Vendored fixture: this is a lightly adapted snapshot of the fake-demos-tables
# generator. Two changes from upstream: (1) schema + seed data are read from
# this repo's locally PINNED Prisma DDL (state/prisma_ddl/<sha>.sql) instead of
# fetched from GitHub, so generation is offline and tracks the same SHA the
# harness applies; (2) RNG is seeded at import for run-to-run determinism.

_FIXTURE_DIR = Path(__file__).resolve().parent
_REPO_ROOT = _FIXTURE_DIR.parents[3]  # tests/sql/fixtures/fake_demos -> repo root

# Determinism: seed both random and Faker so row counts/ids are stable.
random.seed(20260616)
Faker.seed(20260616)


# =============================================================================
# Pinned Prisma DDL source (offline)
# =============================================================================

def _read_pinned_ddl() -> str:
    """Return this repo's pinned, concatenated Prisma DDL text.

    The schema (CREATE TABLE) and seed data (INSERT INTO demos_app.*) the
    generator needs both live in the single pinned artifact, so both parsers
    are fed the same text. No network access.
    """
    pin = (_REPO_ROOT / "reports" / "prisma_ddl.sha256").read_text(
        encoding="utf-8"
    ).split()[0]
    return (_REPO_ROOT / "state" / "prisma_ddl" / f"{pin}.sql").read_text(
        encoding="utf-8"
    )


def _strip_sql_comments(text):
    """Remove single-line SQL comments (-- ...) from text."""
    return re.sub(r'--[^\n]*', '', text)


def _parse_sql_value_tuple(inner: str) -> list[str]:
    """Parse the contents of a SQL value tuple (between outer parentheses).

    Handles quoted strings with embedded parentheses, unquoted literals
    (TRUE, FALSE, CURRENT_TIMESTAMP, NULL, numbers), and escaped quotes.
    """
    parts = []
    i = 0
    current = []
    in_quote = False

    while i < len(inner):
        ch = inner[i]
        if ch == "'" and not in_quote:
            in_quote = True
            i += 1
        elif ch == "'" and in_quote:
            if i + 1 < len(inner) and inner[i + 1] == "'":
                current.append("'")
                i += 2
            else:
                in_quote = False
                i += 1
        elif ch == "," and not in_quote:
            parts.append("".join(current).strip())
            current = []
            i += 1
        else:
            current.append(ch)
            i += 1

    if current or parts:
        parts.append("".join(current).strip())

    return parts


def _split_value_tuples(values_block):
    """Split a VALUES block into individual tuple content strings.

    Correctly handles parentheses inside quoted strings so that values like
    'CMS (OSORA)' or 'Basic Health Plan (BHP)' are not split incorrectly.
    """
    tuples = []
    depth = 0
    in_quote = False
    current = []
    i = 0

    while i < len(values_block):
        ch = values_block[i]
        if ch == "'" and not in_quote:
            in_quote = True
            current.append(ch)
            i += 1
        elif ch == "'" and in_quote:
            current.append(ch)
            if i + 1 < len(values_block) and values_block[i + 1] == "'":
                current.append("'")
                i += 2
            else:
                in_quote = False
                i += 1
        elif ch == "(" and not in_quote:
            if depth == 0:
                current = []
            else:
                current.append(ch)
            depth += 1
            i += 1
        elif ch == ")" and not in_quote:
            depth -= 1
            if depth == 0:
                tuples.append("".join(current))
                current = []
            else:
                current.append(ch)
            i += 1
        else:
            if depth > 0:
                current.append(ch)
            i += 1

    return tuples


def parse_schema_sql(schema_text: str) -> dict[str, list[dict]]:
    """Parse CREATE TABLE statements from schema SQL.

    Returns a dict mapping table_name -> list of column dicts with keys:
    name, type, nullable, default.
    """
    tables = {}
    sections = schema_text.split("-- CreateTable\n")
    for sec in sections[1:]:
        m = re.match(r'CREATE TABLE "(\w+)"\s*\((.*?)\)\s*;', sec, re.DOTALL)
        if m:
            tname = m.group(1)
            body = m.group(2)
            cols = []
            for line in body.split("\n"):
                line = line.strip().rstrip(",")
                if not line or line.startswith("CONSTRAINT") or line.startswith("--"):
                    continue
                col_m = re.match(r'"(\w+)"\s+(\S+)(.*)', line)
                if col_m:
                    cname = col_m.group(1)
                    ctype = col_m.group(2)
                    rest = col_m.group(3)
                    nullable = "NOT NULL" not in rest
                    has_default = "DEFAULT" in rest
                    default_val = None
                    if has_default:
                        dm = re.search(r"DEFAULT\s+'([^']*)'", rest)
                        if dm:
                            default_val = dm.group(1)
                        else:
                            dm2 = re.search(r"DEFAULT\s+(\S+)", rest)
                            if dm2:
                                default_val = dm2.group(1)
                    cols.append({
                        "name": cname,
                        "type": ctype,
                        "nullable": nullable,
                        "default": default_val,
                    })
            tables[tname] = cols
    return tables


def parse_data_sql(data_text: str) -> dict[str, dict]:
    """Parse INSERT INTO statements from data SQL.

    Returns a dict mapping table_name -> {"columns": list|None, "rows": list of lists}.
    """
    inserts = {}
    pattern = re.compile(
        r"INSERT INTO\s+demos_app\.(\w+)\s*(?:\(([^)]*)\))?\s*VALUES\s*(.*?);",
        re.DOTALL,
    )
    for m in pattern.finditer(data_text):
        tname = m.group(1)
        col_spec = m.group(2)
        values_block = _strip_sql_comments(m.group(3))

        columns = None
        if col_spec:
            columns = [c.strip().strip('"') for c in col_spec.split(",")]

        tuple_contents = _split_value_tuples(values_block)
        rows = []
        for inner in tuple_contents:
            parts = _parse_sql_value_tuple(inner)
            parts = [p.strip() for p in parts if p.strip()]
            if parts:
                rows.append(parts)

        inserts[tname] = {"columns": columns, "rows": rows}

    return inserts


def _load_sql_data():
    """Fetch and parse both SQL migration files from the DEMOS GitHub repo.

    Returns (schema_tables, data_inserts) where:
    - schema_tables: dict of table_name -> column list (from CREATE TABLE)
    - data_inserts: dict of table_name -> {columns, rows} (from INSERT INTO)
    """
    try:
        text = _read_pinned_ddl()
        schema_tables = parse_schema_sql(text)
        data_inserts = parse_data_sql(text)
        return schema_tables, data_inserts
    except Exception as e:
        print(f"Warning: Could not load pinned Prisma DDL: {e}")
        return {}, {}


# Load SQL data at module level
_SQL_SCHEMA, _SQL_DATA = _load_sql_data()


def _sql_values(table_name: str, col_index: int = 0) -> list[str]:
    """Get the list of values from a single-column (or specified column) INSERT INTO data.

    Args:
        table_name: The table name to look up in _SQL_DATA.
        col_index: Column index to extract (default 0 for id-only tables).

    Returns:
        List of string values, or empty list if table not in SQL data.
    """
    if table_name not in _SQL_DATA:
        return []
    rows = _SQL_DATA[table_name]["rows"]
    return [row[col_index] for row in rows if len(row) > col_index]


def _sql_rows(table_name: str) -> list[list[str]]:
    """Get all rows from a multi-column INSERT INTO table.

    Returns:
        List of lists of strings, or empty list if table not in SQL data.
    """
    if table_name not in _SQL_DATA:
        return []
    return _SQL_DATA[table_name]["rows"]


# =============================================================================
# Fallback Constants (used when SQL data is not available or for tables not
# covered by SQL INSERT data)
# =============================================================================

USER_TYPES = ["demos-admin", "demos-cms-user", "demos-state-user"]

# Fallback constants for tables not covered by SQL INSERT data
LOG_LEVELS = [
    "emerg",
    "alert",
    "crit",
    "err",
    "warning",
    "notice",
    "info",
    "debug",
]

EVENT_TYPES = [
    "Login Succeeded",
    "Login Failed",
    "Logout Succeeded",
    "Logout Failed",
    "Create Demonstration Succeeded",
    "Create Demonstration Failed",
    "Create Extension Succeeded",
    "Create Extension Failed",
    "Create Amendment Succeeded",
    "Create Amendment Failed",
    "Edit Demonstration Succeeded",
    "Edit Demonstration Failed",
    "Delete Demonstration Succeeded",
    "Delete Demonstration Failed",
    "Delete Document Succeeded",
    "Delete Document Failed",
]

fake = Faker()


class TypeChecker:
    def __init__(self, constants_path=None, mmd_path=None):
        self.constants_path = constants_path or str(_FIXTURE_DIR / "constants.ts")
        self.mmd_path = mmd_path or str(_FIXTURE_DIR / "demos_data_model.mmd")
        self.constants = self._parse_constants()
        self.schemas = self._parse_mmd()
        self.table_to_constant = self._map_tables_to_constants()

    def _parse_constants(self):
        if not os.path.exists(self.constants_path):
            return {}

        with open(self.constants_path, "r") as f:
            content = f.read()

        constants = {}

        # Match export const CONSTANT_NAME = [ ... ] as const;
        # This regex handles simple arrays and some object arrays
        array_pattern = re.compile(
            r"export const (\w+) = \[\s*(.*?)\s*] as const", re.DOTALL
        )

        for match in array_pattern.finditer(content):
            name = match.group(1)
            raw_values = match.group(2)

            # Extract strings
            values = re.findall(r'"([^"]*)"', raw_values)
            if not values:
                values = re.findall(r"'([^']*)'", raw_values)

            # Handle object arrays like STATES_AND_TERRITORIES: [ { id: "AL", name: "Alabama" }, ... ]
            # If it's an object array, we might want just the 'id' fields if they exist
            if "{" in raw_values and "id:" in raw_values:
                ids = re.findall(r'id:\s*["\']([^"\']+)["\']', raw_values)
                if ids:
                    values = ids

            # Handle spread operators like ...OTHER_CONST
            spreads = re.findall(r"\.\.\.(\w+)", raw_values)

            # Filter out duplicates and empty strings
            constants[name] = {
                "values": list(set([v for v in values if v])),
                "spreads": spreads,
            }

        # Resolve spreads
        resolved_constants = {}

        def resolve(name, visited):
            if name in resolved_constants:
                return resolved_constants[name]
            if name not in constants or name in visited:
                return []

            visited.add(name)
            data = constants[name]
            result = list(data["values"])
            for s in data["spreads"]:
                result.extend(resolve(s, visited))

            resolved_constants[name] = list(set(result))
            return resolved_constants[name]

        for name in constants:
            resolve(name, set())

        return resolved_constants

    def _parse_mmd(self):
        if not os.path.exists(self.mmd_path):
            return {}

        with open(self.mmd_path, "r") as f:
            content = f.read()

        tables = {}
        table_pattern = re.compile(r"(\w+)(?::::\w+)?\s*\{\s*([^}]+)\s*}")

        for match in table_pattern.finditer(content):
            table_name = match.group(1)
            if table_name == "Legend":
                continue

            columns_content = match.group(2)
            columns = []
            for line in columns_content.split("\n"):
                line = line.strip()
                if (
                    not line
                    or line.startswith("%%")
                    or line.startswith("CONSTRAINT")
                    or line.startswith("TRIGGER")
                    or line.startswith("HAS_HISTORY")
                ):
                    continue
                parts = line.split()
                if len(parts) >= 2:
                    col_name = parts[1]
                    # Clean up col_name if it has commas or other chars
                    col_name = col_name.rstrip(",")
                    columns.append(col_name)

            tables[table_name] = columns

        return tables

    def _map_tables_to_constants(self):
        mapping = {}
        for table_name in self.schemas:
            # Try to find a matching constant
            base = table_name.upper()
            options = [base, base + "S", base + "ES"]
            if base.endswith("Y"):
                options.append(base[:-1] + "IES")

            # Special cases or manual mappings
            manual_mapping = {
                "application_tag_suggestion_status": "APPLICATION_TAG_SUGGESTION_STATUSES",
                "budget_neutrality_validation_status": "BUDGET_NEUTRALITY_VALIDATION_STATUSES",
                "clearance_level": "CLEARANCE_LEVELS",
                "date_type": "DATE_TYPES",
                "deliverable_action_type": "DELIVERABLE_ACTION_TYPES",
                "deliverable_due_date_type": "DELIVERABLE_DUE_DATE_TYPES",
                "deliverable_extension_reason_code": "DELIVERABLE_EXTENSION_REASON_CODES",
                "deliverable_extension_status": "DELIVERABLE_EXTENSION_STATUSES",
                "deliverable_status": "DELIVERABLE_STATUSES",
                "deliverable_type": "DELIVERABLE_TYPES",
                "document_type": "DOCUMENT_TYPES",
                "event_type": "EVENT_TYPES",
                "grant_level": "GRANT_LEVELS",
                "note_type": "NOTE_TYPES",
                "person_type": "PERSON_TYPES",
                "phase": "PHASE_NAMES",
                "phase_status": "PHASE_STATUS",
                "role": "ROLES",
                "sdg_division": "SDG_DIVISIONS",
                "signature_level": "SIGNATURE_LEVEL",
                "state": "STATES_AND_TERRITORIES",
                "tag_status": "TAG_STATUSES",
                "uipath_result_status": "UIPATH_RESULT_STATUSES",
                "tag_source": "TAG_SOURCES",
                "tag_type": "TAG_TYPES",
            }

            if table_name in manual_mapping:
                mapping[table_name] = manual_mapping[table_name]
                continue

            for opt in options:
                if opt in self.constants:
                    mapping[table_name] = opt
                    break

        return mapping

    def get_expected_count(self, table_name):
        constant_name = self.table_to_constant.get(table_name)
        if constant_name and constant_name in self.constants:
            return len(self.constants[constant_name])
        return 10

    def verify_table(self, table_name, df):
        errors = []

        # 1. Verify columns
        expected_cols: list[str] | None = self.schemas.get(table_name)
        if expected_cols is not None:
            actual_cols = df.columns.tolist()
            missing = [c for c in expected_cols if c not in actual_cols]
            extra = [c for c in actual_cols if c not in expected_cols]
            if missing:
                errors.append(f"Missing columns: {missing}")
            if extra:
                errors.append(f"Extra columns: {extra}")
        else:
            errors.append(f"Table {table_name} not found in ER diagram.")

        # 2. Verify row count
        expected_count = self.get_expected_count(table_name)
        actual_count = len(df)

        if table_name in self.table_to_constant:
            if actual_count != expected_count:
                errors.append(f"Expected {expected_count} rows, got {actual_count}")
        else:
            if actual_count < 1:
                errors.append("Table is empty")

        # 3. Verify values for constant-seeded tables
        constant_name = self.table_to_constant.get(table_name)
        if constant_name and constant_name in self.constants and "id" in df.columns:
            allowed_values = self.constants[constant_name]
            actual_values = df["id"].unique().tolist()
            invalid_values = [v for v in actual_values if v not in allowed_values]
            if invalid_values:
                errors.append(f"Invalid values in 'id' column: {invalid_values}")

            missing_values = [v for v in allowed_values if v not in actual_values]
            if missing_values:
                errors.append(f"Missing required values from constant: {missing_values}")

        return errors


class BaseTable:
    """Base class for all data generation tables."""

    table_name = ""
    dependencies = []
    is_static = False

    @classmethod
    def get_names(cls):
        """Get the allowed names/values for this table.

        Priority:
        1. SQL INSERT data from the DEMOS GitHub repo (_SQL_DATA)
        2. TypeChecker constants.ts mapping
        3. Class-level 'names' attribute fallback
        """
        # Check SQL INSERT data first
        sql_vals = _sql_values(cls.table_name)
        if sql_vals:
            return sql_vals
        # Fall back to TypeChecker (constants.ts / mmd)
        checker = TableRegistry.get_checker()
        const_name = checker.table_to_constant.get(cls.table_name)
        if const_name and const_name in checker.constants:
            return checker.constants[const_name]
        return getattr(cls, "names", [])

    @classmethod
    def _create_record(cls, **kwargs):
        """
        Create a record with provided fields.
        """
        return kwargs

    @classmethod
    def generate_records(cls, count, deps):
        """
        Generate fake records for the table.
        """
        raise NotImplementedError

    @classmethod
    def to_dataframe(cls, count, deps):
        """
        Generate records and return them as a pandas DataFrame.
        """
        records = cls.generate_records(count, deps)
        return pd.DataFrame(records)


class LookupTable(BaseTable):
    """Base class for tables that consist of a fixed set of named options (id only)."""

    names = []
    is_static = True

    @classmethod
    def generate_records(cls, count, deps):
        """Generate fake lookup records based on names."""
        # Use all names as IDs, ignore count as requested for static constraints
        return [{"id": name} for name in cls.get_names()]


class LimiterTable(BaseTable):
    """Base class for tables that link to a single dependency (id only)."""

    names = []
    is_static = True

    @classmethod
    def generate_records(cls, count, deps):
        """Generate fake limiter records linking to a dependency."""
        names = cls.get_names()
        if names:
            return [{"id": name} for name in names]

        # Fallback for dynamic limiters (though requested to be static)
        dep_name = cls.dependencies[0]
        dep_df = deps[dep_name]
        if dep_df.empty:
            return []
        # Return all available if no names specified, or sample
        available_ids = dep_df["id"].tolist()
        return [{"id": val} for val in available_ids]


class ApplicationTypeLimitedTable(BaseTable):
    """Base class for tables that are linked to applications but restricted by an application type limit table."""

    limit_dependency = ""

    @classmethod
    def generate_records(cls, count, deps):
        """Generate fake records for tables limited by application type."""
        app_df = deps["application"]
        app_type_limit_df = deps[cls.limit_dependency]
        demo_df = deps["demonstration"]
        status_df = deps["application_status"]
        phase_df = deps["phase"]
        sig_df = deps["signature_level"]
        clearance_df = deps["clearance_level"]

        records = []

        # We want to create records for applications that match the type limit
        available_apps = app_df[
            app_df["application_type_id"].isin(app_type_limit_df["id"].tolist())
        ]

        if available_apps.empty:
            return []

        for _ in range(count):
            app_row = available_apps.iloc[random.randint(0, len(available_apps) - 1)]
            id_val = app_row["id"]
            app_type_id = app_row["application_type_id"]
            demo_id = (
                random.choice(demo_df["id"].tolist()) if not demo_df.empty else None
            )

            start_date = fake.date_between(
                start_date=date(2020, 1, 1), end_date=date(2027, 12, 31)
            )

            records.append(
                {
                    "id": id_val,
                    "application_type_id": app_type_id,
                    "demonstration_id": demo_id,
                    "name": fake.unique.sentence(nb_words=3),
                    "description": fake.text(max_nb_chars=500)
                    if random.random() > 0.3
                    else None,
                    "effective_date": start_date.isoformat()
                    if random.random() > 0.3
                    else None,
                    "status_id": random.choice(status_df["id"].tolist()),
                    "current_phase_id": random.choice(phase_df["id"].tolist()),
                    "signature_level_id": random.choice(sig_df["id"].tolist())
                    if (sig_df is not None and not sig_df.empty and random.random() > 0.5)
                    else None,
                    "clearance_level_id": random.choice(clearance_df["id"].tolist()),
                    "created_at": _ts(),
                    "updated_at": _ts(),
                }
            )
        return records


class TableRegistry:
    """Registry for managing and generating data for all defined tables."""

    _tables = {}
    _checker = None

    @classmethod
    def get_checker(cls):
        """Get the singleton TypeChecker instance."""
        if cls._checker is None:
            cls._checker = TypeChecker()
        return cls._checker

    @classmethod
    def register(cls, table_class):
        """
        Register a table class with the registry.

        Args:
            table_class (BaseTable): The class of the table to register.

        Returns:
            BaseTable: The registered table class.
        """
        cls._tables[table_class.table_name] = table_class
        return table_class

    @classmethod
    def _topological_sort(cls):
        """
        Perform a topological sort of the tables based on their dependencies.

        Returns:
            list: A list of table names in dependency order.
        """
        graph = {name: table.dependencies for name, table in cls._tables.items()}
        in_degree = {name: 0 for name in graph}
        adj = {name: [] for name in graph}

        for node, deps in graph.items():
            for dep in deps:
                if dep in adj:
                    adj[dep].append(node)
                    in_degree[node] += 1

        queue = [node for node, degree in in_degree.items() if degree == 0]
        result = []

        while queue:
            node = queue.pop(0)
            result.append(node)
            for neighbor in adj[node]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        # Append any nodes not included (e.g., due to cycles) to maintain complete registry
        if len(result) < len(graph):
            result.extend([node for node in graph if node not in result])

        return result

    @classmethod
    def generate_all(cls):
        """
        Generate fake data for all registered tables in dependency order.
        Produces rows based on constants.ts or 10 rows by default.

        Returns:
            dict: A dictionary of table names mapping to their generated DataFrames.
        """
        checker = cls.get_checker()
        order = cls._topological_sort()
        all_dfs = {}
        for table_name in order:
            table_class = cls._tables[table_name]
            deps = {
                name: df
                for name, df in all_dfs.items()
                if name in table_class.dependencies
            }

            count = checker.get_expected_count(table_name)
            all_dfs[table_name] = table_class.to_dataframe(count, deps)

        # Verification
        print("\n--- Running Type Checks ---")
        all_errors = {}
        for table_name, df in all_dfs.items():
            errors = checker.verify_table(table_name, df)
            if errors:
                all_errors[table_name] = errors

        if all_errors:
            print(f"Found {len(all_errors)} tables with issues:")
            for table_name, errors in all_errors.items():
                print(f"  {table_name}:")
                for err in errors:
                    print(f"    - {err}")
        else:
            print("All tables passed type checks!")

        return all_dfs


def _unique_elements(options, count):
    """
    Pick a specified number of unique elements from a list of options.
    If count is greater than the number of options, it will include all options
    and add random duplicates.

    Args:
        options (list): The list of options to choose from.
        count (int): The number of elements to return.

    Returns:
        list: A list of chosen elements.
    """
    if count <= len(options):
        return random.sample(options, count)
    return options + random.choices(options, k=count - len(options))


def _timestamp() -> datetime:
    """
    Generate a random UTC timestamp within the last 2 years.

    Returns:
        datetime: A random UTC timestamp.
    """
    return fake.date_time_between(start_date="-2y", tzinfo=timezone.utc)


def _ts() -> str:
    """Return a random UTC timestamp string (ISO 8601 format)."""
    return _timestamp().isoformat()


def _generate_grant_level_records(sql_table: str, cls_names_fn, deps: dict) -> list[dict]:
    """Generate records with id and grant_level_id from SQL data or random fallback.

    Args:
        sql_table: SQL table name to look up pre-defined rows.
        cls_names_fn: Callable returning the fallback list of names (e.g. cls.get_names).
        deps: Dependency DataFrames dict.
    """
    rows = _sql_rows(sql_table)
    if rows:
        return [
            {
                "id": row[0],
                "grant_level_id": row[1] if len(row) > 1 else "System",
            }
            for row in rows
        ]
    grant_level_df = deps.get("grant_level")
    grant_level_ids = (
        grant_level_df["id"].tolist()
        if (grant_level_df is not None and not grant_level_df.empty)
        else ["System"]
    )
    return [
        {
            "id": name,
            "grant_level_id": random.choice(grant_level_ids),
        }
        for name in cls_names_fn()
    ]


def _sql_bool(val: str) -> bool:
    """Convert a SQL boolean literal string ('TRUE'/'FALSE') to a Python bool."""
    return val.upper() == "TRUE"


def _generate_join_records(
    sql_table: str,
    key_a: str,
    key_b: str,
    dep_a: str,
    dep_b: str,
    count: int,
    deps: dict,
) -> list[dict]:
    """Generate records for a two-column join table from SQL data or random fallback.

    Args:
        sql_table: Name of the SQL table to look up pre-defined rows.
        key_a: Field name for the first foreign key (e.g. 'phase_id').
        key_b: Field name for the second foreign key (e.g. 'date_type_id').
        dep_a: Dependency name for the first table (e.g. 'phase').
        dep_b: Dependency name for the second table (e.g. 'date_type').
        count: Target number of records for the random fallback.
        deps: Dependency DataFrames dict.
    """
    rows = _sql_rows(sql_table)
    if rows:
        return [{key_a: row[0], key_b: row[1]} for row in rows if len(row) >= 2]
    # Fallback: random unique combinations
    df_a = deps[dep_a]
    df_b = deps[dep_b]
    records: list[dict] = []
    used_combinations: set[tuple] = set()
    max_possible = len(df_a) * len(df_b)
    target_count = min(count, max_possible)
    while len(records) < target_count:
        id_a = random.choice(df_a["id"].tolist())
        id_b = random.choice(df_b["id"].tolist())
        combo = (id_a, id_b)
        if combo not in used_combinations:
            used_combinations.add(combo)
            records.append({key_a: id_a, key_b: id_b})
    return records




# =============================================================================
# Level 1: Static Constraint Tables (No Dependencies)
# =============================================================================


@TableRegistry.register
class ApplicationStatusTable(LookupTable):
    """Table for application status records."""

    table_name = "application_status"


@TableRegistry.register
class ApplicationTagSuggestionStatusTable(LookupTable):
    """Table for application tag suggestion status records."""

    table_name = "application_tag_suggestion_status"


@TableRegistry.register
class ApplicationTypeTable(LookupTable):
    """Table for application type records."""

    table_name = "application_type"


@TableRegistry.register
class BudgetNeutralityValidationStatusTable(LookupTable):
    """Table for budget neutrality validation status records."""

    table_name = "budget_neutrality_validation_status"


@TableRegistry.register
class ClearanceLevelTable(LookupTable):
    """Table for clearance level records."""

    table_name = "clearance_level"


@TableRegistry.register
class DateTypeTable(LookupTable):
    """Table for date type records."""

    table_name = "date_type"


@TableRegistry.register
class DeliverableActionTypeTable(BaseTable):
    """Table for deliverable action type records."""

    table_name = "deliverable_action_type"
    dependencies = []
    is_static = True

    @classmethod
    def generate_records(cls, count, deps):
        """Generate deliverable action type records from SQL INSERT data.

        SQL columns: id, due_date_change_allowed, should_have_note,
                     should_have_user_id, extension_id_optional
        """
        rows = _sql_rows("deliverable_action_type")
        if rows:
            return [
                {
                    "id": row[0],
                    "due_date_change_allowed": _sql_bool(row[1]) if len(row) > 1 else False,
                    "should_have_note": _sql_bool(row[2]) if len(row) > 2 else False,
                    "should_have_user_id": _sql_bool(row[3]) if len(row) > 3 else False,
                    "should_have_active_extension_id": _sql_bool(row[4]) if len(row) > 4 else False,
                }
                for row in rows
            ]
        # Fallback to random values if SQL data not available
        return [
            {
                "id": name,
                "due_date_change_allowed": random.choice([True, False]),
                "should_have_note": random.choice([True, False]),
                "should_have_user_id": random.choice([True, False]),
                "should_have_active_extension_id": random.choice([True, False]),
            }
            for name in cls.get_names()
        ]


@TableRegistry.register
class DeliverableDueDateTypeTable(LookupTable):
    """Table for deliverable due date type records."""

    table_name = "deliverable_due_date_type"


@TableRegistry.register
class DeliverableExtensionReasonCodeTable(LookupTable):
    """Table for deliverable extension reason code records."""

    table_name = "deliverable_extension_reason_code"


@TableRegistry.register
class DeliverableExtensionStatusTable(LookupTable):
    """Table for deliverable extension status records."""

    table_name = "deliverable_extension_status"


@TableRegistry.register
class DeliverableStatusTable(LookupTable):
    """Table for deliverable status records."""

    table_name = "deliverable_status"


@TableRegistry.register
class DeliverableTypeTable(LookupTable):
    """Table for deliverable type records."""

    table_name = "deliverable_type"


@TableRegistry.register
class DocumentTypeTable(LookupTable):
    """Table for document type records."""

    table_name = "document_type"


@TableRegistry.register
class EventTypeTable(LookupTable):
    """Table for event type records."""

    table_name = "event_type"
    names = EVENT_TYPES  # No SQL INSERT data; use fallback constant


@TableRegistry.register
class GrantLevelTable(LookupTable):
    """Table for grant level records."""

    table_name = "grant_level"


@TableRegistry.register
class LogLevelTable(BaseTable):
    """Table for log level records."""

    table_name = "log_level"
    dependencies = []
    is_static = True
    names = LOG_LEVELS  # No SQL INSERT data; use fallback constant

    @classmethod
    def generate_records(cls, count, deps):
        """Generate log level records using fallback constant (no SQL INSERT data)."""
        names = _sql_values("log_level") or cls.names
        return [
            {
                "id": name,
                "severity": name,
                "level": i * 10,
            }
            for i, name in enumerate(names)
        ]


@TableRegistry.register
class NoteTypeTable(LookupTable):
    """Table for note type records."""

    table_name = "note_type"


@TableRegistry.register
class PermissionTable(BaseTable):
    """Table for permission records."""

    table_name = "permission"
    dependencies = ["grant_level"]
    is_static = True

    @classmethod
    def generate_records(cls, count, deps):
        """Generate permission records from SQL INSERT data (id, grant_level_id)."""
        return _generate_grant_level_records("permission", cls.get_names, deps)


@TableRegistry.register
class PersonTypeTable(LookupTable):
    """Table for person type records."""

    table_name = "person_type"


@TableRegistry.register
class PhaseTable(BaseTable):
    """Table for phase records."""

    table_name = "phase"
    dependencies = []
    is_static = True

    @classmethod
    def generate_records(cls, count, deps):
        """Generate phase records from SQL INSERT data (id, phase_number)."""
        rows = _sql_rows("phase")
        if rows:
            return [
                {
                    "id": row[0],
                    "phase_number": int(row[1]) if len(row) > 1 and row[1].isdigit() else i + 1,
                }
                for i, row in enumerate(rows)
            ]
        # Fallback: use get_names() with sequential numbering
        return [
            {
                "id": name,
                "phase_number": i + 1,
            }
            for i, name in enumerate(cls.get_names())
        ]


@TableRegistry.register
class PhaseStatusTable(LookupTable):
    """Table for phase status records."""

    table_name = "phase_status"


@TableRegistry.register
class RoleTable(BaseTable):
    """Table for role records."""

    table_name = "role"
    dependencies = ["grant_level"]
    is_static = True

    @classmethod
    def generate_records(cls, count, deps):
        """Generate role records from SQL INSERT data (id, grant_level_id)."""
        return _generate_grant_level_records("role", cls.get_names, deps)


@TableRegistry.register
class SdgDivisionTable(LookupTable):
    """Table for SDG division records."""

    table_name = "sdg_division"


@TableRegistry.register
class SignatureLevelTable(LookupTable):
    """Table for signature level records."""

    table_name = "signature_level"


@TableRegistry.register
class StateTable(BaseTable):
    """Table for state records."""

    table_name = "state"
    dependencies = []
    is_static = True

    @classmethod
    def generate_records(cls, count, deps):
        """Generate state records from SQL INSERT data (id, name)."""
        rows = _sql_rows("state")
        if rows:
            return [
                {
                    "id": row[0],
                    "name": row[1] if len(row) > 1 else row[0],
                }
                for row in rows
            ]
        # Fallback: use get_names() - names will be state abbreviations
        return [{"id": name, "name": name} for name in cls.get_names()]


@TableRegistry.register
class TagNameTable(BaseTable):
    """Table for tag name records."""

    table_name = "tag_name"
    dependencies = []
    is_static = True

    @classmethod
    def generate_records(cls, count, deps):
        """Generate tag name records from SQL INSERT data (id, created_at, updated_at).

        SQL has CURRENT_TIMESTAMP for timestamps; we substitute actual timestamps.
        """
        rows = _sql_rows("tag_name")
        if rows:
            return [
                {
                    "id": row[0],
                    "created_at": _ts(),
                    "updated_at": _ts(),
                }
                for row in rows
            ]
        # Fallback: use Faker-generated tag names
        tag_names = [
            "Innovation", "Technology", "Healthcare", "Education", "Research",
            "Development", "Testing", "Implementation", "Compliance", "Security",
        ]
        return [
            {
                "id": name,
                "created_at": _ts(),
                "updated_at": _ts(),
            }
            for name in tag_names
        ]


@TableRegistry.register
class TagSourceTable(LookupTable):
    """Table for tag source records."""

    table_name = "tag_source"


@TableRegistry.register
class TagStatusTable(LookupTable):
    """Table for tag status records."""

    table_name = "tag_status"


@TableRegistry.register
class TagTypeTable(LookupTable):
    """Table for tag type records."""

    table_name = "tag_type"


@TableRegistry.register
class UipathResultStatusTable(LookupTable):
    """Table for UIPath result status records."""

    table_name = "uipath_result_status"


# =============================================================================
# Level 2: Type Limiter Tables
# =============================================================================


@TableRegistry.register
class AmendmentApplicationTypeLimitTable(LimiterTable):
    """Table for amendment application type limit records."""

    table_name = "amendment_application_type_limit"
    dependencies = ["application_type"]


@TableRegistry.register
class ApplicationTagSuggestionExtractFieldLimitTable(LimiterTable):
    """Table for application tag suggestion extract field limit records."""

    table_name = "application_tag_suggestion_extract_field_limit"
    dependencies = []


@TableRegistry.register
class ApplicationTagTypeLimitTable(LimiterTable):
    """Table for application tag type limit records."""

    table_name = "application_tag_type_limit"
    dependencies = ["tag_type"]


@TableRegistry.register
class BudgetNeutralityWorkbookDocumentTypeLimitTable(LimiterTable):
    """Table for budget neutrality workbook document type limit records."""

    table_name = "budget_neutrality_workbook_document_type_limit"
    dependencies = ["document_type"]


@TableRegistry.register
class CmsUserPersonTypeLimitTable(LimiterTable):
    """Table for CMS user person type limit records."""

    table_name = "cms_user_person_type_limit"
    dependencies = ["person_type"]


@TableRegistry.register
class DeliverableActiveExtensionStatusLimitTable(LimiterTable):
    """Table for deliverable active extension status limit records."""

    table_name = "deliverable_active_extension_status_limit"
    dependencies = ["deliverable_extension_status"]


@TableRegistry.register
class DeliverableDemonstrationStatusLimitTable(LimiterTable):
    """Table for deliverable demonstration status limit records."""

    table_name = "deliverable_demonstration_status_limit"
    dependencies = ["application_status"]


@TableRegistry.register
class DeliverableSubmissionActionTypeLimitTable(LimiterTable):
    """Table for deliverable submission action type limit records."""

    table_name = "deliverable_submission_action_type_limit"
    dependencies = ["deliverable_action_type"]


@TableRegistry.register
class DemonstrationApplicationTypeLimitTable(LimiterTable):
    """Table for demonstration application type limit records."""

    table_name = "demonstration_application_type_limit"
    dependencies = ["application_type"]


@TableRegistry.register
class DemonstrationGrantLevelLimitTable(LimiterTable):
    """Table for demonstration grant level limit records."""

    table_name = "demonstration_grant_level_limit"
    dependencies = ["grant_level"]


@TableRegistry.register
class DemonstrationTypeTagTypeLimitTable(LimiterTable):
    """Table for demonstration type tag type limit records."""

    table_name = "demonstration_type_tag_type_limit"
    dependencies = ["tag_type"]


@TableRegistry.register
class ExtensionApplicationTypeLimitTable(LimiterTable):
    """Table for extension application type limit records."""

    table_name = "extension_application_type_limit"
    dependencies = ["application_type"]


@TableRegistry.register
class SystemGrantLevelLimitTable(LimiterTable):
    """Table for system grant level limit records."""

    table_name = "system_grant_level_limit"
    dependencies = ["grant_level"]


@TableRegistry.register
class UserPersonTypeLimitTable(LimiterTable):
    """Table for user person type limit records."""

    table_name = "user_person_type_limit"
    dependencies = ["person_type"]


# =============================================================================
# Level 3: Data Tables
# =============================================================================


@TableRegistry.register
class PersonTable(BaseTable):
    """Table for person records."""

    table_name = "person"
    dependencies = ["person_type"]

    @classmethod
    def generate_records(cls, count, deps):
        """Generate fake person records."""
        person_type_df = deps["person_type"]
        records = []
        for _ in range(count):
            records.append({
                "id": uuid.uuid4().hex,
                "person_type_id": random.choice(person_type_df["id"].tolist()),
                "email": fake.unique.email(),
                "first_name": fake.first_name(),
                "last_name": fake.last_name(),
                "created_at": _ts(),
                "updated_at": _ts(),
            })
        return records


@TableRegistry.register
class UsersTable(BaseTable):
    """Table for user records."""

    table_name = "users"
    dependencies = ["person", "person_type", "user_person_type_limit"]

    @classmethod
    def generate_records(cls, count, deps):
        """Generate fake user records."""
        person_df = deps["person"]
        if person_df.empty:
            return []
        records = []
        
        target = min(count, len(person_df))
        if target == 0:
            return []
            
        sampled_persons = person_df.sample(n=target)
        for _, person in sampled_persons.iterrows():
            records.append(
                {
                    "id": person["id"],
                    "person_type_id": person["person_type_id"],
                    "cognito_subject": uuid.uuid4().hex,
                    "username": fake.unique.user_name(),
                    "created_at": _ts(),
                    "updated_at": _ts(),
                }
            )
        return records


@TableRegistry.register
class PhasePhaseStatusTable(BaseTable):
    """Table for phase-phase status associative records."""

    table_name = "phase_phase_status"
    dependencies = ["phase", "phase_status"]

    @classmethod
    def generate_records(cls, count, deps):
        """Generate phase-phase status records from SQL INSERT data (phase_id, phase_status_id)."""
        return _generate_join_records(
            "phase_phase_status", "phase_id", "phase_status_id", "phase", "phase_status", count, deps
        )


@TableRegistry.register
class PhaseDateTypeTable(BaseTable):
    """Table for phase-date type associative records."""

    table_name = "phase_date_type"
    dependencies = ["phase", "date_type"]

    @classmethod
    def generate_records(cls, count, deps):
        """Generate phase-date type records from SQL INSERT data (phase_id, date_type_id)."""
        return _generate_join_records(
            "phase_date_type", "phase_id", "date_type_id", "phase", "date_type", count, deps
        )


@TableRegistry.register
class PhaseDocumentTypeTable(BaseTable):
    """Table for phase-document type associative records."""

    table_name = "phase_document_type"
    dependencies = ["phase", "document_type"]

    @classmethod
    def generate_records(cls, count, deps):
        """Generate phase-document type records from SQL INSERT data (phase_id, document_type_id)."""
        return _generate_join_records(
            "phase_document_type", "phase_id", "document_type_id", "phase", "document_type", count, deps
        )


@TableRegistry.register
class PhaseNoteTypeTable(BaseTable):
    """Table for phase-note type associative records."""

    table_name = "phase_note_type"
    dependencies = ["phase", "note_type"]

    @classmethod
    def generate_records(cls, count, deps):
        """Generate phase-note type records from SQL INSERT data (phase_id, note_type_id)."""
        return _generate_join_records(
            "phase_note_type", "phase_id", "note_type_id", "phase", "note_type", count, deps
        )


@TableRegistry.register
class TagTable(BaseTable):
    """Table for tag records."""

    table_name = "tag"
    dependencies = ["tag_name", "tag_type", "tag_source", "tag_status"]

    @classmethod
    def generate_records(cls, count, deps):
        """Generate tag records from SQL INSERT data.

        SQL columns: tag_name_id, tag_type_id, source_id, status_id,
                     created_at (CURRENT_TIMESTAMP), updated_at (CURRENT_TIMESTAMP)
        """
        rows = _sql_rows("tag")
        if rows:
            return [
                {
                    "tag_name_id": row[0],
                    "tag_type_id": row[1] if len(row) > 1 else "Application",
                    "source_id": row[2] if len(row) > 2 else "System",
                    "status_id": row[3] if len(row) > 3 else "Approved",
                    "created_at": _ts(),
                    "updated_at": _ts(),
                }
                for row in rows
            ]
        # Fallback: random combination of tag_name, tag_type, tag_source, tag_status
        tag_name_df = deps["tag_name"]
        tag_type_df = deps["tag_type"]
        tag_source_df = deps["tag_source"]
        tag_status_df = deps["tag_status"]

        records = []
        used_combinations = set()

        max_possible = len(tag_name_df) * len(tag_type_df)
        target_count = min(count, max_possible)

        while len(records) < target_count:
            tag_name_id = random.choice(tag_name_df["id"].tolist())
            tag_type_id = random.choice(tag_type_df["id"].tolist())
            combo = (tag_name_id, tag_type_id)

            if combo not in used_combinations:
                used_combinations.add(combo)
                records.append(
                    {
                        "tag_name_id": tag_name_id,
                        "tag_type_id": tag_type_id,
                        "source_id": random.choice(tag_source_df["id"].tolist()),
                        "status_id": random.choice(tag_status_df["id"].tolist()),
                        "created_at": _ts(),
                        "updated_at": _ts(),
                    }
                )
        return records


# =============================================================================
# Level 4: Main Data Tables
# =============================================================================


@TableRegistry.register
class DemonstrationTable(BaseTable):
    """Table for demonstration records."""

    table_name = "demonstration"
    dependencies = [
        "application",
        "application_type",
        "demonstration_application_type_limit",
        "sdg_division",
        "signature_level",
        "application_status",
        "phase",
        "state",
        "clearance_level",
    ]

    @classmethod
    def generate_records(cls, count, deps):
        """Generate fake demonstration records."""
        app_df = deps["application"]
        app_type_limit_df = deps["demonstration_application_type_limit"]
        sdg_df = deps["sdg_division"]
        sig_df = deps["signature_level"]
        status_df = deps["application_status"]
        phase_df = deps["phase"]
        state_df = deps["state"]
        clearance_df = deps["clearance_level"]

        records = []

        # We want to create demonstrations for applications that match the type limit
        limit_ids = app_type_limit_df["id"].tolist()
        valid_apps = app_df[app_df["application_type_id"].isin(limit_ids)]

        if valid_apps.empty:
            return []

        for _ in range(count):
            app_row = valid_apps.iloc[random.randint(0, len(valid_apps) - 1)]
            id_val = app_row["id"]
            app_type_id = app_row["application_type_id"]
            state_id = random.choice(state_df["id"].tolist())

            start_date = fake.date_between(
                start_date=date(2020, 1, 1), end_date=date(2027, 12, 31)
            )
            end_date = fake.date_between(
                start_date=start_date, end_date=date(2027, 12, 31)
            )

            records.append(
                {
                    "id": id_val,
                    "application_type_id": app_type_id,
                    "name": fake.unique.sentence(nb_words=3),
                    "description": fake.text(max_nb_chars=500),
                    "effective_date": start_date.isoformat()
                    if random.random() > 0.3
                    else None,
                    "expiration_date": end_date.isoformat()
                    if random.random() > 0.3
                    else None,
                    "sdg_division_id": random.choice(sdg_df["id"].tolist())
                    if random.random() > 0.5
                    else None,
                    "signature_level_id": random.choice(sig_df["id"].tolist())
                    if (sig_df is not None and not sig_df.empty and random.random() > 0.5)
                    else None,
                    "status_id": random.choice(status_df["id"].tolist()),
                    "current_phase_id": random.choice(phase_df["id"].tolist()),
                    "state_id": state_id,
                    "clearance_level_id": random.choice(clearance_df["id"].tolist()),
                    "created_at": _ts(),
                    "updated_at": _ts(),
                }
            )
        return records


@TableRegistry.register
class ApplicationTable(BaseTable):
    """Table for application records."""

    table_name = "application"
    dependencies = ["application_type"]

    @classmethod
    def generate_records(cls, count, deps):
        """Generate fake application records."""
        app_type_df = deps["application_type"]
        return [
            {"id": uuid.uuid4().hex, "application_type_id": random.choice(app_type_df["id"].tolist())}
            for _ in range(count)
        ]


@TableRegistry.register
class AmendmentTable(ApplicationTypeLimitedTable):
    """Table for amendment records."""

    table_name = "amendment"
    limit_dependency = "amendment_application_type_limit"
    dependencies = [
        "application",
        "application_type",
        "amendment_application_type_limit",
        "demonstration",
        "application_status",
        "phase",
        "signature_level",
        "clearance_level",
    ]


@TableRegistry.register
class ExtensionTable(ApplicationTypeLimitedTable):
    """Table for extension records."""

    table_name = "extension"
    limit_dependency = "extension_application_type_limit"
    dependencies = [
        "application",
        "application_type",
        "extension_application_type_limit",
        "demonstration",
        "application_status",
        "phase",
        "signature_level",
        "clearance_level",
    ]


@TableRegistry.register
class ApplicationDateTable(BaseTable):
    """Table for application date records."""

    table_name = "application_date"
    dependencies = ["application", "date_type"]

    @classmethod
    def generate_records(cls, count, deps):
        app_df = deps["application"]
        date_type_df = deps["date_type"]
        records = []
        used = set()
        target = min(count, len(app_df) * len(date_type_df))
        while len(records) < target:
            app_id = random.choice(app_df["id"].tolist())
            dt_id = random.choice(date_type_df["id"].tolist())
            if (app_id, dt_id) not in used:
                used.add((app_id, dt_id))
                records.append({
                    "application_id": app_id,
                    "date_type_id": dt_id,
                    "date_value": _ts(),
                    "created_at": _ts(),
                    "updated_at": _ts(),
                })
        return records


@TableRegistry.register
class ApplicationNoteTable(BaseTable):
    """Table for application note records."""

    table_name = "application_note"
    dependencies = ["application", "note_type"]

    @classmethod
    def generate_records(cls, count, deps):
        app_df = deps["application"]
        note_type_df = deps["note_type"]
        records = []
        used = set()
        target = min(count, len(app_df) * len(note_type_df))
        while len(records) < target:
            app_id = random.choice(app_df["id"].tolist())
            nt_id = random.choice(note_type_df["id"].tolist())
            if (app_id, nt_id) not in used:
                used.add((app_id, nt_id))
                records.append({
                    "application_id": app_id,
                    "note_type_id": nt_id,
                    "content": fake.text(),
                    "created_at": _ts(),
                    "updated_at": _ts(),
                })
        return records


@TableRegistry.register
class ApplicationPhaseTable(BaseTable):
    """Table for application phase records."""

    table_name = "application_phase"
    dependencies = ["application", "phase_phase_status"]

    @classmethod
    def generate_records(cls, count, deps):
        app_df = deps["application"]
        pps_df = deps["phase_phase_status"]
        records = []
        used = set()
        target = min(count, len(app_df) * len(pps_df))
        while len(records) < target:
            app_id = random.choice(app_df["id"].tolist())
            pps_row = pps_df.iloc[random.randint(0, len(pps_df)-1)]
            phase_id = pps_row["phase_id"]
            status_id = pps_row["phase_status_id"]
            if (app_id, phase_id) not in used:
                used.add((app_id, phase_id))
                records.append({
                    "application_id": app_id,
                    "phase_id": phase_id,
                    "phase_status_id": status_id,
                    "created_at": _ts(),
                    "updated_at": _ts(),
                })
        return records


@TableRegistry.register
class ApplicationTagSuggestionTable(BaseTable):
    """Table for application tag suggestion records."""

    table_name = "application_tag_suggestion"
    dependencies = ["application", "application_tag_suggestion_status"]

    @classmethod
    def generate_records(cls, count, deps):
        app_df = deps["application"]
        status_df = deps["application_tag_suggestion_status"]
        if app_df.empty or status_df.empty:
            return []
        replaced_id = "Replaced"
        records = []
        used = set()
        target = min(count, len(app_df) * 3)
        while len(records) < target:
            app_id = random.choice(app_df["id"].tolist())
            value = uuid.uuid4().hex
            if (app_id, value) not in used:
                used.add((app_id, value))
                status_id = random.choice(status_df["id"].tolist())
                records.append({
                    "application_id": app_id,
                    "value": value,
                    "status_id": status_id,
                    "replaced_value": uuid.uuid4().hex if status_id == replaced_id else None,
                    "created_at": _ts(),
                    "updated_at": _ts(),
                })
        return records


@TableRegistry.register
class ApplicationTagSuggestionExtractTable(BaseTable):
    """Table for application tag suggestion extract records."""

    table_name = "application_tag_suggestion_extract"
    dependencies = ["application_tag_suggestion", "application_tag_suggestion_extract_field_limit"]

    @classmethod
    def generate_records(cls, count, deps):
        sug_df = deps["application_tag_suggestion"]
        field_df = deps["application_tag_suggestion_extract_field_limit"]
        if sug_df.empty or field_df.empty:
            return []
        records = []
        for _ in range(count):
            sug = sug_df.iloc[random.randint(0, len(sug_df)-1)]
            records.append({
                "uipath_value_id": uuid.uuid4().hex,
                "application_id": sug["application_id"],
                "field_id": random.choice(field_df["id"].tolist()),
                "value": sug["value"],
                "start_page_no": random.randint(1, 10),
                "end_page_no": random.randint(11, 20),
                "created_at": _ts(),
                "updated_at": _ts(),
            })
        return records


@TableRegistry.register
class BudgetNeutralityWorkbookTable(BaseTable):
    """Table for budget neutrality workbook records."""

    table_name = "budget_neutrality_workbook"
    dependencies = ["budget_neutrality_validation_status", "budget_neutrality_workbook_document_type_limit"]

    @classmethod
    def generate_records(cls, count, deps):
        status_df = deps["budget_neutrality_validation_status"]
        limit_df = deps["budget_neutrality_workbook_document_type_limit"]
        records = []
        for _ in range(count):
            records.append({
                "id": uuid.uuid4().hex,
                "document_type_id": random.choice(limit_df["id"].tolist()),
                "validation_status_id": random.choice(status_df["id"].tolist()),
                "validation_data": "{}",
                "created_at": _ts(),
                "updated_at": _ts(),
            })
        return records


@TableRegistry.register
class DeliverableTable(BaseTable):
    """Table for deliverable records."""

    table_name = "deliverable"
    dependencies = ["deliverable_type", "demonstration", "deliverable_status", "deliverable_due_date_type", "deliverable_demonstration_status_limit", "users", "cms_user_person_type_limit"]

    @classmethod
    def generate_records(cls, count, deps):
        type_df = deps["deliverable_type"]
        demo_df = deps["demonstration"]
        status_df = deps["deliverable_status"]
        due_type_df = deps["deliverable_due_date_type"]
        users_df = deps["users"]
        
        records = []
        for _ in range(count):
            demo = demo_df.iloc[random.randint(0, len(demo_df)-1)]
            user = users_df.iloc[random.randint(0, len(users_df)-1)]
            records.append({
                "id": uuid.uuid4().hex,
                "deliverable_type_id": random.choice(type_df["id"].tolist()),
                "name": fake.sentence(nb_words=3),
                "demonstration_id": demo["id"],
                "demonstration_status_id": demo["status_id"],
                "status_id": random.choice(status_df["id"].tolist()),
                "cms_owner_user_id": user["id"],
                "cms_owner_person_type_id": user["person_type_id"],
                "due_date": _ts(),
                "due_date_type_id": random.choice(due_type_df["id"].tolist()),
                "expected_to_be_submitted": random.choice([True, False]),
                "created_at": _ts(),
                "updated_at": _ts(),
            })
        return records


@TableRegistry.register
class DeliverableActionTable(BaseTable):
    """Table for deliverable action records."""

    table_name = "deliverable_action"
    dependencies = ["deliverable", "deliverable_action_configuration", "deliverable_action_type", "users"]

    @classmethod
    def generate_records(cls, count, deps):
        deliv_df = deps["deliverable"]
        config_df = deps["deliverable_action_configuration"]
        users_df = deps["users"]
        records = []
        for _ in range(count):
            deliv = random.choice(deliv_df["id"].tolist())
            config = config_df.iloc[random.randint(0, len(config_df)-1)]
            user = random.choice(users_df["id"].tolist())
            records.append({
                "id": uuid.uuid4().hex,
                "action_timestamp": _ts(),
                "deliverable_id": deliv,
                "action_type_id": config["action_type_id"],
                "old_status_id": config["old_status_id"],
                "new_status_id": config["new_status_id"],
                "note": fake.sentence(),
                "active_extension_id": None,
                "due_date_change_allowed": random.choice([True, False]),
                "should_have_note": random.choice([True, False]),
                "should_have_user_id": random.choice([True, False]),
                "should_have_active_extension_id": random.choice([True, False]),
                "old_due_date": _ts(),
                "new_due_date": _ts(),
                "user_id": user,
            })
        return records


@TableRegistry.register
class DeliverableActiveExtensionTable(BaseTable):
    """Table for deliverable active extension records."""

    table_name = "deliverable_active_extension"
    dependencies = ["deliverable_extension", "deliverable_active_extension_status_limit"]

    @classmethod
    def generate_records(cls, count, deps):
        ext_df = deps["deliverable_extension"]
        limit_df = deps["deliverable_active_extension_status_limit"]
        records = []
        for i in range(min(count, len(ext_df))):
            ext = ext_df.iloc[i]
            records.append({
                "deliverable_extension_id": ext["id"],
                "deliverable_id": ext["deliverable_id"],
                "status_id": random.choice(limit_df["id"].tolist()),
            })
        return records


@TableRegistry.register
class DeliverableExtensionTable(BaseTable):
    """Table for deliverable extension records."""

    table_name = "deliverable_extension"
    dependencies = ["deliverable", "deliverable_extension_status", "deliverable_extension_reason_code"]

    @classmethod
    def generate_records(cls, count, deps):
        deliv_df = deps["deliverable"]
        status_df = deps["deliverable_extension_status"]
        reason_df = deps["deliverable_extension_reason_code"]
        records = []
        for _ in range(count):
            records.append({
                "id": uuid.uuid4().hex,
                "deliverable_id": random.choice(deliv_df["id"].tolist()),
                "status_id": random.choice(status_df["id"].tolist()),
                "reason_code_id": random.choice(reason_df["id"].tolist()),
                "original_date_requested": _ts(),
                "final_date_granted": _ts(),
                "created_at": _ts(),
                "updated_at": _ts(),
            })
        return records


@TableRegistry.register
class DocumentTable(BaseTable):
    """Table for document records."""

    table_name = "document"
    dependencies = ["users", "phase_document_type", "deliverable_type_document_type", "application", "deliverable", "deliverable_action", "deliverable_submission_action_type_limit"]

    @classmethod
    def generate_records(cls, count, deps):
        users_df = deps["users"]
        pdt_df = deps["phase_document_type"]
        app_df = deps["application"]
        records = []
        for _ in range(count):
            pdt = pdt_df.iloc[random.randint(0, len(pdt_df)-1)]
            records.append({
                "id": uuid.uuid4().hex,
                "name": fake.file_name(),
                "description": fake.sentence(),
                "s3_path": f"s3://bucket/{uuid.uuid4().hex}",
                "owner_user_id": random.choice(users_df["id"].tolist()),
                "document_type_id": pdt["document_type_id"],
                "application_id": random.choice(app_df["id"].tolist()),
                "phase_id": pdt["phase_id"],
                "deliverable_id": None,
                "deliverable_type_id": None,
                "deliverable_is_cms_attached_file": None,
                "deliverable_submission_action_id": None,
                "deliverable_submission_action_type_id": None,
                "created_at": _ts(),
                "updated_at": _ts(),
            })
        return records


@TableRegistry.register
class DocumentInfectedTable(BaseTable):
    """Table for document infected records."""

    table_name = "document_infected"
    dependencies = ["users", "phase_document_type", "deliverable_type_document_type", "application", "deliverable"]

    @classmethod
    def generate_records(cls, count, deps):
        users_df = deps["users"]
        pdt_df = deps["phase_document_type"]
        app_df = deps["application"]
        records = []
        for _ in range(count):
            pdt = pdt_df.iloc[random.randint(0, len(pdt_df)-1)]
            records.append({
                "id": uuid.uuid4().hex,
                "name": fake.file_name(),
                "description": fake.sentence(),
                "s3_path": f"s3://infected/{uuid.uuid4().hex}",
                "owner_user_id": random.choice(users_df["id"].tolist()),
                "document_type_id": pdt["document_type_id"],
                "application_id": random.choice(app_df["id"].tolist()),
                "phase_id": pdt["phase_id"],
                "deliverable_id": None,
                "deliverable_type_id": None,
                "deliverable_is_cms_attached_file": None,
                "infection_status": "Infected",
                "infection_threats": "Eicar-Test-Signature",
                "created_at": _ts(),
                "updated_at": _ts(),
            })
        return records


@TableRegistry.register
class DocumentPendingUploadTable(BaseTable):
    """Table for document pending upload records."""

    table_name = "document_pending_upload"
    dependencies = ["users", "phase_document_type", "deliverable_type_document_type", "application", "deliverable"]

    @classmethod
    def generate_records(cls, count, deps):
        users_df = deps["users"]
        pdt_df = deps["phase_document_type"]
        app_df = deps["application"]
        records = []
        for _ in range(count):
            pdt = pdt_df.iloc[random.randint(0, len(pdt_df)-1)]
            records.append({
                "id": uuid.uuid4().hex,
                "name": fake.file_name(),
                "description": fake.sentence(),
                "owner_user_id": random.choice(users_df["id"].tolist()),
                "document_type_id": pdt["document_type_id"],
                "application_id": random.choice(app_df["id"].tolist()),
                "phase_id": pdt["phase_id"],
                "deliverable_id": None,
                "deliverable_type_id": None,
                "deliverable_is_cms_attached_file": None,
                "created_at": _ts(),
                "updated_at": _ts(),
            })
        return records


@TableRegistry.register
class EventTable(BaseTable):
    """Table for event records."""

    table_name = "event"
    dependencies = ["users", "role", "application", "event_type", "log_level"]

    @classmethod
    def generate_records(cls, count, deps):
        users_df = deps["users"]
        role_df = deps["role"]
        app_df = deps["application"]
        type_df = deps["event_type"]
        log_df = deps["log_level"]
        records = []
        for _ in range(count):
            records.append({
                "id": uuid.uuid4().hex,
                "user_id": random.choice(users_df["id"].tolist()),
                "role_id": random.choice(role_df["id"].tolist()),
                "application_id": random.choice(app_df["id"].tolist()),
                "event_type_id": random.choice(type_df["id"].tolist()),
                "log_level_id": random.choice(log_df["id"].tolist()),
                "route": "/api/v1/resource",
                "created_at": _ts(),
                "event_data": "{}",
            })
        return records


@TableRegistry.register
class PrivateCommentTable(BaseTable):
    """Table for private comment records."""

    table_name = "private_comment"
    dependencies = ["deliverable", "users", "cms_user_person_type_limit"]

    @classmethod
    def generate_records(cls, count, deps):
        deliv_df = deps["deliverable"]
        users_df = deps["users"]
        records = []
        for _ in range(count):
            user = users_df.iloc[random.randint(0, len(users_df)-1)]
            records.append({
                "id": uuid.uuid4().hex,
                "deliverable_id": random.choice(deliv_df["id"].tolist()),
                "author_user_id": user["id"],
                "author_person_type_id": user["person_type_id"],
                "content": fake.text(),
                "created_at": _ts(),
                "updated_at": _ts(),
            })
        return records


@TableRegistry.register
class PublicCommentTable(BaseTable):
    """Table for public comment records."""

    table_name = "public_comment"
    dependencies = ["deliverable", "users"]

    @classmethod
    def generate_records(cls, count, deps):
        deliv_df = deps["deliverable"]
        users_df = deps["users"]
        records = []
        for _ in range(count):
            records.append({
                "id": uuid.uuid4().hex,
                "deliverable_id": random.choice(deliv_df["id"].tolist()),
                "author_user_id": random.choice(users_df["id"].tolist()),
                "content": fake.text(),
                "created_at": _ts(),
                "updated_at": _ts(),
            })
        return records


@TableRegistry.register
class UipathResultTable(BaseTable):
    """Table for UiPath result records."""

    table_name = "uipath_result"
    dependencies = ["document", "application", "uipath_result_status"]

    @classmethod
    def generate_records(cls, count, deps):
        doc_df = deps["document"]
        status_df = deps["uipath_result_status"]
        records = []
        for i in range(min(count, len(doc_df))):
            doc = doc_df.iloc[i]
            records.append({
                "id": uuid.uuid4().hex,
                "request_id": uuid.uuid4().hex,
                "response": "{}",
                "project_id": "PROJECT-123",
                "document_id": doc["id"],
                "application_id": doc["application_id"],
                "status_id": random.choice(status_df["id"].tolist()),
                "created_at": _ts(),
                "updated_at": _ts(),
            })
        return records


@TableRegistry.register
class UipathValueTable(BaseTable):
    """Table for UiPath value records."""

    table_name = "uipath_value"
    dependencies = ["uipath_result"]

    @classmethod
    def generate_records(cls, count, deps):
        res_df = deps["uipath_result"]
        records = []
        for _ in range(count):
            res = res_df.iloc[random.randint(0, len(res_df)-1)]
            records.append({
                "id": uuid.uuid4().hex,
                "uipath_result_id": res["id"],
                "document_id": res["document_id"],
                "application_id": res["application_id"],
                "field_id": fake.word(),
                "value": fake.word(),
                "text_length": random.randint(1, 100),
                "text_start_index": random.randint(0, 500),
                "confidence": random.random(),
                "token_list": "[]",
                "created_at": _ts(),
                "updated_at": _ts(),
            })
        return records


# =============================================================================
# Level 5: Associative Tables
# =============================================================================


@TableRegistry.register
class ApplicationTagAssignmentTable(BaseTable):
    """Table for application-tag associative records."""

    table_name = "application_tag_assignment"
    dependencies = ["application", "tag", "application_tag_type_limit"]

    @classmethod
    def generate_records(cls, count, deps):
        app_df = deps["application"]
        tag_df = deps["tag"]
        records = []
        used = set()
        target = min(count, len(app_df) * len(tag_df))
        while len(records) < target:
            app_id = random.choice(app_df["id"].tolist())
            tag = tag_df.iloc[random.randint(0, len(tag_df)-1)]
            combo = (app_id, tag["tag_name_id"], tag["tag_type_id"])
            if combo not in used:
                used.add(combo)
                records.append({
                    "application_id": app_id,
                    "tag_name_id": tag["tag_name_id"],
                    "tag_type_id": tag["tag_type_id"],
                })
        return records


@TableRegistry.register
class DeliverableActionConfigurationTable(BaseTable):
    """Table for deliverable action configuration associative records."""

    table_name = "deliverable_action_configuration"
    dependencies = ["deliverable_action_type", "deliverable_status"]

    @classmethod
    def generate_records(cls, count, deps):
        """Generate deliverable action configuration records from SQL INSERT data.

        SQL columns: action_type_id, old_status_id, new_status_id
        """
        rows = _sql_rows("deliverable_action_configuration")
        if rows:
            return [
                {
                    "action_type_id": row[0],
                    "old_status_id": row[1] if len(row) > 1 else "Upcoming",
                    "new_status_id": row[2] if len(row) > 2 else "Upcoming",
                }
                for row in rows
                if len(row) >= 1
            ]
        # Fallback: random combinations
        type_df = deps["deliverable_action_type"]
        status_df = deps["deliverable_status"]
        records = []
        used = set()
        target = min(count, len(type_df) * len(status_df) * len(status_df))
        while len(records) < target:
            t_id = random.choice(type_df["id"].tolist())
            os_id = random.choice(status_df["id"].tolist())
            ns_id = random.choice(status_df["id"].tolist())
            combo = (t_id, os_id, ns_id)
            if combo not in used:
                used.add(combo)
                records.append({
                    "action_type_id": t_id,
                    "old_status_id": os_id,
                    "new_status_id": ns_id,
                })
        return records


@TableRegistry.register
class DeliverableDemonstrationTypeTable(BaseTable):
    """Table for deliverable-demonstration type associative records."""

    table_name = "deliverable_demonstration_type"
    dependencies = ["deliverable", "demonstration_type_tag_assignment"]

    @classmethod
    def generate_records(cls, count, deps):
        deliv_df = deps["deliverable"]
        assign_df = deps["demonstration_type_tag_assignment"]
        records = []
        
        # Pre-calculate valid combinations to avoid infinite loop
        possible_combos = []
        for _, deliv in deliv_df.iterrows():
            matching_assigns = assign_df[assign_df["demonstration_id"] == deliv["demonstration_id"]]
            for _, assign in matching_assigns.iterrows():
                possible_combos.append({
                    "deliverable_id": deliv["id"],
                    "demonstration_id": deliv["demonstration_id"],
                    "demonstration_type_tag_name_id": assign["tag_name_id"],
                })
        
        if not possible_combos:
            return []
            
        target = count
        indices = random.choices(range(len(possible_combos)), k=target)
        
        for idx in indices:
            records.append(possible_combos[idx])
            
        return records


@TableRegistry.register
class DeliverableTypeDocumentTypeTable(BaseTable):
    """Table for deliverable type-document type associative records."""

    table_name = "deliverable_type_document_type"
    dependencies = ["deliverable_type", "document_type"]

    @classmethod
    def generate_records(cls, count, deps):
        """Generate deliverable type-document type records from SQL INSERT data (deliverable_type_id, document_type_id)."""
        return _generate_join_records(
            "deliverable_type_document_type", "deliverable_type_id", "document_type_id",
            "deliverable_type", "document_type", count, deps
        )


@TableRegistry.register
class DemonstrationRoleAssignmentTable(BaseTable):
    """Table for demonstration role assignment associative records."""

    table_name = "demonstration_role_assignment"
    dependencies = ["person_state", "person", "demonstration", "role_person_type", "role", "demonstration_grant_level_limit"]

    @classmethod
    def generate_records(cls, count, deps):
        ps_df = deps["person_state"]
        person_df = deps["person"]
        demo_df = deps["demonstration"]
        rpt_df = deps["role_person_type"]
        limit_df = deps["demonstration_grant_level_limit"]
        if ps_df.empty or demo_df.empty or person_df.empty or rpt_df.empty or limit_df.empty:
            return []
        records = []
        target = count
        while len(records) < target:
            ps = ps_df.iloc[random.randint(0, len(ps_df)-1)]
            demo = demo_df.iloc[random.randint(0, len(demo_df)-1)]
            # Match person type from person
            person_match = person_df[person_df["id"] == ps["person_id"]]
            if person_match.empty:
                continue
            person = person_match.iloc[0]
            pt_id = person["person_type_id"]
            # Find a role for this person type
            matching_roles = rpt_df[rpt_df["person_type_id"] == pt_id]
            if matching_roles.empty:
                continue
            role_id = random.choice(matching_roles["role_id"].tolist())
            records.append({
                "person_id": ps["person_id"],
                "demonstration_id": demo["id"],
                "role_id": role_id,
                "state_id": ps["state_id"],
                "person_type_id": pt_id,
                "grant_level_id": random.choice(limit_df["id"].tolist()),
            })
        return records


@TableRegistry.register
class PersonStateTable(BaseTable):
    """Table for person-state associative records."""

    table_name = "person_state"
    dependencies = ["person", "state"]

    @classmethod
    def generate_records(cls, count, deps):
        """Generate unique person-state combination records."""
        return _generate_join_records(
            "person_state", "person_id", "state_id", "person", "state", count, deps
        )


@TableRegistry.register
class PrimaryDemonstrationRoleAssignmentTable(BaseTable):
    """Table for primary demonstration role assignment associative records."""

    table_name = "primary_demonstration_role_assignment"
    dependencies = ["demonstration_role_assignment"]

    @classmethod
    def generate_records(cls, count, deps):
        dra_df = deps["demonstration_role_assignment"]
        records = []
        target = count
        while len(records) < target:
            dra = dra_df.iloc[random.randint(0, len(dra_df)-1)]
            records.append({
                "person_id": dra["person_id"],
                "demonstration_id": dra["demonstration_id"],
                "role_id": dra["role_id"],
            })
        return records


@TableRegistry.register
class RolePermissionTable(BaseTable):
    """Table for role-permission associative records."""

    table_name = "role_permission"
    dependencies = ["role", "permission"]
    is_static = True

    @classmethod
    def generate_records(cls, count, deps):
        """Generate role-permission records from SQL INSERT data.

        SQL columns: role_id, grant_level_id, permission_id
        """
        rows = _sql_rows("role_permission")
        if rows:
            return [
                {
                    "role_id": row[0],
                    "grant_level_id": row[1] if len(row) > 1 else "System",
                    "permission_id": row[2] if len(row) > 2 else "",
                }
                for row in rows
                if len(row) >= 3
            ]
        # Fallback: random role-permission combinations
        role_df = deps["role"]
        perm_df = deps["permission"]
        records = []
        target = count
        while len(records) < target:
            role = role_df.iloc[random.randint(0, len(role_df)-1)]
            matching_perms = perm_df[perm_df["grant_level_id"] == role["grant_level_id"]]
            if matching_perms.empty:
                continue
            perm = matching_perms.iloc[random.randint(0, len(matching_perms)-1)]
            records.append({
                "role_id": role["id"],
                "grant_level_id": role["grant_level_id"],
                "permission_id": perm["id"],
            })
        return records


@TableRegistry.register
class RolePersonTypeTable(BaseTable):
    """Table for role-person type associative records."""

    table_name = "role_person_type"
    dependencies = ["role", "person_type"]
    is_static = True

    @classmethod
    def generate_records(cls, count, deps):
        """Generate role-person type records from SQL INSERT data (role_id, person_type_id)."""
        return _generate_join_records(
            "role_person_type", "role_id", "person_type_id", "role", "person_type", count, deps
        )


@TableRegistry.register
class SystemRoleAssignmentTable(BaseTable):
    """Table for system role assignment associative records."""

    table_name = "system_role_assignment"
    dependencies = ["person", "role_person_type", "role", "system_grant_level_limit"]

    @classmethod
    def generate_records(cls, count, deps):
        person_df = deps["person"]
        rpt_df = deps["role_person_type"]
        limit_df = deps["system_grant_level_limit"]
        if person_df.empty or rpt_df.empty or limit_df.empty:
            return []
        records = []
        target = count
        while len(records) < target:
            person = person_df.iloc[random.randint(0, len(person_df)-1)]
            pt_id = person["person_type_id"]
            matching_roles = rpt_df[rpt_df["person_type_id"] == pt_id]
            if matching_roles.empty:
                continue
            role_id = random.choice(matching_roles["role_id"].tolist())
            records.append({
                "person_id": person["id"],
                "role_id": role_id,
                "person_type_id": pt_id,
                "grant_level_id": random.choice(limit_df["id"].tolist()),
            })
        return records


@TableRegistry.register
class DemonstrationTypeTagAssignmentTable(BaseTable):
    """Table for demonstration type tag assignment records."""

    table_name = "demonstration_type_tag_assignment"
    dependencies = ["demonstration", "tag", "demonstration_type_tag_type_limit"]

    @classmethod
    def generate_records(cls, count, deps):
        demo_df = deps["demonstration"]
        tag_df = deps["tag"]
        if demo_df.empty or tag_df.empty:
            return []
        records = []
        target = count
        while len(records) < target:
            demo_id = random.choice(demo_df["id"].tolist())
            tag = tag_df.iloc[random.randint(0, len(tag_df)-1)]
            records.append({
                "demonstration_id": demo_id,
                "tag_name_id": tag["tag_name_id"],
                "tag_type_id": tag["tag_type_id"],
                "effective_date": _ts(),
                "expiration_date": (_timestamp() + timedelta(days=365)).isoformat(),
                "created_at": _ts(),
                "updated_at": _ts(),
            })
        return records


# =============================================================================
# Main Execution
# =============================================================================

if __name__ == "__main__":
    every_df = TableRegistry.generate_all()
    for tbl, dataf in every_df.items():
        print(f"{tbl}: {len(dataf)} records")
