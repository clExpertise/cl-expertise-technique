CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_number TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  reference TEXT,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'NORMAL',
  status TEXT NOT NULL DEFAULT 'OPEN',
  summary TEXT NOT NULL,
  description TEXT NOT NULL,
  conversation TEXT NOT NULL DEFAULT '[]',
  email_sent INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tickets_number ON tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_tickets_status_date ON tickets(status, created_at DESC);

CREATE TABLE IF NOT EXISTS rate_limits (
  client_hash TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  bucket TEXT NOT NULL,
  requests INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY(client_hash, endpoint, bucket)
);
