"""Tests for the standalone DataConnect Parquet reader."""

from __future__ import annotations

import json
from pathlib import Path
from uuid import UUID

import duckdb
import pytest

from read_dataconnect_parquet import (
    _normalize_row,
    main,
    read_with_duckdb,
    read_with_pyarrow,
)

DEMONSTRATION_ID = "3f2504e0-4f89-11d3-9a0c-0305e82c3301"
APPLICATIONS = [{"state": "Test State", "application_type": "Renewal"}]
DELIVERABLES: list[dict[str, str]] = []
DEMONSTRATION_TYPES = [{"demonstration_type": "Medicaid"}]

EXPECTED_RECORD = {
    "demonstration_id": DEMONSTRATION_ID,
    "state_territory": "Test State",
    "demonstration_title": "Test Demonstration",
    "demonstration_number": "DEMO-001",
    "chip_id": "-",
    "status": "Approved",
    "status_update_date": "01/02/2026",
    "sdg_division": "-",
    "signature_level": "CMS Administrator",
    "effective_date": "-",
    "expiration_date": "12/31/2030",
    "renewal_in_progress": "No",
    "amendment_in_progress": "No",
    "approved_amendment_applications": 0,
    "primary_project_officer": "Test Officer",
    "project_officers": "Test Officer",
    "primary_policy_tech_director": "-",
    "primary_monitoring_and_evaluation_analyst": "-",
    "monitoring_and_evaluation_analysts": "-",
    "primary_state_poc": "-",
    "primary_monitoring_evaluation_tech_director": "-",
    "application_approval_date": "01/02/2026",
    "applications": APPLICATIONS,
    "deliverables": DELIVERABLES,
    "demonstration_types": DEMONSTRATION_TYPES,
}


def _sql_string(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def _write_parquet(path: Path, *, include_row: bool = True) -> None:
    application_json = json.dumps(APPLICATIONS)
    deliverables_json = json.dumps(DELIVERABLES)
    demonstration_types_json = json.dumps(DEMONSTRATION_TYPES)
    where_clause = "" if include_row else "WHERE FALSE"
    query = f"""
        COPY (
            SELECT
                CAST({_sql_string(DEMONSTRATION_ID)} AS UUID) AS demonstration_id,
                'Test State'::VARCHAR AS state_territory,
                'Test Demonstration'::VARCHAR AS demonstration_title,
                'DEMO-001'::VARCHAR AS demonstration_number,
                '-'::VARCHAR AS chip_id,
                'Approved'::VARCHAR AS status,
                '01/02/2026'::VARCHAR AS status_update_date,
                '-'::VARCHAR AS sdg_division,
                'CMS Administrator'::VARCHAR AS signature_level,
                '-'::VARCHAR AS effective_date,
                '12/31/2030'::VARCHAR AS expiration_date,
                'No'::VARCHAR AS renewal_in_progress,
                'No'::VARCHAR AS amendment_in_progress,
                0::INTEGER AS approved_amendment_applications,
                'Test Officer'::VARCHAR AS primary_project_officer,
                'Test Officer'::VARCHAR AS project_officers,
                '-'::VARCHAR AS primary_policy_tech_director,
                '-'::VARCHAR AS primary_monitoring_and_evaluation_analyst,
                '-'::VARCHAR AS monitoring_and_evaluation_analysts,
                '-'::VARCHAR AS primary_state_poc,
                '-'::VARCHAR AS primary_monitoring_evaluation_tech_director,
                '01/02/2026'::VARCHAR AS application_approval_date,
                {_sql_string(application_json)}::JSON AS applications,
                {_sql_string(deliverables_json)}::JSON AS deliverables,
                {_sql_string(demonstration_types_json)}::JSON AS demonstration_types
            {where_clause}
        ) TO {_sql_string(str(path))} (FORMAT PARQUET, COMPRESSION SNAPPY)
    """
    connection = duckdb.connect()
    try:
        connection.execute(query)
    finally:
        connection.close()


@pytest.fixture
def parquet_path(tmp_path: Path) -> Path:
    path = tmp_path / "demonstration_reporting.parquet"
    _write_parquet(path)
    return path


@pytest.fixture
def empty_parquet_path(tmp_path: Path) -> Path:
    path = tmp_path / "empty_demonstration_reporting.parquet"
    _write_parquet(path, include_row=False)
    return path


def test_readers_return_identical_records_in_file_column_order(parquet_path: Path) -> None:
    duckdb_records = read_with_duckdb(parquet_path)
    pyarrow_records = read_with_pyarrow(parquet_path)

    assert duckdb_records == [EXPECTED_RECORD]
    assert pyarrow_records == duckdb_records
    assert list(duckdb_records[0]) == list(EXPECTED_RECORD)
    assert list(pyarrow_records[0]) == list(EXPECTED_RECORD)
    assert isinstance(duckdb_records[0]["demonstration_id"], str)
    assert isinstance(duckdb_records[0]["approved_amendment_applications"], int)
    assert duckdb_records[0]["chip_id"] == "-"
    assert duckdb_records[0]["applications"] == APPLICATIONS
    assert duckdb_records[0]["deliverables"] == []
    assert duckdb_records[0]["demonstration_types"] == DEMONSTRATION_TYPES


def test_readers_return_empty_list_for_zero_row_file(empty_parquet_path: Path) -> None:
    assert read_with_duckdb(empty_parquet_path) == []
    assert read_with_pyarrow(empty_parquet_path) == []


@pytest.mark.parametrize(
    "uuid_value",
    [UUID(DEMONSTRATION_ID), UUID(DEMONSTRATION_ID).bytes, DEMONSTRATION_ID.upper()],
)
def test_normalize_row_returns_canonical_uuid_string(uuid_value: UUID | bytes | str) -> None:
    assert _normalize_row({"demonstration_id": uuid_value})["demonstration_id"] == DEMONSTRATION_ID


def test_normalize_row_parses_json_bytes_and_keeps_existing_lists() -> None:
    applications = [{"state": "Test State"}]
    normalized = _normalize_row(
        {
            "applications": b'[{"state": "Test State"}]',
            "deliverables": [],
            "demonstration_types": "[]",
        }
    )

    assert normalized["applications"] == applications
    assert normalized["deliverables"] == []
    assert normalized["demonstration_types"] == []


@pytest.mark.parametrize("engine", ["duckdb", "pyarrow"])
def test_main_prints_row_count_and_first_record(
    parquet_path: Path, capsys: pytest.CaptureFixture[str], engine: str
) -> None:
    assert main([str(parquet_path), "--engine", engine]) == 0

    output = capsys.readouterr().out
    row_count, first_record = output.split("\n", 1)
    assert row_count == "Row count: 1"
    assert json.loads(first_record) == EXPECTED_RECORD
