#!/usr/bin/zsh
# Reset staging and app and download the file list
set -e

# Start in the demos_data_tools and activate the venv
cd /workspaces/demos/data/demos_data_tools
source /opt/demos-data/bin/activate

# Not for use outside of devcontainer
python check_if_in_devcontainer.py

# Drop and recreate staging schema
python manage_migration_schemas.py drop staging
python manage_migration_schemas.py create staging

# Reset the database to empty
cd /workspaces/demos/server
npm run migrate:reset
npm run dbrefresh

# Remove the PMDA S3 file list if it exists in seeds
# Then, pull it down from S3
cd /workspaces/demos/data/migration/stage_pmda_for_migration/seeds
rm -f raw_pmda_s3_file_list.csv
aws s3 cp s3://demos-prod-pmda-efs-transfer/s3_file_list.csv raw_pmda_s3_file_list.csv
