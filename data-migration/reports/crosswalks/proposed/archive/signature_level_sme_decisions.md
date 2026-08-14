# SME decisions: signature_level on approved demonstrations (F1) -- RESOLVED

Surfaced by the dress-rehearsal probe (2026-06-30) against the IMPL
snapshot at sql/04_crosswalks/31_signature_level_check.sql clause (c).

## Resolution (RED-1 + RED-3)

**Disposition: blanket option (a) -- migrate as 'OA'.** Per the RED-1 SME
decision, an approved PMDA demonstration on legacy signature code 0
("-- Please Select --") is an accepted case, not a data-quality RED:
sql/04_crosswalks/30_signature_level.sql flags code 0 `null_ok=true` so
clause (c) exempts it, and the demonstration loader
(sql/20_app/30_demonstration.sql) hardcodes `signature_level_id = 'OA'`
for every demonstration (the DEMOS demonstration_signature_level_check
forces 'OA'). So all 127 rows below migrate as 'OA'; none is dropped.

The 127 ids were only a **rehearsal deferral** in
reports/filter/drop_ids.csv while the decision was pending. That deferral
is now removed (RED-3): the drop-list is header-only, and a guard test
(tests/test_filter_overrides.py) prevents the deferral from returning.
The per-row table below is retained only as an audit record; no further
per-demonstration action is required.

## Problem

127 in-migration-scope demonstrations (not soft-deleted, valid CMS
project number, currently kept by the filter) are APPROVED-equivalent
(status 2/4/5/6/7) yet carry legacy signature code 0 ("-- Please
Select --"), which maps to NULL. DEMOS forbids a NULL signature on an
approved demonstration, so they cannot load as-is.

The check originally counted 1512 such rows; 776 are soft-deleted and
609 fail the demonstration format filter (both dropped by the loader),
leaving these 127 as the true exposure.

## Decision needed (per demonstration, or a blanket rule)

For each row choose one: (a) assign a real signature level (OA / OCD /
OGD); (b) confirm it should be excluded from migration; (c) fix the
signature in the source and re-snapshot. **Resolved: blanket (a) 'OA'**
(see the Resolution section above); the drop_ids.csv deferral has been
removed.

| # | mdcd_demo_id | project_number | legacy_status | state | decision (OA/OCD/OGD/EXCLUDE/SOURCE-FIX) | SME | notes |
|---|--------------|----------------|---------------|-------|------------------------------------------|-----|-------|
| 1 | 2965 | 11-W-00306/4 | Expired | KY |  |  |  |
| 2 | 2794 | 11-W-00307/3 | Approved | WV |  |  |  |
| 3 | 2940 | 11-W-00316/5 | Approved | IL |  |  |  |
| 4 | 2945 | 11-W-00321/1 | Approved | NH |  |  |  |
| 5 | 2718 | 11-W-00322/1 | Approved | NH |  |  |  |
| 6 | 2789 | 11-W-00323/5 | Approved | OH |  |  |  |
| 7 | 2721 | 11-W-00325/1 | Approved | NH |  |  |  |
| 8 | 2722 | 11-W-00326/4 | Approved | AL |  |  |  |
| 9 | 2726 | 11-W-00330/4 | Approved | AL |  |  |  |
| 10 | 2824 | 11-W-00334/4 | Approved | SC |  |  |  |
| 11 | 2775 | 11-W-00335/4 | Approved | SC |  |  |  |
| 12 | 3603 | 11-W-00337/8 | Approved | WY |  |  |  |
| 13 | 2770 | 11-W-00339/10 | Approved | ID |  |  |  |
| 14 | 6569 | 11-W-00339/4 | Approved | KY |  |  |  |
| 15 | 3185 | 11-W-00340/9 | Approved | AZ |  |  |  |
| 16 | 3319 | 11-W-00341/1 | Approved | NH |  |  |  |
| 17 | 3162 | 11-W-00341/5 | Approved | IL |  |  |  |
| 18 | 3239 | 11-W-00342/1 | Approved | NH |  |  |  |
| 19 | 3148 | 11-W-00344/8 | Approved | WY |  |  |  |
| 20 | 5563 | 11-W-00345/4 | Approved | AL |  |  |  |
| 21 | 2819 | 11-W-00350/4 | Expired | NC |  |  |  |
| 22 | 6581 | 11-W-00350/4 | Expired | AL |  |  |  |
| 23 | 3208 | 11-W-00355/9 | Approved | NV |  |  |  |
| 24 | 3146 | 11-W-00357/4 | Approved | AL |  |  |  |
| 25 | 4395 | 11-W-00358/9 | Approved | AZ |  |  |  |
| 26 | 3816 | 11-W-00359/9 | Approved | AZ |  |  |  |
| 27 | 3015 | 11-W-00363/6 | Approved | OK |  |  |  |
| 28 | 6400 | 11-W-00364/4 | Approved | AL |  |  |  |
| 29 | 3288 | 11-W-00365/1 | Approved | NH |  |  |  |
| 30 | 5565 | 11-W-00366/9 | Approved | AZ |  |  |  |
| 31 | 6278 | 11-W-00369/9 | Approved | AZ |  |  |  |
| 32 | 5620 | 11-W-00370/9 | Approved | AZ |  |  |  |
| 33 | 5623 | 11-W-00371/9 | Approved | AZ |  |  |  |
| 34 | 4344 | 11-W-00372/9 | Approved | AZ |  |  |  |
| 35 | 3161 | 11-W-00374/9 | Approved | NV |  |  |  |
| 36 | 3160 | 11-W-00375/9 | Approved | NV |  |  |  |
| 37 | 3159 | 11-W-00376/9 | Approved | NV |  |  |  |
| 38 | 3221 | 11-W-00377/1 | Approved | NH |  |  |  |
| 39 | 3237 | 11-W-00378/1 | Approved | NH |  |  |  |
| 40 | 3158 | 11-W-00382/9 | Approved | NV |  |  |  |
| 41 | 3157 | 11-W-00383/9 | Approved | NV |  |  |  |
| 42 | 5625 | 11-W-00404/9 | Approved | AZ |  |  |  |
| 43 | 3156 | 11-W-00405/9 | Approved | NV |  |  |  |
| 44 | 3164 | 11-W-00408/9 | Approved | AZ |  |  |  |
| 45 | 3166 | 11-W-00409/9 | Approved | NV |  |  |  |
| 46 | 3167 | 11-W-00410/9 | Approved | NV |  |  |  |
| 47 | 3168 | 11-W-00411/7 | Approved | IA |  |  |  |
| 48 | 3320 | 11-W-00413/10 | Approved | AK |  |  |  |
| 49 | 3175 | 11-W-00420/10 | Approved | AK |  |  |  |
| 50 | 3216 | 11-W-00421/4 | Approved | AL |  |  |  |
| 51 | 3248 | 11-W-00423/10 | Approved | OR |  |  |  |
| 52 | 3186 | 11-W-00430/9 | Approved | NV |  |  |  |
| 53 | 3183 | 11-W-00433/7 | Expired | IA |  |  |  |
| 54 | 3189 | 11-W-00438/3 | Approved | DE |  |  |  |
| 55 | 3207 | 11-W-00474/9 | Approved | NV |  |  |  |
| 56 | 3206 | 11-W-00476/10 | Approved | AK |  |  |  |
| 57 | 3210 | 11-W-00477/7 | Approved | KS |  |  |  |
| 58 | 3212 | 11-W-00480/10 | Approved | AK |  |  |  |
| 59 | 3213 | 11-W-00482/9 | Approved | AZ |  |  |  |
| 60 | 3214 | 11-W-00483/9 | Approved | AZ |  |  |  |
| 61 | 3215 | 11-W-00484/9 | Approved | AZ |  |  |  |
| 62 | 3217 | 11-W-00485/5 | Approved | WI |  |  |  |
| 63 | 5568 | 11-W-00490/9 | Approved | AZ |  |  |  |
| 64 | 5566 | 11-W-00492/9 | Approved | AZ |  |  |  |
| 65 | 3223 | 11-W-00497/7 | Approved | IA |  |  |  |
| 66 | 4976 | 11-W-00498/1 | Approved | CT |  |  |  |
| 67 | 3224 | 11-W-00499/7 | Approved | IA |  |  |  |
| 68 | 3227 | 11-W-00508/9 | Approved | NV |  |  |  |
| 69 | 3229 | 11-W-00510/9 | Approved | NV |  |  |  |
| 70 | 3231 | 11-W-00512/10 | Approved | AK |  |  |  |
| 71 | 3241 | 11-W-00519/6 | Approved | TX |  |  |  |
| 72 | 3246 | 11-W-00525/9 | Approved | NV |  |  |  |
| 73 | 3262 | 11-W-00546/9 | Expired | HI |  |  |  |
| 74 | 3261 | 11-W-00546/9 | Approved | HI |  |  |  |
| 75 | 3274 | 11-W-00562/9 | Approved | HI |  |  |  |
| 76 | 3275 | 11-W-00564/9 | Approved | HI |  |  |  |
| 77 | 3277 | 11-W-00565/9 | Approved | NV |  |  |  |
| 78 | 3280 | 11-W-00568/4 | Approved | FL |  |  |  |
| 79 | 3293 | 11-W-00578/5 | Approved | IL |  |  |  |
| 80 | 3295 | 11-W-00580/4 | Approved | SC |  |  |  |
| 81 | 6273 | 11-W-00593/4 | Approved | GA |  |  |  |
| 82 | 3318 | 11-W-00603/4 | Approved | AL |  |  |  |
| 83 | 3324 | 11-W-00606/2 | Approved | NY |  |  |  |
| 84 | 3350 | 11-W-00631/5 | Approved | WI |  |  |  |
| 85 | 3351 | 11-W-00632/3 | Approved | VA |  |  |  |
| 86 | 3354 | 11-W-00635/3 | Approved | VA |  |  |  |
| 87 | 3356 | 11-W-00638/4 | Approved | AL |  |  |  |
| 88 | 3357 | 11-W-00639/4 | Approved | AL |  |  |  |
| 89 | 3358 | 11-W-00640/4 | Approved | AL |  |  |  |
| 90 | 3361 | 11-W-00644/4 | Approved | AL |  |  |  |
| 91 | 3363 | 11-W-00645/4 | Approved | AL |  |  |  |
| 92 | 3364 | 11-W-00647/6 | Approved | TX |  |  |  |
| 93 | 3365 | 11-W-00648/10 | Approved | OR |  |  |  |
| 94 | 3366 | 11-W-00649/4 | Approved | AL |  |  |  |
| 95 | 3367 | 11-W-00650/10 | Approved | AK |  |  |  |
| 96 | 3374 | 11-W-00659/9 | Approved | AZ |  |  |  |
| 97 | 3376 | 11-W-00663/3 | Approved | MD |  |  |  |
| 98 | 3377 | 11-W-00664/9 | Approved | NV |  |  |  |
| 99 | 3378 | 11-W-00665/10 | Expired | AK |  |  |  |
| 100 | 4006 | 11-W-00667/4 | Approved | AL |  |  |  |
| 101 | 3380 | 11-W-00668/10 | Approved | AK |  |  |  |
| 102 | 5567 | 11-W-00669/9 | Approved | AZ |  |  |  |
| 103 | 3382 | 11-W-00671/10 | Approved | AK |  |  |  |
| 104 | 3384 | 11-W-00677/7 | Approved | IA |  |  |  |
| 105 | 3385 | 11-W-00681/10 | Approved | AK |  |  |  |
| 106 | 5621 | 11-W-00688/9 | Approved | AZ |  |  |  |
| 107 | 3394 | 11-W-00693/5 | Approved | WI |  |  |  |
| 108 | 3398 | 11-W-00712/5 | Approved | WI |  |  |  |
| 109 | 3401 | 11-W-00714/3 | Approved | MD |  |  |  |
| 110 | 3402 | 11-W-00716/7 | Approved | IA |  |  |  |
| 111 | 3404 | 11-W-00718/9 | Approved | AZ |  |  |  |
| 112 | 3411 | 11-W-00747/5 | Approved | WI |  |  |  |
| 113 | 3414 | 11-W-00751/4 | Approved | MS |  |  |  |
| 114 | 3417 | 11-W-00762/1 | Approved | ME |  |  |  |
| 115 | 3419 | 11-W-00764/9 | Approved | HI |  |  |  |
| 116 | 3424 | 11-W-00769/9 | Approved | HI |  |  |  |
| 117 | 3427 | 11-W-00772/3 | Approved | MD |  |  |  |
| 118 | 3428 | 11-W-00773/3 | Approved | MD |  |  |  |
| 119 | 3429 | 11-W-00774/3 | Approved | MD |  |  |  |
| 120 | 3432 | 11-W-00778/9 | Approved | NV |  |  |  |
| 121 | 5564 | 11-W-00786/4 | Approved | AL |  |  |  |
| 122 | 3458 | 11-W-00809/5 | Approved | WI |  |  |  |
| 123 | 3535 | 11-W-00887/3 | Approved | VA |  |  |  |
| 124 | 3536 | 11-W-00888/3 | Approved | VA |  |  |  |
| 125 | 3537 | 11-W-00889/3 | Approved | VA |  |  |  |
| 126 | 3538 | 11-W-00890/3 | Approved | VA |  |  |  |
| 127 | 3554 | 11-W-00906/10 | Approved | AK |  |  |  |
