-- KANGAYATH WEB — Database Initialization Script
-- Executed on container creation when postgres data directory is empty

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Timezone setup
SET timezone = 'UTC';
