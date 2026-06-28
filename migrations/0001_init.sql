-- Armored Focus — initial D1 schema (SPEC §5, §6, §8, §11).
--
-- Design notes:
--  * Auth-ready single-user model: every owned row carries `user_id`. v1 seeds
--    and uses one user with id 'default'. Adding auth later = add a sessions
--    table + scope queries to the session user; no reshape of these tables.
--  * Hybrid relational/JSON:
--      - Relational: cards, quests, quest_notes, card_notes, activity_log,
--        bonus_progress (rows that are queried/filtered/aggregated individually).
--      - JSON columns: the nested arrays that are always read/written whole
--        (cards.connections, and each side's lob[]/carriers[] + business scalars
--        packed into cards.client_meta / cards.business_meta), and the entire
--        editable Rules object stored as one blob per user (rules.data) because
--        the Rules screen replaces it wholesale.
--  * side.logs: NOT stored separately. activity_log is the single source of
--    truth for log entries. A row's `side` ('client'|'business') lets us
--    reconstruct per-side logs by filtering activity_log on card_id + side, while
--    the global dailyLog is every row for the user ordered by date.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL,
  exp   INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1
);

-- Entire editable Rules object as one JSON blob per user (replaced wholesale).
CREATE TABLE IF NOT EXISTS rules (
  user_id TEXT PRIMARY KEY,
  data    TEXT NOT NULL, -- JSON of the Rules object
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cards (
  id                 TEXT PRIMARY KEY,
  user_id            TEXT NOT NULL,
  primary_side       TEXT NOT NULL,          -- 'Client' | 'Business' | 'Standalone'
  name               TEXT NOT NULL DEFAULT '',
  address            TEXT NOT NULL DEFAULT '',
  mailing_address    TEXT NOT NULL DEFAULT '',
  phone              TEXT NOT NULL DEFAULT '',
  email              TEXT NOT NULL DEFAULT '',
  dob                TEXT NOT NULL DEFAULT '',
  license            TEXT NOT NULL DEFAULT '',
  residence_type     TEXT NOT NULL DEFAULT 'Homeowner',
  user_rating        INTEGER NOT NULL DEFAULT 0,
  relationship_score INTEGER NOT NULL DEFAULT 0,
  is_coi             INTEGER NOT NULL DEFAULT 0, -- boolean 0/1
  is_bni             INTEGER NOT NULL DEFAULT 0, -- boolean 0/1
  is_standalone      INTEGER NOT NULL DEFAULT 0, -- boolean 0/1
  connections        TEXT NOT NULL DEFAULT '{"referredBy":[],"referrals":[],"household":[]}', -- JSON
  client_meta        TEXT NOT NULL DEFAULT '{"lob":[],"carriers":[]}',                        -- JSON: { lob[], carriers[] }
  business_meta      TEXT NOT NULL DEFAULT '{"lob":[],"carriers":[]}',                        -- JSON: { businessName, phone, ein, established, occupancy, lob[], carriers[] }
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_cards_user ON cards(user_id);

CREATE TABLE IF NOT EXISTS quests (
  id              TEXT PRIMARY KEY,
  card_id         TEXT NOT NULL,
  side            TEXT NOT NULL,        -- 'client' | 'business'
  type            TEXT NOT NULL,
  base_exp        INTEGER NOT NULL DEFAULT 0,
  due_date        TEXT,                 -- ISO date or NULL
  status          TEXT NOT NULL,        -- 'Active' | 'Cooldown' | 'Completed' | 'Cancelled'
  tracked         INTEGER NOT NULL DEFAULT 0, -- boolean 0/1
  completed_date  TEXT,
  completion_type TEXT,
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_quests_card ON quests(card_id);

CREATE TABLE IF NOT EXISTS quest_notes (
  id       TEXT PRIMARY KEY,
  quest_id TEXT NOT NULL,
  text     TEXT NOT NULL DEFAULT '',
  date     TEXT NOT NULL,
  FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_quest_notes_quest ON quest_notes(quest_id);

-- Per-side card notes (the CardSide.notes array).
CREATE TABLE IF NOT EXISTS card_notes (
  id      TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  side    TEXT NOT NULL, -- 'client' | 'business'
  text    TEXT NOT NULL DEFAULT '',
  date    TEXT NOT NULL,
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_card_notes_card ON card_notes(card_id);

-- Single source of truth for log entries (global dailyLog + per-side logs).
CREATE TABLE IF NOT EXISTS activity_log (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  card_id     TEXT,            -- NULL for entries not tied to a card
  side        TEXT,            -- 'client' | 'business' | NULL
  client_name TEXT NOT NULL DEFAULT '',
  quest_type  TEXT NOT NULL DEFAULT '',
  exp         INTEGER NOT NULL DEFAULT 0,
  commission  REAL,
  date        TEXT NOT NULL,
  note        TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_date ON activity_log(user_id, date);
CREATE INDEX IF NOT EXISTS idx_activity_log_card ON activity_log(card_id);

CREATE TABLE IF NOT EXISTS bonus_progress (
  user_id  TEXT NOT NULL,
  bonus_id TEXT NOT NULL,
  current  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, bonus_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
