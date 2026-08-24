"""Shared types and classes for the load_data_to_demos_app.py module."""

from dataclasses import dataclass
from typing import Dict, List, Literal, Protocol, Tuple

from duckdb_connection_manager import DemosDuckDbAttachName


@dataclass(frozen=True)
class TableInsertActionConfiguration:
    """A configuration for a table insert data_load action."""

    source_table: str
    target_table: str
    column_list: List[str]


@dataclass(frozen=True)
class TriggerActionConfiguration:
    """A configuration for a trigger data load action."""

    action_type: Literal["disable", "enable"]
    trigger_schema: str
    trigger_table: str
    trigger_name: str

    def __post_init__(self) -> None:
        """Validate field contents after initialization.

        Raises:
            ValueError: If identifiers contain invalid characters.
        """
        for field_name in ("trigger_schema", "trigger_table", "trigger_name"):
            value = getattr(self, field_name)
            if not value.isidentifier():
                raise ValueError(f"{field_name} must be a bare SQL identifier: {value!r}")


@dataclass(frozen=True)
class TransactionActionConfiguration:
    """A configuration for a transaction data load action."""

    action_type: Literal["begin", "commit"]


@dataclass(frozen=True)
class ArbitrarySqlGenerationContext:
    """Values used in ArbitrarySqlGenerator objects.

    Args:
        attach_name (DemosDuckDbAttachName): A valid attach name for a DuckDB attachment.
        app_schema (str): The name of the application schema.
    """

    attach_name: DemosDuckDbAttachName
    app_schema: str


class ArbitrarySqlGenerator(Protocol):
    """Generator class for arbitrary SQL that allows insertion of the attach_name."""

    def __call__(self, generation_context: ArbitrarySqlGenerationContext) -> str: ...  # noqa: D102


@dataclass(frozen=True)
class ArbitraryActionConfiguration:
    """A configuration for arbitrary SQL to execute."""

    action_name: str
    sql_generator: ArbitrarySqlGenerator


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


type DataLoadConfigurationName = Literal["base", "rev01"]
type AvailableDataLoadConfigurations = Dict[DataLoadConfigurationName, DataLoadConfiguration]
