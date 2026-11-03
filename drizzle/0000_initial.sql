CREATE TABLE documents (id TEXT PRIMARY KEY, company TEXT NOT NULL, url TEXT NOT NULL, hash TEXT NOT NULL UNIQUE, kind TEXT NOT NULL, published TEXT, fetched TEXT NOT NULL, payload TEXT NOT NULL);
--> statement-breakpoint
CREATE TABLE cache (key TEXT PRIMARY KEY, payload TEXT NOT NULL, expires INTEGER NOT NULL);
--> statement-breakpoint
CREATE TABLE runs (id TEXT PRIMARY KEY, company TEXT, operation TEXT NOT NULL, status TEXT NOT NULL, duration_ms INTEGER, created TEXT NOT NULL, details TEXT);
--> statement-breakpoint
CREATE TABLE facts (id TEXT PRIMARY KEY, company TEXT NOT NULL, metric TEXT NOT NULL, source_id TEXT NOT NULL, payload TEXT NOT NULL);
--> statement-breakpoint
CREATE TABLE events (id TEXT PRIMARY KEY, company TEXT NOT NULL, published TEXT NOT NULL, payload TEXT NOT NULL);
