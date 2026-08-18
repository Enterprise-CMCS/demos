#!/usr/bin/zsh
# Reset raw, staging, and app
# Useful to ensure you leave no prod data locally
set -e

# Start in the demos_data_tools and activate the venv
cd /workspaces/demos/data/demos_data_tools
source /opt/demos-data/bin/activate

# Not for use outside of devcontainer
python check_if_in_devcontainer.py

# Drop migration schemas entirely
python manage_migration_schemas.py drop raw
python manage_migration_schemas.py drop staging

# Reset the database to empty
cd /workspaces/demos/server
npm run migrate:reset
npm run dbrefresh

# Remove the PMDA S3 file list if it exists in seeds
cd /workspaces/demos/data/migration/stage_pmda_for_migration/seeds
rm -f raw_pmda_s3_file_list.csv
