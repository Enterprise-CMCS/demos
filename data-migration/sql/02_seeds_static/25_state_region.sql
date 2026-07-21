/*
 * Purpose: Define and seed migration.state_region (CMS/HHS regional office number 1-10 per state), migration-private reference data used to derive and validate PMDA demonstration project numbers; idempotent.
 * Refs:    reports/narrative/pending_approved_decisions.md, sql/99_parity/10_demonstration_id_provenance.sql
 *
 * migration.state_region: CMS/HHS regional office number (1-10) per state.
 *
 * The DEMOS demos_app.state table is owned and seeded by Prisma. Upstream
 * migrations now add a NOT NULL `region` column (CMS region 1-10) to it and
 * seed it, so demos_app.state *does* carry region. The migration still keeps
 * its own copy as migration-private reference data: it needs the region to
 * derive / validate the PMDA demonstration project number `11-W-NNNNN/R`,
 * where R is the CMS Region (see reports/narrative/pending_approved_decisions.md and
 * sql/99_parity/10_demonstration_id_provenance.sql), and migration.* must
 * survive independently of the demos_app rebuild/truncate (see the no-FK note
 * below) rather than depend on the Prisma-owned column.
 *
 *   Region 1  Boston        CT, MA, ME, NH, RI, VT
 *   Region 2  New York      NJ, NY, PR, VI
 *   Region 3  Philadelphia  DE, DC, MD, PA, VA, WV
 *   Region 4  Atlanta       AL, FL, GA, KY, MS, NC, SC, TN
 *   Region 5  Chicago       IL, IN, MI, MN, OH, WI
 *   Region 6  Dallas        AR, LA, NM, OK, TX
 *   Region 7  Kansas City   IA, KS, MO, NE
 *   Region 8  Denver        CO, MT, ND, SD, UT, WY
 *   Region 9  San Francisco AZ, CA, HI, NV, AS, GU, MP
 *   Region 10 Seattle       AK, ID, OR, WA
 *
 * state_id is the 2-letter ANSI / USPS code, matching demos_app.state.id
 * and the legacy `geo_ansi_state_cd` the migration crosswalks against. No
 * FK to demos_app.state on purpose: demos_app.* is rebuilt/truncated during
 * the build phases and this table must survive independently.
 */
SET search_path TO migration, public;

CREATE TABLE IF NOT EXISTS migration.state_region(
  state_id text PRIMARY KEY,
  region smallint NOT NULL CHECK (region BETWEEN 1 AND 10)
);

INSERT INTO migration.state_region(state_id, region)
  VALUES ('CT', 1),
('MA', 1),
('ME', 1),
('NH', 1),
('RI', 1),
('VT', 1),
('NJ', 2),
('NY', 2),
('PR', 2),
('VI', 2),
('DE', 3),
('DC', 3),
('MD', 3),
('PA', 3),
('VA', 3),
('WV', 3),
('AL', 4),
('FL', 4),
('GA', 4),
('KY', 4),
('MS', 4),
('NC', 4),
('SC', 4),
('TN', 4),
('IL', 5),
('IN', 5),
('MI', 5),
('MN', 5),
('OH', 5),
('WI', 5),
('AR', 6),
('LA', 6),
('NM', 6),
('OK', 6),
('TX', 6),
('IA', 7),
('KS', 7),
('MO', 7),
('NE', 7),
('CO', 8),
('MT', 8),
('ND', 8),
('SD', 8),
('UT', 8),
('WY', 8),
('AZ', 9),
('CA', 9),
('HI', 9),
('NV', 9),
('AS', 9),
('GU', 9),
('MP', 9),
('AK', 10),
('ID', 10),
('OR', 10),
('WA', 10)
ON CONFLICT (state_id)
  DO UPDATE SET
    region = EXCLUDED.region;

