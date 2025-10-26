-- User Sessions Table
-- This table stores active user sessions for authentication and authorization
-- It is referenced by lib/auth-server.ts for session management

CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at ON user_sessions(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_user_sessions_updated_at 
BEFORE UPDATE ON user_sessions 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE user_sessions IS 'Stores active user sessions with JWT tokens for authentication';
COMMENT ON COLUMN user_sessions.id IS 'Session ID from JWT token';
COMMENT ON COLUMN user_sessions.user_id IS 'User ID associated with this session';
COMMENT ON COLUMN user_sessions.expires_at IS 'Expiration timestamp for the session';

