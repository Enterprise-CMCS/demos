"""Shared types and classes for the load_data_to_demos_app.py module."""

from dataclasses import dataclass
from typing import List, Literal, Tuple


@dataclass(frozen=True)
class TableInsertActionConfiguration:
    """A configuration for a table insert data_load action."""

    source_table: str
    destination_table: str
    column_list: List[str]


@dataclass(frozen=True)
class TriggerActionConfiguration:
    """A configuration for a trigger data load action."""

    action_type: Literal["disable", "enable"]
    target_table: str
    target_trigger_name: str

    def __post_init__(self) -> None:
        """Validate field contents after initialization.

        Raises:
            ValueError: If identifiers contain invalid characters.
        """
        for field_name in ("target_table", "target_trigger_name"):
            value = getattr(self, field_name)
            if not value.isidentifier():
                raise ValueError(f"{field_name} must be a bare SQL identifier: {value!r}")


@dataclass(frozen=True)
class TransactionActionConfiguration:
    """A configuration for a transaction data load action."""

    action_type: Literal["begin", "commit"]


@dataclass(frozen=True)
class ArbitraryActionConfiguration:
    """A configuration for arbitrary SQL to execute."""

    action_name: str
    sql_query: str


@dataclass(frozen=True)
class GeneratedInsertActionSql:
    """The generated SQL statement from a TableInsertActionConfiguration."""

    action_configuration: TableInsertActionConfiguration
    sql_query: str


@dataclass(frozen=True)
class GeneratedTriggerActionSql:
    """The generated SQL statement from a TriggerActionConfiguration."""

    action_configuration: TriggerActionConfiguration
    sql_query: str


@dataclass(frozen=True)
class GeneratedTransactionActionSql:
    """The generated SQL statement from a TransactionActionConfiguration."""

    action_configuration: TransactionActionConfiguration
    sql_query: str


@dataclass(frozen=True)
class GeneratedArbitraryActionSql:
    """The generated SQL statement from an ArbitraryActionConfiguration."""

    action_configuration: ArbitraryActionConfiguration
    sql_query: str


type DataLoadActionList = Tuple[
    TableInsertActionConfiguration
    | TriggerActionConfiguration
    | TransactionActionConfiguration
    | ArbitraryActionConfiguration,
    ...,
]

type GeneratedSqlStatement = (
    GeneratedInsertActionSql | GeneratedTriggerActionSql | GeneratedTransactionActionSql | GeneratedArbitraryActionSql
)

type DataLoadSql = List[GeneratedSqlStatement]


@dataclass(frozen=True)
class DataLoadConfiguration:
    """A class for a data load configuration."""

    source_schema: str
    target_schema: str
    data_load_actions: DataLoadActionList


@dataclass(frozen=True)
class AvailableDataLoadConfigurations:
    """A class with the currently available data load configurations."""

    base: DataLoadConfiguration
    rev01: DataLoadConfiguration
