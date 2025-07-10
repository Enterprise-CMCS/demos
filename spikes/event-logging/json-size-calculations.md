It might be best to limit the size of possible payloads in our event table since this table will only ever get larger and will have many many inserts.
Here are the calculations for different maximum payload sizes (assuming 1 byte per character for basic ASCII/UTF-8).

It seems like 4KB might be a nice sweet spot allowing for a pretty descriptive fieldset while being quite kind to our memory. A lot of these records shouldn't hit this at all, but it could in the case we want to store something like a user agent.

## 64KB Limit
- **Characters**: ~65,536 characters 
- **Records per GB**: ~16,384 records

## 16KB Limit
- **Characters**: ~16,384 characters
- **Records per GB**: ~65,536 records

## 4KB Limit - Seems like the sweet spot
- **Characters**: ~4,096 characters
- **Records per GB**: ~262,144 records

## 1KB Limit
- **Characters**: ~1,024 characters
- **Records per GB**: ~1,048,576 records (1M+ records)

## Regarding the usage of JSON / JSONB within postgres:

Postgres is going to store different sized fields differently:

Small objects (< 2KB): Stored inline with the row
Large objects (> 2KB): Automatically moved to TOAST tables

Mixed sizes cause fragmented storage patterns across main table and TOAST storage, slowing down queries.

Can add a constraint of a particular size to keep fields under a certain size

```
ALTER TABLE event 
ADD CONSTRAINT event_data  CHECK (octet_length(payload::text) <= 2048);
-- or 4096, 8192, etc
```