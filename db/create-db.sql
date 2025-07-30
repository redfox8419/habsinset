-- Prompt Library Database Schema for SQLite
-- This schema is designed to be extensible for future website features

-- Categories table (for subject areas and prompt types)
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK(type IN ('subject', 'purpose', 'grade_level')),
    description TEXT,
    icon TEXT, -- Font Awesome icon class
    color TEXT, -- Hex color for UI
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table (for future authentication)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    school TEXT,
    department TEXT,
    role TEXT DEFAULT 'teacher' CHECK(role IN ('teacher', 'admin', 'moderator')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prompts table (main content)
CREATE TABLE IF NOT EXISTS prompts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    prompt_text TEXT NOT NULL,
    user_id INTEGER,
    time_saved TEXT, -- e.g., "15 mins", "1 hour"
    difficulty_level TEXT CHECK(difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    ai_tool TEXT, -- e.g., "ChatGPT", "Claude", "Any"
    example_output TEXT,
    tips TEXT,
    status TEXT DEFAULT 'approved' CHECK(status IN ('pending', 'approved', 'rejected', 'deleted')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Junction table for many-to-many relationship between prompts and categories
CREATE TABLE IF NOT EXISTS prompt_categories (
    prompt_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    PRIMARY KEY (prompt_id, category_id),
    FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Ratings table (for future implementation)
CREATE TABLE IF NOT EXISTS ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(prompt_id, user_id)
);

-- Track prompt usage (views, copies, etc.)
CREATE TABLE IF NOT EXISTS prompt_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt_id INTEGER NOT NULL,
    user_id INTEGER,
    action TEXT NOT NULL CHECK(action IN ('view', 'copy', 'use')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tags table for flexible categorization
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Junction table for prompts and tags
CREATE TABLE IF NOT EXISTS prompt_tags (
    prompt_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (prompt_id, tag_id),
    FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Favorites table (for future user features)
CREATE TABLE IF NOT EXISTS favorites (
    user_id INTEGER NOT NULL,
    prompt_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, prompt_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prompts_status ON prompts(status);
CREATE INDEX IF NOT EXISTS idx_prompts_created ON prompts(created_at);
CREATE INDEX IF NOT EXISTS idx_prompt_categories_prompt ON prompt_categories(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_categories_category ON prompt_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_ratings_prompt ON ratings(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_usage_prompt ON prompt_usage(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_usage_action ON prompt_usage(action);
CREATE INDEX IF NOT EXISTS idx_prompt_tags_prompt ON prompt_tags(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_tags_tag ON prompt_tags(tag_id);
