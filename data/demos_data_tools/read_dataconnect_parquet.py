"""Read a nightly DataConnect Parquet file as plain Python records.

The file is stored at ``demonstration_reporting/dt=YYYY-MM-DD/part-000.parquet``.
Install either DuckDB or PyArrow to use the corresponding reader; both return the
same records, with the JSON collection columns parsed into Python lists.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any
from uuid import UUID

JSON_COLUMNS = ("applications", "deliverables", "demonstration_types")
UUID_COLUMNS = ("demonstration_id",)


def _normalize_row(row: dict[str, Any]) -> dict[str, Any]:
    """Normalize UUID and JSON values in one Parquet row.

    Args:
        row (dict[str, Any]): A row returned by DuckDB or PyArrow.

    Returns:
        dict[str, Any]: A copy of the row with UUID values as strings and JSON text parsed.
    """
    normalized = dict(row)

    for column in UUID_COLUMNS:
        value = normalized.get(column)
        if isinstance(value, UUID):
            normalized[column] = str(value)
        elif isinstance(value, bytes):
            normalized[column] = str(UUID(bytes=value))
        elif isinstance(value, str):
            normalized[column] = str(UUID(value))

    for column in JSON_COLUMNS:
        value = normalized.get(column)
        if isinstance(value, (str, bytes)):
            normalized[column] = json.loads(value)

    return normalized


def read_with_duckdb(path: str | Path) -> list[dict[str, Any]]:
    """Read and normalize records with DuckDB.

    Args:
        path (str | Path): Path to a DataConnect Parquet file.

    Returns:
        list[dict[str, Any]]: One normalized dictionary per demonstration row.

    Raises:
        ValueError: If a row's value count differs from the result's column count.
    """
    import duckdb

    connection = duckdb.connect()
    try:
        cursor = connection.execute("SELECT * FROM read_parquet(?)", [str(path)])
        columns = [description[0] for description in cursor.description]
        rows = []
        for values in cursor.fetchall():
            if len(columns) != len(values):
                raise ValueError("The row value count does not match the Parquet column count.")
            rows.append(_normalize_row({columns[index]: value for index, value in enumerate(values)}))
        return rows
    finally:
        connection.close()


def read_with_pyarrow(path: str | Path) -> list[dict[str, Any]]:
    """Read and normalize records with PyArrow.

    Args:
        path (str | Path): Path to a DataConnect Parquet file.

    Returns:
        list[dict[str, Any]]: One normalized dictionary per demonstration row.
    """
    import pyarrow.parquet

    rows = pyarrow.parquet.read_table(path).to_pylist()
    return [_normalize_row(row) for row in rows]


def main(argv: list[str] | None = None) -> int:
    """Read a Parquet file and print its row count and first record.

    Args:
        argv (list[str] | None): Optional command-line arguments, excluding the program name.

    Returns:
        int: Zero after successfully reading and displaying the file.
    """
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("path", type=Path, help="Path to the downloaded Parquet file")
    parser.add_argument("--engine", choices=("duckdb", "pyarrow"), default="duckdb")
    args = parser.parse_args(argv)

    reader = read_with_duckdb if args.engine == "duckdb" else read_with_pyarrow
    rows = reader(args.path)
    print(f"Row count: {len(rows)}")
    if rows:
        print(json.dumps(rows[0], indent=2, ensure_ascii=False))
    else:
        print("No records found.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
