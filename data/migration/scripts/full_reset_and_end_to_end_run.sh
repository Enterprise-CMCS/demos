#!/usr/bin/zsh
# Reset raw, staging, and app, and run process end to end
set -e

# Start in the demos_data_tools and activate the venv
cd /workspaces/demos/data/demos_data_tools
source /opt/demos-data/bin/activate

# Not for use outside of devcontainer
python check_if_in_devcontainer.py

# Drop and recreate migration schemas entirely
python manage_migration_schemas.py drop raw
python manage_migration_schemas.py drop staging
python manage_migration_schemas.py create raw
python manage_migration_schemas.py create staging

# Reset the database to empty
cd /workspaces/demos/server
npm run migrate:reset
npm run dbrefresh

# Move data from MySQL to PostgreSQL
cd /workspaces/demos/data/demos_data_tools
python pmda_exporter.py

# Run dbt project
cd /workspaces/demos/data/migration/stage_pmda_for_migration
dbt build

# Run final step
cd /workspaces/demos/data/demos_data_tools
python load_staged_data_to_demos_app.py
