CREATE TABLE research_answers (key TEXT PRIMARY KEY, payload TEXT NOT NULL, created TEXT NOT NULL, expires INTEGER NOT NULL);
--> statement-breakpoint
CREATE TABLE research_history (owner_id TEXT NOT NULL, answer_key TEXT NOT NULL, company TEXT NOT NULL, question TEXT NOT NULL, created TEXT NOT NULL, viewed TEXT NOT NULL, PRIMARY KEY(owner_id, answer_key));
--> statement-breakpoint
CREATE INDEX research_history_owner_viewed ON research_history(owner_id, viewed);
