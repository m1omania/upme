-- Add balance column to users table
ALTER TABLE users ADD COLUMN balance INTEGER DEFAULT 10;

-- Set default balance for existing users
UPDATE users SET balance = 10 WHERE balance IS NULL;


