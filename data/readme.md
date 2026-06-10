`sqlfluff` is available in the Python configuration for fixing / linting SQL scripts. `sqlfluff fix file.sql` automatically applies the rules in the configuration (if run in the `data/` folder).

To update the data model PNG file, update the MermaidJS file in `docs/DEMOS_Data_Model.mmd` and then run `npm run model:update` from the data folder. (Somewhat tempermental, not always working!)
