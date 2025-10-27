// These values are pre-defined by CMS for our usage. The tag should be
// AWS_Backup with one of the following values
export const backupTags = {
  /**
   * Daily backups kept for 15 days, weekly backups kept for 90 days
   */
  d15_w90: "d15_w90",
  /**
   * Backups every 4 hours kept for 7 days, weekly backups kept for 90 days
   */
  "4hr7_w90": "4hr7_w90",
  /**
   * Backups every 4 hours kept for 1 day, daily backups kept for 7 days,
   * weekly backups kept for 30 days, monthly backups kept for 90 days
   */
  "4hr1_d7_w35_m90": "4hr1_d7_w35_m90",
  /**
   * Daily backups kept for 90 days
   */
  d90: "d90",
  /**
   * Daily backups kept for 15 days, weekly backups kept for 90 days, monthly
   * backups kept for one year
   */
  d15_w90_m365: "d15_w90_m365",
  /**
   * Daily backups kept for 15 days, weekly backups kept for 90 days, monthly
   * backups kept for 1 year, yearly backups kept for 2 years
   */
  d15_w90_m365_y730: "d15_w90_m365_y730",
  /**
   * Signifies that a resource is intentionally not backed up (mainly for EC2
   * usage)
   */
  no_backup: "no_backup",
};
