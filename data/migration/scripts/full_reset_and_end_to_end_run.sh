#!/usr/bin/zsh
# Reset raw, staging, and app, and run process end to end
set -e

# Start in the demos_data_tools and activate the venv
cd /workspaces/demos/data/demos_data_tools
source /opt/demos-data/bin/activate

# Not for use outside of devcontainer
python check_if_in_devcontainer.py

# Reset the app_schema database to empty
cd /workspaces/demos/server
npm run migrate:reset
npm run dbrefresh

# Drop and recreate migration schemas entirely
cd /workspaces/demos/data/demos_data_tools
# python manage_migration_schemas.py demos-localstack drop raw
# python manage_migration_schemas.py demos-localstack create raw
# python manage_migration_schemas.py demos-localstack drop staged
# python manage_migration_schemas.py demos-localstack create staged
python manage_migration_schemas.py demos-localstack drop rev01
python manage_migration_schemas.py demos-localstack create rev01

# Move data from prod to localstack
cd /workspaces/demos/data/demos_data_tools
python copy_app_schema_to_localstack.py 
# python copy_migration_schema_to_localstack.py raw
# python copy_migration_schema_to_localstack.py staged



# Remove the PMDA S3 file list if it exists in seeds
# Then, pull it down from S3
# cd /workspaces/demos/data/migration/stage_pmda_for_migration/seeds
# rm -f raw_pmda_s3_file_list.csv
# aws s3 cp s3://demos-prod-pmda-efs-transfer/s3_file_list.csv raw_pmda_s3_file_list.csv

# Run dbt project
cd /workspaces/demos/data/migration/data_migration_rev_01
dbt build

# Migrate files, then load data into DEMOS schema
cd /workspaces/demos/data/demos_data_tools
# python migrate_files.py
python load_data_to_demos_app.py demos-localstack rev01
