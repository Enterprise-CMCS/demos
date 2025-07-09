It might be best to limit the size of possible payloads in our event table since
this table will only ever get larger and will have many many inserts.
Here are the calculations for different maximum payload sizes (assuming 1 byte per character for basic ASCII/UTF-8)

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