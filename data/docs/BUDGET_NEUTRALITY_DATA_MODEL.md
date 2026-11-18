# Budget Neutrality Reporting Data Model

This document describes the reporting tables added for budget-neutrality workbook data. The [complete DEMOS data model](./DEMOS_Data_Model.mmd) shows the workbook's other schema relationships.

Reporting values reference the static hypothetical and measure lookup tables. Workbook-owned reporting rows cascade when a workbook is deleted; MEG rows cascade with their spending-limit parent. Lookup deletion is restricted while referenced, and lookup identifier updates cascade. The hypothetical-value identity is `UNIQUE NULLS NOT DISTINCT` on `(workbook_id, hypothetical_id, measure_id, meg_name, dy_number)`, so nullable aggregate dimensions cannot create duplicate rows.

## ER diagram

```mermaid
erDiagram
  budget_neutrality_workbook ||--o{ budget_neutrality_workbook_hypothetical_value : "FK176"
  budget_neutrality_workbook ||--o{ budget_neutrality_workbook_hypothetical_year : "FK177"
  budget_neutrality_workbook ||--o{ budget_neutrality_workbook_spending_limit : "FK178"
  budget_neutrality_workbook_spending_limit ||--o{ budget_neutrality_workbook_spending_limit_meg : "FK179"
  budget_neutrality_hypothetical ||--o{ budget_neutrality_workbook_hypothetical_value : "FK180"
  budget_neutrality_measure ||--o{ budget_neutrality_workbook_hypothetical_value : "FK181"
  budget_neutrality_hypothetical ||--o{ budget_neutrality_workbook_hypothetical_year : "FK182"

  budget_neutrality_workbook {
    uuid id PK
  }

  budget_neutrality_hypothetical {
    text id PK
  }

  budget_neutrality_measure {
    text id PK
  }

  budget_neutrality_workbook_hypothetical_value {
    uuid id PK
    uuid workbook_id FK
    text hypothetical_id FK
    text measure_id FK
    text meg_name "NULLABLE"
    integer dy_number "NULLABLE"
    decimal(18,2) value
    timestamptz created_at
    timestamptz updated_at
  }

  budget_neutrality_workbook_hypothetical_year {
    uuid workbook_id PK, FK
    text hypothetical_id PK, FK
    integer dy_number PK
    bool cap_needed "NULLABLE"
    timestamptz created_at
    timestamptz updated_at
  }

  budget_neutrality_workbook_spending_limit {
    uuid workbook_id PK, FK
    integer program_index PK
    text program_name
    decimal(18,2) cap_total "NULLABLE"
    decimal(18,2) variance_total "NULLABLE"
    bool over_cap "NULLABLE"
    timestamptz created_at
    timestamptz updated_at
  }

  budget_neutrality_workbook_spending_limit_meg {
    uuid workbook_id PK, FK
    integer program_index PK, FK
    integer line_number PK
    text meg_name
    decimal(18,2) subject_to_cap_total "NULLABLE"
    timestamptz created_at
    timestamptz updated_at
  }
```
