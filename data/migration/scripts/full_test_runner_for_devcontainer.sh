#!/usr/bin/bash
# Stop on any errors
set -e

# Set start to the data/ folder
cd /workspaces/demos/data

# Load the environment variables
source demos_data_tools/.env

# Activate the Python virtual environment; the path may be different when running in production
source /opt/demos-data/bin/activate

# STEP 1: Create the required schemas
cd demos_data_tools
python manage_migration_schemas.py create raw
python manage_migration_schemas.py create staging

# STEP 2: Load data from PMDA to DEMOS
python pmda_exporter.py

# STEP 3: Reset the application database
cd ../../server
npm run migrate:reset
npm run dbrefresh

# STEP 4: Copy file from S3 to dbt project
cd ../data/migration/stage_pmda_for_migration/seeds
rm -f raw_pmda_s3_file_list.csv
aws --endpoint-url=http://localstack:4566 s3 cp s3://${PMDA_S3_BUCKET}/s3_file_list.csv raw_pmda_s3_file_list.csv

# STEP 5: Run the data build tool project
cd ..
dbt deps
dbt build

# STEP 6: Copy files between buckets
cd ../../demos_data_tools
python migrate_files.py

# STEP 7: Copy data from staging to app schema
python load_staged_data_to_demos_app.py

# STEP 8: Take a snapshot of the migration data
python snapshot_migration_schema.py
