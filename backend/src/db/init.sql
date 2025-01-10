CREATE TABLE IF NOT EXISTS users (
    id text PRIMARY KEY,
    login text NOT NULL,
    display_name text NOT NULL,
    profile_image_url text NOT NULL,
    is_live boolean DEFAULT false,
    category text,
    title text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    id text PRIMARY KEY,
    request_id text,
    from_user_id text NOT NULL REFERENCES users(id),
    to_user_id text NOT NULL REFERENCES users(id),
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    read boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS requests (
    id text PRIMARY KEY,
    user_id text NOT NULL REFERENCES users(id),
    title text NOT NULL,
    description text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    language character varying(2)
);

CREATE TABLE IF NOT EXISTS request_categories (
    request_id text NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    category text NOT NULL,
    PRIMARY KEY (request_id, category)
); 