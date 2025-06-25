# Data Scripts

These are various convenience scripts for data-related activities. These are likely to be somewhat fragile as they are intended to assist developers in their work, rather than to be deployed as production code themselves. Read and understand the script you're using before you run it!

# Running Checks

You can use `./run_checks.sh` to run various Python code quality checks. Be sure to install the packages found in `/data/requirements.txt` into an appropriate virtual environment.

# Specific Scripts

Below is documentation for specific scripts in this folder.

## history_trigger_generator.py

This script can be used to generate the triggers necessary to populate history tables with changes. Invoke it from the command line in the `/data/utilities/scripts` folder with the name of the migration folder. For example:

```zsh
python history_trigger_generator.py 20250623155513_add_history_triggers
```

Note that as new tables are added and have corresponding history tables, the script will need to be updated so as to add those tables to the global variable `TBL_FOLDERS`.
