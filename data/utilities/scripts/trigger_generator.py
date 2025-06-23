"""Generate trigger functions for history tables automatically."""

import re
from textwrap import dedent

TBL_FOLDERS = [
    "_rolePermission",
    "_userRole",
    "_userState",
    "_userStateDemonstration",
    "demonstration",
    "demonstrationStatus",
    "permission",
    "role",
    "state",
    "user"
]

def get_table_name(prisma_lines):
    """Get table name from lines of a Prisma file defining a history table."""
    tbl_map_line = [x for x in prisma_lines if x[0:4] == "  @@"]
    pattern = '@@map\\("([^"]*)"\\)'
    tbl_name = re.search(pattern, tbl_map_line[0]).group(1)

    # Simple check to make sure we actually read a history table
    if tbl_name[-8:] != "_history":
        raise Exception("You have executed the get_table_name function on a non-history table!")

    # Return table name and historical table name
    return {"tbl": tbl_name[:-8], "tbl_hist": tbl_name}


def get_columns(prisma_lines):
    """Get columns from lines of a Prisma file."""
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

def get_trigger_code(prisma_lines):
    """Create a trigger from lines in Prisma."""
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
    CREATE OR REPLACE FUNCTION log_changes_{table_name}()
    RETURNS TRIGGER AS $$
    BEGIN
        IF TG_OP IN ('INSERT', 'UPDATE') THEN
            INSERT INTO {hist_table_name} (
                revision_type,
                {col_name_list}
            )
            VALUES (
                CASE TG_OP
                    WHEN 'INSERT' THEN 'I'::revision_type_enum
                    WHEN 'UPDATE' THEN 'U'::revision_type_enum
                END,
                {new_name_list}
            );
            RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
            INSERT INTO {hist_table_name} (
                revision_type,
                {col_name_list}
            )
            VALUES (
                'D'::revision_type_enum,
                {old_name_list}
            );
            RETURN OLD;
        END IF;
        RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER log_changes_{table_name}_trigger
    AFTER INSERT OR UPDATE OR DELETE ON {table_name}
    FOR EACH ROW EXECUTE FUNCTION log_changes_{table_name}();"""
    query = query.replace("\n", "", 1)
    query = dedent(query)
    return query

def get_prisma_lines (folder):
    """Get Prisma lines from a folder."""
    # Join tables are prefixed with _ so this removes that
    file_name = folder if folder[0] != "_" else folder[1:]
    file_path = f"../../{folder}/{file_name}History.prisma"
    with open(file_path, "r") as prisma_file:
        prisma_lines = prisma_file.readlines()
    return prisma_lines

queries = []
for x in TBL_FOLDERS:
    prisma_lines = get_prisma_lines(x)
    queries.append(get_trigger_code(prisma_lines) + "\n\n")

with open("migration.sql", "w") as query_file:
    query_file.writelines(queries)
