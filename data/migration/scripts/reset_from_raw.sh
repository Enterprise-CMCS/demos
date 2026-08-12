#!/usr/bin/zsh
# Reset raw, staging and app
# Useful to ensure you leave no prod data locally
set -e

# Start in the demos_data_tools and activate the venv
cd /workspaces/demos/data/demos_data_tools
source /opt/demos-data/bin/activate

# Not for use outside of devcontainer
python check_if_in_devcontainer.py

# Drop and recreate staging schema
python manage_migration_schemas.py drop raw
python manage_migration_schemas.py create raw
python manage_migration_schemas.py drop staging
python manage_migration_schemas.py create staging

# Reset the database to empty
cd /workspaces/demos/server
npm run migrate:reset
npm run dbrefresh
