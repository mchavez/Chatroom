CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
);

-- Demo users - bcrypt hashes for:
-- alice / password123
-- miguel / password123
INSERT INTO users (username, password_hash) VALUES
('alice','$2a$10$7YFtRWWAoF14aDN/CYXGOeQcV48.6or9jQKAJ7drrAJ6Ov4Hy9DTS'),
('miguel','$2a$10$7YFtRWWAoF14aDN/CYXGOeQcV48.6or9jQKAJ7drrAJ6Ov4Hy9DTS')
ON CONFLICT DO NOTHING;
