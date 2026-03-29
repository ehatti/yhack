-- Add meetups table to track which matches have scheduled meetups
-- This table only records that a meetup was scheduled; all details (time, location, etc)
-- are managed in Google Calendar

CREATE TABLE IF NOT EXISTS meetups (
    match_user_id_1 TEXT NOT NULL,
    match_user_id_2 TEXT NOT NULL,
    scheduled_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (match_user_id_1, match_user_id_2),
    FOREIGN KEY (match_user_id_1, match_user_id_2) REFERENCES matches(user_id_1, user_id_2) ON DELETE CASCADE
);

-- Index for querying meetups by user
CREATE INDEX IF NOT EXISTS idx_meetups_user1 ON meetups(match_user_id_1);
CREATE INDEX IF NOT EXISTS idx_meetups_user2 ON meetups(match_user_id_2);
