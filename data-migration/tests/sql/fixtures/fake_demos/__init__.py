"""Vendored fake demos_app data generator (see generator.py header)."""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    import pandas as pd


def generate_all() -> dict[str, pd.DataFrame]:
    """Return ``{table_name: DataFrame}`` of deterministic fake demos_app data."""
    from .generator import TableRegistry

    return TableRegistry.generate_all()
