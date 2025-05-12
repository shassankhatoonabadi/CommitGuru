-- Enable UUID support
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'developer', 'viewer')) DEFAULT 'viewer',
    
    -- GitHub-specific fields
    github_id TEXT UNIQUE,
    github_username TEXT,
    github_access_token TEXT, -- encrypted before stored
    github_avatar_url TEXT
);

CREATE TABLE repositories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    url TEXT NOT NULL UNIQUE,
    local_path TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE commits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
    hash VARCHAR(50) UNIQUE NOT NULL,
    author_name VARCHAR(100),
    author_email VARCHAR(100),
    authored_date TIMESTAMP,
    committer_name VARCHAR(100),
    committer_email VARCHAR(100),
    committed_date TIMESTAMP,
    message TEXT,
    classification TEXT,  -- "fix", "feature"
    is_merge BOOLEAN DEFAULT FALSE,
    linked BOOLEAN DEFAULT FALSE,
    contains_bug BOOLEAN DEFAULT FALSE,
    fixes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    commit_id UUID REFERENCES commits(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    score INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commit_id UUID REFERENCES commits(id) ON DELETE CASCADE,
    ns FLOAT DEFAULT 0,
    nd FLOAT DEFAULT 0,
    nf FLOAT DEFAULT 0,
    entropy FLOAT DEFAULT 0,
    la FLOAT DEFAULT 0,
    ld FLOAT DEFAULT 0,
    lt FLOAT DEFAULT 0,
    ndev FLOAT DEFAULT 0,
    age FLOAT DEFAULT 0,
    nuc FLOAT DEFAULT 0,
    exp FLOAT DEFAULT 0,
    rexp FLOAT DEFAULT 0,
    sexp FLOAT DEFAULT 0,
    glm_probability FLOAT DEFAULT 0,
    hot_files TEXT[],
    computed_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE glm_coefficients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
    model_version TEXT NOT NULL,
    feature_name TEXT NOT NULL,
    coefficient_value FLOAT NOT NULL,
    p_value FLOAT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(repository_id, model_version, feature_name)
);
