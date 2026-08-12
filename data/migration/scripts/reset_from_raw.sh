#!/usr/bin/zsh
<<<<<<< HEAD
# Reset raw, staging and app
=======
# Reset raw, staging, and app
>>>>>>> main
# Useful to ensure you leave no prod data locally
set -e

# Start in the demos_data_tools and activate the venv
cd /workspaces/demos/data/demos_data_tools
source /opt/demos-data/bin/activate

# Not for use outside of devcontainer
python check_if_in_devcontainer.py

<<<<<<< HEAD
# Drop and recreate staging schema
python manage_migration_schemas.py drop raw
python manage_migration_schemas.py create raw
python manage_migration_schemas.py drop staging
python manage_migration_schemas.py create staging
=======
# Drop migration schemas entirely
python manage_migration_schemas.py drop raw
python manage_migration_schemas.py drop staging
>>>>>>> main

# Reset the database to empty
cd /workspaces/demos/server
npm run migrate:reset
npm run dbrefresh
<<<<<<< HEAD
=======

# Remove the PMDA S3 file list if it exists in seeds
cd /workspaces/demos/data/migration/stage_pmda_for_migration/seeds
rm -f raw_pmda_s3_file_list.csv
>>>>>>> main
