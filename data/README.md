# DEMOS Data

This is the data code for the DEMOS project. It contains the following.

- `docs/`: this is the MermaidJS entity-relation diagram for the `demos_app` schema. You can regenerate the PNG file using `npm run model:update` - note that you may get an X window popping up when Chromium is launched.
- `demos_data_tools/`: this is a Python module containing various DEMOS data tools.
- `migration/`: this is the location for data migration code from PMDA to DEMOS.
- `uat_scenario/`: this is code for generating different scenarios for user acceptance testing.

Within `data/` there is also a `sqlfluff` configuration that can be used for linting / fixing SQL scripts; however, note that you will need to run the script from inside `data/` to get the right configuration.
