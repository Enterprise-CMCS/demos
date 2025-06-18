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
    """Get table name from lines of a Prisma file."""
    # I wrote this slightly more generally than needed
    # Handles one-word table names correctly, but no history table has this
    tbl_map_line = [x for x in prisma_lines if x[0:4] == "  @@"]
    pattern1 = "^model (\\w+)"
    pattern2 = '@@map\\("([^"]*)"\\)'
    if not tbl_map_line:
        matched = re.search(pattern1, prisma_lines[0])
        tbl_name = matched.group(1)
    else:
        matched = re.search(pattern2, tbl_map_line[0])
        tbl_name = matched.group(1)

    # Removing the _history that is always returned here
    tbl_name = tbl_name[:-8]
    return tbl_name

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
    tbl_name = get_table_name(prisma_lines)
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
    CREATE OR REPLACE FUNCTION log_changes_{tbl_name}()
    RETURNS TRIGGER AS $$
    BEGIN
        IF TG_OP IN ('INSERT', 'UPDATE') THEN
            INSERT INTO user_role_history (
                revision_type,
                {col_name_list}
            )
            VALUES (
                CASE TG_OP
                    WHEN 'INSERT' THEN 'I'
                    WHEN 'UPDATE' THEN 'U'
                END,
                {new_name_list}
            );
            RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
            INSERT INTO user_role_history (
                revision_type,
                {col_name_list}
            )
            VALUES (
                'D',
                {old_name_list}
            );
            RETURN OLD;
        END IF;
        RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER log_changes_{tbl_name}_trigger
    AFTER INSERT OR UPDATE OR DELETE ON {tbl_name}
    FOR EACH ROW EXECUTE FUNCTION log_changes_{tbl_name}();"""
    query = query.replace("\n", "", 1)
    query = dedent(query)
    return query

def get_prisma_lines (folder):
    """Get Prisma lines from a folder."""
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
