# Data Scripts

These are various convenience scripts for data-related activities. These are likely to be somewhat fragile as they are intended to assist developers in their work, rather than to be deployed as production code themselves. Read and understand the script you're using before you run it!

# Running Checks

You can use `./run_checks.sh` to run various Python code quality checks. Be sure to install the packages found in `/data/requirements.txt` into an appropriate virtual environment.

# Specific Scripts

Below is documentation for specific scripts in this folder.

## history_trigger_generator.py

This script can be used to generate the triggers necessary to populate history tables with changes. It now will put these into the correct folder in `sql` within the `server` directory.

```zsh
python history_trigger_generator.py
```

Note that as new tables are added and have corresponding history tables, the script will need to be updated so as to add those tables to the global variable `TBL_FOLDERS`.

Please also note that this script is brittle and depends on specific formatting being in place (namely, having only one `@@` statement on the history table, which corresponds to the `map` statement).
