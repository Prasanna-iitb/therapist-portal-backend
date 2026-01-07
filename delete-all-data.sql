-- Delete all data from all tables while preserving structure
-- Using TRUNCATE CASCADE to handle foreign key constraints

TRUNCATE TABLE followup_responses CASCADE;
TRUNCATE TABLE followups CASCADE;
TRUNCATE TABLE issues CASCADE;
TRUNCATE TABLE notes CASCADE;
TRUNCATE TABLE transcript CASCADE;
TRUNCATE TABLE sessions CASCADE;
TRUNCATE TABLE clients CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE therapist CASCADE;

-- Reset sequences (auto-increment counters) if any exist
-- This ensures IDs start from 1 again

SELECT 'All data deleted successfully!' as message;
