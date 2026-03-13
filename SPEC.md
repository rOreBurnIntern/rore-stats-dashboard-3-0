# rore-stats SQLite Storage Feature

## Overview
Add SQLite database to store historical rounds for faster loads and historical queries.

## Requirements

### 1. Database Schema
- Table: `rounds` with columns:
  - id (INTEGER PRIMARY KEY)
  - round_id (INTEGER UNIQUE)
  - block (TEXT)
  - winner_take_all (BOOLEAN)
  - ore_winner (TEXT)
  - motherlode (TEXT)
  - motherlode_hit (BOOLEAN)
  - timestamp (INTEGER)
  - created_at (DATETIME DEFAULT CURRENT_TIMESTAMP)

### 2. Sync Script
- Fetch all available rounds from api.rore.supply (paginate to get all)
- Insert/update rounds in SQLite
- Track last sync time
- Run as standalone script: `node sync.js`

### 3. API Integration
- First check local SQLite for data
- If stale (>5 min) or missing, fetch fresh from API
- Return cached data for faster response times
- Add cache headers

### 4. Local Development
- Database file: `data/rore.db`
- Add to .gitignore

## Test Conditions
- [ ] sync.js runs and populates database
- [ ] API returns cached data within 100ms
- [ ] All existing functionality works (charts, stats)
