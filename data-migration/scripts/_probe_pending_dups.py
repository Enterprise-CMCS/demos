from urllib.parse import unquote, urlparse

import duckdb

try:
    from migration.lib import Env

    mysql_url = Env.load().mysql_url
except Exception:
    import os

    from dotenv import load_dotenv

    load_dotenv()
    mysql_url = os.environ["MYSQL_URL"]

u = urlparse(mysql_url)
parts = {
    "host": u.hostname or "",
    "port": str(u.port or 3306),
    "user": unquote(u.username or ""),
    "password": unquote(u.password or ""),
    "database": (u.path or "/").lstrip("/"),
}
dsn = " ".join(f"{k}={v}" for k, v in parts.items())

con = duckdb.connect()
con.execute("INSTALL mysql; LOAD mysql;")
try:
    con.execute(f"ATTACH '{dsn.replace(chr(39), chr(39) * 2)}' AS my (TYPE mysql, READ_ONLY)")
except Exception as e:
    raise RuntimeError(f"MySQL ATTACH failed: {type(e).__name__}") from None

con.execute(
    """
    CREATE TEMP TABLE state_region(state_id TEXT, region SMALLINT);
    INSERT INTO state_region VALUES
     ('CT',1),('MA',1),('ME',1),('NH',1),('RI',1),('VT',1),
     ('NJ',2),('NY',2),('PR',2),('VI',2),
     ('DE',3),('DC',3),('MD',3),('PA',3),('VA',3),('WV',3),
     ('AL',4),('FL',4),('GA',4),('KY',4),('MS',4),('NC',4),('SC',4),('TN',4),
     ('IL',5),('IN',5),('MI',5),('MN',5),('OH',5),('WI',5),
     ('AR',6),('LA',6),('NM',6),('OK',6),('TX',6),
     ('IA',7),('KS',7),('MO',7),('NE',7),
     ('CO',8),('MT',8),('ND',8),('SD',8),('UT',8),('WY',8),
     ('AZ',9),('CA',9),('HI',9),('NV',9),('AS',9),('GU',9),('MP',9),
     ('AK',10),('ID',10),('OR',10),('WA',10);
    """
)

# valid mdcd_demo_num regex and valid state regex (mirror 10/11_filter_*).
NUM_RE = r"^11-W-[0-9]{5}/(10|[1-9])$"
ST_RE = r"^[A-Z]{2}$"

# orphan_loadable pending demos (mirror _valid_pendg_demo_ids + _pendg_demo_fold):
#  - non-deleted; project number present + valid; state valid; created present;
#  - NO format-valid approved counterpart sharing the trimmed project number.
con.execute(
    f"""
    CREATE TEMP VIEW orphan_pend AS
    WITH valid_appr AS (
      SELECT DISTINCT trim(mdcd_demo_num) AS num
      FROM my.mdcd_demo
      WHERE mdcd_demo_num IS NOT NULL
        AND regexp_matches(mdcd_demo_num, '{NUM_RE}')
        AND (geo_ansi_state_cd IS NULL OR regexp_matches(geo_ansi_state_cd, '{ST_RE}'))
        AND creatd_dt IS NOT NULL
        AND (state_prfmnc_yr_strt_dt IS NULL
             OR extract(year FROM state_prfmnc_yr_strt_dt) BETWEEN 1990 AND 2099)
    )
    SELECT
      p.mdcd_pendg_demo_id AS legacy_id,
      trim(p.mdcd_demo_num) AS medicaid_id,
      p.geo_ansi_state_cd   AS state_id,
      CAST(p.dltd_ind AS INT) AS dltd_ind,
      p.creatd_dt
    FROM my.mdcd_pendg_demo p
    WHERE (p.dltd_ind IS NULL OR CAST(p.dltd_ind AS INT) <> 1)
      AND p.mdcd_demo_num IS NOT NULL AND trim(p.mdcd_demo_num) <> ''
      AND regexp_matches(p.mdcd_demo_num, '{NUM_RE}')
      AND (p.geo_ansi_state_cd IS NULL OR regexp_matches(p.geo_ansi_state_cd, '{ST_RE}'))
      AND p.creatd_dt IS NOT NULL
      AND (p.state_prfmnc_yr_strt_dt IS NULL
           OR extract(year FROM p.state_prfmnc_yr_strt_dt) BETWEEN 1990 AND 2099)
      AND trim(p.mdcd_demo_num) NOT IN (SELECT num FROM valid_appr)
    """
)

# duplicate groups + winner rule (region-suffix match, then lowest legacy id).
rows = con.execute(
    """
    WITH dups AS (
      SELECT medicaid_id
      FROM orphan_pend
      GROUP BY medicaid_id
      HAVING count(*) > 1
    ),
    enriched AS (
      SELECT
        o.medicaid_id,
        o.legacy_id,
        o.state_id,
        sr.region,
        regexp_extract(o.medicaid_id, '/([0-9]+)$', 1) AS suffix,
        CASE WHEN regexp_extract(o.medicaid_id, '/([0-9]+)$', 1) <> ''
              AND (CAST(regexp_extract(o.medicaid_id, '/([0-9]+)$', 1) AS INT) = sr.region
                   OR (regexp_extract(o.medicaid_id, '/([0-9]+)$', 1) = '0' AND sr.region = 10))
             THEN 0 ELSE 1 END AS region_rank,
        o.dltd_ind,
        o.creatd_dt
      FROM orphan_pend o
      JOIN dups d USING (medicaid_id)
      LEFT JOIN state_region sr ON sr.state_id = o.state_id
    )
    SELECT
      medicaid_id, legacy_id, state_id, region, suffix, region_rank, creatd_dt,
      ROW_NUMBER() OVER (PARTITION BY medicaid_id ORDER BY region_rank, legacy_id) AS rn
    FROM enriched
    ORDER BY medicaid_id, region_rank, legacy_id
    """
).fetchall()

ngroups = len({r[0] for r in rows})
print(f"orphan-pending duplicate groups: {ngroups}; member rows: {len(rows)}\n")
cur = None
for medicaid_id, legacy_id, state_id, region, suffix, region_rank, creatd, rn in rows:
    if medicaid_id != cur:
        cur = medicaid_id
        print(f"== {medicaid_id} ==")
    verdict = "WINNER (loads)" if rn == 1 else "held back"
    why = "region match" if region_rank == 0 else "region MISMATCH"
    print(
        f"  pendg_demo_id={legacy_id:<6} state={state_id} region={region} "
        f"suffix=/{suffix} [{why}] -> {verdict}  created={creatd}"
    )
