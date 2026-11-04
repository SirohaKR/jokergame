-- PostgreSQL logical schema v0.1. DESIGN ONLY: not connected to the local prototype.
-- Amounts are integers; all timestamps are UTC timestamptz. Apply transactionally.
BEGIN;
CREATE TABLE users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 nickname varchar(16) NOT NULL CHECK(char_length(trim(nickname)) BETWEEN 1 AND 16),
 account_status varchar(16) NOT NULL DEFAULT 'active' CHECK(account_status IN ('active','suspended','deleted')),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE identities (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id),
 provider varchar(32) NOT NULL, provider_subject varchar(255) NOT NULL,
 UNIQUE(provider,provider_subject), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX identities_user_idx ON identities(user_id);
CREATE TABLE refresh_sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id),
 token_hash bytea NOT NULL UNIQUE, expires_at timestamptz NOT NULL, revoked_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX refresh_sessions_user_idx ON refresh_sessions(user_id,expires_at);
CREATE TABLE characters (
 id varchar(32) PRIMARY KEY, display_name varchar(64) NOT NULL, standing_asset text NOT NULL,
 portrait_settings jsonb NOT NULL DEFAULT '{}', sort_order smallint NOT NULL DEFAULT 0,
 is_available boolean NOT NULL DEFAULT true, content_version integer NOT NULL DEFAULT 1 CHECK(content_version>0)
);
CREATE TABLE cosmetics (
 id varchar(64) PRIMARY KEY, character_id varchar(32) NOT NULL REFERENCES characters(id),
 kind varchar(12) NOT NULL CHECK(kind IN ('skin','emote')), display_name varchar(64) NOT NULL,
 asset_path text NOT NULL, affinity_required integer NOT NULL DEFAULT 0 CHECK(affinity_required>=0),
 UNIQUE(id,character_id)
);
CREATE TABLE user_characters (
 user_id uuid NOT NULL REFERENCES users(id), character_id varchar(32) NOT NULL REFERENCES characters(id),
 affinity integer NOT NULL DEFAULT 0 CHECK(affinity>=0), unlocked_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,character_id)
);
CREATE TABLE user_cosmetics (
 user_id uuid NOT NULL, cosmetic_id varchar(64) NOT NULL, character_id varchar(32) NOT NULL,
 obtained_at timestamptz NOT NULL DEFAULT now(), source varchar(20) NOT NULL,
 PRIMARY KEY(user_id,cosmetic_id), FOREIGN KEY(user_id,character_id) REFERENCES user_characters(user_id,character_id),
 FOREIGN KEY(cosmetic_id,character_id) REFERENCES cosmetics(id,character_id)
);
CREATE TABLE user_equipment (
 user_id uuid NOT NULL, character_id varchar(32) NOT NULL, skin_id varchar(64),
 PRIMARY KEY(user_id,character_id), FOREIGN KEY(user_id,character_id) REFERENCES user_characters(user_id,character_id),
 FOREIGN KEY(user_id,skin_id) REFERENCES user_cosmetics(user_id,cosmetic_id),
 FOREIGN KEY(skin_id,character_id) REFERENCES cosmetics(id,character_id)
 -- Application transaction must also check cosmetics.kind = 'skin'.
);
CREATE TABLE user_settings (
 user_id uuid PRIMARY KEY REFERENCES users(id), selected_character_id varchar(32),
 bgm_volume smallint NOT NULL DEFAULT 50 CHECK(bgm_volume BETWEEN 0 AND 100),
 sfx_volume smallint NOT NULL DEFAULT 70 CHECK(sfx_volume BETWEEN 0 AND 100),
 turn_sound boolean NOT NULL DEFAULT true, updated_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(user_id,selected_character_id) REFERENCES user_characters(user_id,character_id)
);
CREATE TABLE wallets (
 user_id uuid PRIMARY KEY REFERENCES users(id), coins bigint NOT NULL DEFAULT 0 CHECK(coins>=0),
 rank_points integer NOT NULL DEFAULT 0 CHECK(rank_points>=0), version bigint NOT NULL DEFAULT 0
);
CREATE TABLE matches (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), host_user_id uuid NOT NULL REFERENCES users(id),
 invite_code varchar(12) NOT NULL UNIQUE,
 mode varchar(16) NOT NULL CHECK(mode IN ('private','ranked')),
 status varchar(16) NOT NULL DEFAULT 'lobby' CHECK(status IN ('lobby','playing','finished','cancelled')),
 planned_sets smallint NOT NULL CHECK(planned_sets BETWEEN 1 AND 99),
 rules_version varchar(32) NOT NULL, reward_version varchar(32) NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), started_at timestamptz, finished_at timestamptz
);
CREATE INDEX matches_status_created_idx ON matches(status,created_at DESC);
CREATE TABLE match_players (
 match_id uuid NOT NULL REFERENCES matches(id), seat smallint NOT NULL CHECK(seat BETWEEN 0 AND 3),
 user_id uuid REFERENCES users(id), character_id varchar(32) NOT NULL REFERENCES characters(id),
 nickname_snapshot varchar(64) NOT NULL, is_bot boolean NOT NULL DEFAULT false,
 total_score integer NOT NULL DEFAULT 0, final_place smallint CHECK(final_place BETWEEN 1 AND 4),
 joined_at timestamptz NOT NULL DEFAULT now(), left_at timestamptz,
 PRIMARY KEY(match_id,seat), UNIQUE(match_id,user_id), UNIQUE(match_id,final_place),
 CHECK((is_bot AND user_id IS NULL) OR (NOT is_bot AND user_id IS NOT NULL))
);
CREATE INDEX match_players_user_idx ON match_players(user_id,joined_at DESC);
CREATE TABLE game_sets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), match_id uuid NOT NULL REFERENCES matches(id),
 set_no smallint NOT NULL CHECK(set_no>0), status varchar(16) NOT NULL CHECK(status IN ('dealing','playing','finished','cancelled')),
 starting_seat smallint NOT NULL CHECK(starting_seat BETWEEN 0 AND 3),
 started_at timestamptz NOT NULL DEFAULT now(), finished_at timestamptz,
 UNIQUE(match_id,set_no), UNIQUE(id,match_id)
);
CREATE TABLE set_results (
 set_id uuid NOT NULL, match_id uuid NOT NULL, seat smallint NOT NULL,
 finish_order smallint NOT NULL CHECK(finish_order BETWEEN 1 AND 4),
 is_winner boolean NOT NULL, score integer NOT NULL,
 PRIMARY KEY(set_id,seat), UNIQUE(set_id,finish_order),
 FOREIGN KEY(set_id,match_id) REFERENCES game_sets(id,match_id),
 FOREIGN KEY(match_id,seat) REFERENCES match_players(match_id,seat),
 CHECK(is_winner=(finish_order<4)),
 CHECK(score=CASE finish_order WHEN 1 THEN 1000 WHEN 2 THEN 500 WHEN 3 THEN 0 ELSE -500 END)
);
CREATE TABLE set_snapshots (
 set_id uuid PRIMARY KEY REFERENCES game_sets(id), revision bigint NOT NULL CHECK(revision>=0),
 phase varchar(16) NOT NULL CHECK(phase IN ('action','select','reveal','discard','ended')),
 actor_seat smallint NOT NULL CHECK(actor_seat BETWEEN 0 AND 3),
 phase_deadline timestamptz, private_state jsonb NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
 -- SERVER ONLY: contains all hands, RNG state, ordered deck and pending draw.
);
CREATE TABLE set_events (
 set_id uuid NOT NULL REFERENCES game_sets(id), sequence bigint NOT NULL CHECK(sequence>0),
 event_type varchar(40) NOT NULL, payload jsonb NOT NULL,
 audience varchar(16) NOT NULL CHECK(audience IN ('public','participants','server')),
 audience_seats smallint[] NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(set_id,sequence)
 -- Do not return this raw table from any public API. Apply projection per viewer.
);
CREATE TABLE reward_grants (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), match_id uuid NOT NULL REFERENCES matches(id),
 user_id uuid NOT NULL REFERENCES users(id), coins_delta bigint NOT NULL CHECK(coins_delta>=0),
 rank_delta integer NOT NULL, affinity_delta integer NOT NULL CHECK(affinity_delta>=0),
 reward_version varchar(32) NOT NULL, granted_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(match_id,user_id)
);
CREATE TABLE wallet_ledger (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id),
 currency varchar(12) NOT NULL CHECK(currency IN ('coins','rank')),
 delta bigint NOT NULL, balance_after bigint NOT NULL CHECK(balance_after>=0),
 reason varchar(20) NOT NULL CHECK(reason IN ('match_reward','gift','adjustment')),
 reference_key varchar(128) NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id,currency,reference_key)
);
CREATE INDEX wallet_ledger_user_time_idx ON wallet_ledger(user_id,created_at DESC);
CREATE TABLE idempotency_keys (
 user_id uuid NOT NULL REFERENCES users(id), request_key uuid NOT NULL,
 route varchar(128) NOT NULL, request_hash bytea NOT NULL,
 response_status smallint NOT NULL CHECK(response_status BETWEEN 100 AND 599),
 response_body jsonb NOT NULL, expires_at timestamptz NOT NULL,
 PRIMARY KEY(user_id,request_key,route)
);
CREATE INDEX idempotency_expiry_idx ON idempotency_keys(expires_at);
COMMIT;
