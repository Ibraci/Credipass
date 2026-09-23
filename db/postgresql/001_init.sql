-- CREDIPASS R19.3.2 — Schéma PostgreSQL central
-- Les terminaux restent IndexedDB/offline. Ce schéma concerne uniquement le serveur central.

CREATE TABLE IF NOT EXISTS users (
  login TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  role TEXT NOT NULL,
  name TEXT NOT NULL,
  agency TEXT NOT NULL,
  scope_mode TEXT NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  login TEXT NOT NULL REFERENCES users(login) ON DELETE CASCADE,
  expires_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS sync_events (
  id TEXT PRIMARY KEY,
  login TEXT NOT NULL,
  event_type TEXT NOT NULL,
  entity_id TEXT,
  detail_json JSONB,
  created_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sync_events_entity ON sync_events(entity_id);
CREATE INDEX IF NOT EXISTS idx_sync_events_created ON sync_events(created_at DESC);

CREATE TABLE IF NOT EXISTS institution_state (
  id SMALLINT PRIMARY KEY CHECK(id=1),
  state_json JSONB NOT NULL,
  version BIGINT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  updated_by TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ocr_audit (
  id TEXT PRIMARY KEY,
  login TEXT NOT NULL,
  filename TEXT NOT NULL,
  engine TEXT NOT NULL,
  confidence DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_entity_versions (
  entity_id TEXT PRIMARY KEY,
  version BIGINT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  updated_by TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_conflicts (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  login TEXT NOT NULL,
  base_version BIGINT NOT NULL,
  central_version BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  resolution TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_login_open ON sync_conflicts(login,resolution,created_at DESC);

CREATE TABLE IF NOT EXISTS node_registry (
  node_id TEXT PRIMARY KEY,
  login TEXT NOT NULL,
  institution_id TEXT,
  structure_id TEXT,
  last_seen_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_audit (
  id TEXT PRIMARY KEY,
  login TEXT NOT NULL,
  dossier_id TEXT,
  mode TEXT NOT NULL,
  provider TEXT,
  question TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);
