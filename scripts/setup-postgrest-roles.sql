-- Setup PostgREST roles and permissions
BEGIN;

-- Create anonymous role if it doesn't exist
DO $$ BEGIN
    CREATE ROLE anon;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Grant basic permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Grant specific table permissions
GRANT SELECT ON users TO anon;
GRANT SELECT ON accommodations TO anon;
GRANT SELECT ON providers TO anon;
GRANT SELECT ON students TO anon;
GRANT SELECT ON bookings TO anon;
GRANT SELECT ON reviews TO anon;

-- Grant INSERT permissions for public data
GRANT INSERT ON reviews TO anon;
GRANT INSERT ON bookings TO anon;

-- Grant UPDATE permissions for user data
GRANT UPDATE ON users TO anon;
GRANT UPDATE ON students TO anon;
GRANT UPDATE ON providers TO anon;

COMMIT;
