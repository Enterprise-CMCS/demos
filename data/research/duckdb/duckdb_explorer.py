"""Test out various duckdb functions that may be useful for the project."""

import configparser

import duckdb


def parse_config() -> dict:
    """Parse the configuration file and return a dictionary.

    Returns:
        dict: A dictionary containing the database configuration(s).
    """
    parser = configparser.ConfigParser()
    parser.read("dbinfo.ini")
    config = {}
    for section in ["dev-mysql"]:
        config[section] = {
            "host": parser.get(section, "host"),
            "port": parser.get(section, "port"),
            "user": parser.get(section, "user"),
            "password": parser.get(section, "password"),
            "database": parser.get(section, "database"),
        }
    return config


def main() -> None:
    """Run the DuckDB operations.

    Returns:
        NoneType: None
    """
    config = parse_config()

    duck_conn = duckdb.connect(":memory:")
    duck_conn.install_extension("mysql")
    duck_conn.load_extension("mysql")

    attach_string = (
        f"host={config['dev-mysql']['host']} "
        + f"port={config['dev-mysql']['port']} "
        + f"user={config['dev-mysql']['user']} "
        + f"password={config['dev-mysql']['password']} "
        + f"database={config['dev-mysql']['database']}"
    )
    duck_conn.execute(f"ATTACH '{attach_string}' AS mysql_db (TYPE mysql);")
    result = duck_conn.execute("SELECT * FROM mysql_db.cma_dev_11_1_000.v_app_mgmt_demo_types LIMIT 10;").fetchall()
    for x in result:
        print(x)
    return None


if __name__ == "__main__":
    main()
