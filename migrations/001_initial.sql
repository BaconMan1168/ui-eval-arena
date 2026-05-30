CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS submissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  screenshot_url TEXT NOT NULL,
  session_hash  TEXT NOT NULL,
  timestamp     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  model_name    TEXT NOT NULL,
  html_output   TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ratings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id     UUID NOT NULL REFERENCES generations(id) ON DELETE CASCADE,
  star_rating       NUMERIC(3,1) NOT NULL CHECK (star_rating >= 0.5 AND star_rating <= 5.0 AND star_rating * 2 = FLOOR(star_rating * 2)),
  rater_session_hash TEXT NOT NULL,
  timestamp         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
