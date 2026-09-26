CREATE TABLE IF NOT EXISTS analytics_daily (
  visit_date TEXT NOT NULL,
  page TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  unique_visitors INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (visit_date, page)
);

CREATE TABLE IF NOT EXISTS analytics_visitors (
  visit_date TEXT NOT NULL,
  page TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  PRIMARY KEY (visit_date, page, visitor_hash)
);

CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON analytics_daily(visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_visitors_date ON analytics_visitors(visit_date);
