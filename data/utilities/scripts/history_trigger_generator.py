"""Generate trigger functions for history tables automatically."""

import re
from textwrap import dedent
from typing import List

TBL_FOLDERS = [
    "amendment",
    "application",
    "applicationDate",
    "applicationNote",
    "applicationPhase",
    "applicationTagAssignment",
    "demonstration",
    "demonstrationRoleAssignment",
    "demonstrationTypeTagAssignment",
    "document",
    "documentPendingUpload",
    "documentInfected",
    "extension",
    "person",
    "personState",
    "primaryDemonstrationRoleAssignment",
    "rolePermission",
    "systemRoleAssignment",
    "tag",
    "tagConfiguration",
    "user",
]
APP_SCHEMA = "demos_app"
DROP_QUERY = """-- Drop existing history logging functions and triggers
DO $$
DECLARE
    function_trigger_record RECORD;
BEGIN
    FOR function_trigger_record IN
        SELECT
            c.relname AS table_name,
            t.tgname AS trigger_name,
            p.proname AS function_name
        FROM
            pg_trigger AS t
        INNER JOIN
            pg_proc AS p ON
                t.tgfoid = p.oid
        INNER JOIN
            pg_class AS c ON
                t.tgrelid = c.oid
        INNER JOIN
            pg_namespace AS n ON
                c.relnamespace = n.oid
                AND p.pronamespace = n.oid
        WHERE
            p.proname LIKE 'log_changes_%'
            AND n.nspname = 'demos_app'
    LOOP
        EXECUTE format(
            'DROP TRIGGER %I ON demos_app.%I;',
            function_trigger_record.trigger_name,
            function_trigger_record.table_name
        );
        RAISE NOTICE
            'Dropped trigger % on demos_app.%',
            function_trigger_record.trigger_name,
            function_trigger_record.table_name;

        EXECUTE format(
            'DROP FUNCTION demos_app.%I();',
            function_trigger_record.function_name
        );
        RAISE NOTICE
            'Dropped function demos_app.%()',
            function_trigger_record.function_name;
    END LOOP;
END
$$;

"""


def get_table_name(prisma_lines: List[str]) -> dict:
    """Get table name from lines of a Prisma file defining a history table.

    Args:
        prisma_lines (List[str]): List of lines from a Prisma file.

    Returns:
        dict: The table name and history table name.

    Raises:
        Exception: If the table is not a history table.
    """
    tbl_map_line = [x for x in prisma_lines if x[0:4] == "  @@"]
    pattern = '@@map\\("([^"]*)"\\)'
    tbl_match = re.search(pattern, tbl_map_line[0])
    if tbl_match is not None:
        tbl_name = tbl_match.group(1)

    # Simple check to make sure we actually read a history table
    if tbl_name[-8:] != "_history":
        raise Exception("You have executed the get_table_name function on a non-history table!")

    # Return table name and historical table name
    return {"tbl": tbl_name[:-8], "tbl_hist": tbl_name}


def get_columns(prisma_lines: List[str]) -> List[str]:
    """Get columns from lines of a Prisma file.

    Args:
        prisma_lines (List[str]): List of lines from a Prisma file.

    Returns:
        List[str]: A list of columns to use in the query.
    """
    cols = []
    for x in prisma_lines:
        pattern1 = '\\s@map\\("([^"]*)"\\)'
        pattern2 = "^\\  (\\w+)"
        match1 = re.search(pattern1, x)
        match2 = re.search(pattern2, x)
        if match1:
            col_name = match1.group(1)
        elif match2:
            col_name = match2.group(1)
        else:
            col_name = ""
        if col_name not in ["revision_id", "revision_type", "modified_at", ""]:
            cols.append(col_name)
    return cols


def get_trigger_code(prisma_lines: List[str]) -> str:
    """Create a trigger from lines in Prisma.

    Args:
        prisma_lines (List[str]): List of lines from a Prisma file.

    Returns:
        str: The properly formatted query creating the trigger.
    """
    tbl_names = get_table_name(prisma_lines)
    table_name = tbl_names["tbl"]
    hist_table_name = tbl_names["tbl_hist"]
    col_names = get_columns(prisma_lines)

    # Indenting these lines
    col_name_list = ",\n".join(["                " + x for x in col_names])
    new_name_list = ",\n".join(["                NEW." + x for x in col_names])
    old_name_list = ",\n".join(["                OLD." + x for x in col_names])

    # Removing the initial indent
    col_name_list = col_name_list.replace("                ", "", 1)
    new_name_list = new_name_list.replace("                ", "", 1)
    old_name_list = old_name_list.replace("                ", "", 1)

    query = f"""
    CREATE OR REPLACE FUNCTION {APP_SCHEMA}.log_changes_{table_name}()
    RETURNS TRIGGER AS $$
    BEGIN
        IF TG_OP IN ('INSERT', 'UPDATE') THEN
            INSERT INTO {APP_SCHEMA}.{hist_table_name} (
                revision_type,
                {col_name_list}
            )
            VALUES (
                CASE TG_OP
                    WHEN 'INSERT' THEN 'I'::{APP_SCHEMA}.revision_type_enum
                    WHEN 'UPDATE' THEN 'U'::{APP_SCHEMA}.revision_type_enum
                END,
                {new_name_list}
            );
            RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
            INSERT INTO {APP_SCHEMA}.{hist_table_name} (
                revision_type,
                {col_name_list}
            )
            VALUES (
                'D'::{APP_SCHEMA}.revision_type_enum,
                {old_name_list}
            );
            RETURN OLD;
        END IF;
        RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;

    CREATE OR REPLACE TRIGGER log_changes_{table_name}_trigger
    AFTER INSERT OR UPDATE OR DELETE ON {APP_SCHEMA}.{table_name}
    FOR EACH ROW EXECUTE FUNCTION {APP_SCHEMA}.log_changes_{table_name}();"""
    query = query.replace("\n", "", 1)
    query = dedent(query)
    return query


def get_prisma_lines(folder: str) -> List[str]:
    """Get Prisma lines from a folder.

    Args:
        folder (str): Folder name of a model to be read.

    Returns:
        List[str]: List of lines from a Prisma file.
    """
    # Join tables are prefixed with _ so this removes that
    file_name = folder if folder[0] != "_" else folder[1:]
    file_path = f"../../../server/src/model/{folder}/{file_name}History.prisma"
    with open(file_path, "r") as prisma_file:
        prisma_lines = prisma_file.readlines()
    return prisma_lines


def main() -> None:
    """Execute main program function."""
    queries = []
    for i, x in enumerate(TBL_FOLDERS):
        prisma_lines = get_prisma_lines(x)
        if i == len(TBL_FOLDERS) - 1:
            queries.append(get_trigger_code(prisma_lines) + "\n")
        else:
            queries.append(get_trigger_code(prisma_lines) + "\n\n")

    with open("../../../server/src/sql/history_triggers.sql", "w") as query_file:
        query_file.write(DROP_QUERY)
        query_file.writelines(queries)


if __name__ == "__main__":
    main()
