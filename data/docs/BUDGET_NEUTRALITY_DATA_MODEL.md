# Budget Neutrality Reporting Data Model

This document describes the reporting tables added for budget-neutrality workbook data. The [complete DEMOS data model](./DEMOS_Data_Model.mmd) shows the workbook's other schema relationships.

## ER diagram

```mermaid
erDiagram
  budget_neutrality_workbook ||--o{ budget_neutrality_workbook_test_value : "FK176"
  budget_neutrality_workbook ||--o{ budget_neutrality_workbook_test_year : "FK177"
  budget_neutrality_workbook ||--o{ budget_neutrality_workbook_spending_limit : "FK178"
  budget_neutrality_workbook_spending_limit ||--o{ budget_neutrality_workbook_spending_limit_meg : "FK179"

  budget_neutrality_workbook {
    uuid id PK
  }

  budget_neutrality_workbook_test_value {
    uuid id PK
    uuid workbook_id FK
    text test_id
    text measure_id
    text meg_name "NULLABLE"
    integer dy_number "NULLABLE"
    decimal(18,2) value
  }

  budget_neutrality_workbook_test_year {
    uuid workbook_id PK, FK
    text test_id PK
    integer dy_number PK
    bool cap_needed "NULLABLE"
  }

  budget_neutrality_workbook_spending_limit {
    uuid workbook_id PK, FK
    integer program_index PK
    text program_name
    decimal(18,2) cap_total "NULLABLE"
    decimal(18,2) variance_total "NULLABLE"
    bool over_cap "NULLABLE"
  }

  budget_neutrality_workbook_spending_limit_meg {
    uuid workbook_id PK, FK
    integer program_index PK, FK
    integer line_number PK
    text meg_name
    decimal(18,2) subject_to_cap_total "NULLABLE"
  }
```
