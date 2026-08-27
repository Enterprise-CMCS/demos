"""Shared types, classes, and constants for the demos_data_tools module."""

from dataclasses import dataclass
from typing import List, Literal, Protocol, Tuple, get_args

type DatabaseConfigurationName = Literal["demos-localstack", "demos-aws"]
type AppSchemaName = Literal["demos_app"]
type MigrationRawSchemaName = Literal["legacy_pmda_raw"]
type MigrationStagedSchemaName = Literal["legacy_pmda_staged", "legacy_pmda_migration_rev_01"]
type MigrationSchemaName = MigrationRawSchemaName | MigrationStagedSchemaName
type DuckDbAttachName = Literal["ddb_demos_localstack", "ddb_demos_aws"]
type DataLoadConfigurationName = Literal["base", "rev01"]
type MigrationSchemaAction = Literal["create", "drop"]
type DemosReadRole = Literal["demos_read"]

DB_CONFIG_NAMES: Tuple[DatabaseConfigurationName, ...] = get_args(DatabaseConfigurationName.__value__)
APP_SCHEMA_NAME: AppSchemaName = "demos_app"
MIGRATION_RAW_SCHEMA_NAME: MigrationRawSchemaName = "legacy_pmda_raw"
MIGRATION_STAGED_SCHEMA_NAMES: Tuple[MigrationStagedSchemaName, ...] = get_args(MigrationStagedSchemaName.__value__)
MIGRATION_SCHEMA_NAMES: Tuple[MigrationSchemaName, ...] = (MIGRATION_RAW_SCHEMA_NAME, *MIGRATION_STAGED_SCHEMA_NAMES)
DUCKDB_ATTACH_NAMES: Tuple[DuckDbAttachName, ...] = get_args(DuckDbAttachName.__value__)
DL_CONFIG_NAMES: Tuple[DataLoadConfigurationName, ...] = get_args(DataLoadConfigurationName.__value__)
MIGRATION_SCHEMA_ACTIONS: Tuple[MigrationSchemaAction, ...] = get_args(MigrationSchemaAction.__value__)
DEMOS_READ_ROLE: DemosReadRole = "demos_read"


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

    Attributes:
        attach_name (DuckDbAttachName): A valid attach name for a DuckDB attachment.
        app_schema (str): The name of the application schema.
    """

    attach_name: DuckDbAttachName
    app_schema: AppSchemaName


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

    source_schema: MigrationStagedSchemaName
    target_schema: AppSchemaName
    data_load_actions: DataLoadActionList
