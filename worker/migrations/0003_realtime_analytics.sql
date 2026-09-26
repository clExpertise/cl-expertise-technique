CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visited_at TEXT NOT NULL,
  page TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'Direct',
  device TEXT NOT NULL DEFAULT 'Ordinateur',
  country TEXT NOT NULL DEFAULT '—'
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_time ON analytics_events(visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_page ON analytics_events(page, visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_visitor ON analytics_events(visitor_hash, visited_at DESC);
