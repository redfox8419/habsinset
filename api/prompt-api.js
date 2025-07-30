// prompt-api.js - Complete API for Prompt Library
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection
const dbPath = path.join(__dirname, '..', 'db', 'prompts.db');
const db = new sqlite3.Database(dbPath);

// Helper function to run queries with promises
const runQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
        });
    });
};

const getQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const allQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

// Routes

// Get all categories
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await allQuery('SELECT * FROM categories ORDER BY type, name');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all prompts with filters
app.get('/api/prompts', async (req, res) => {
    try {
        const { search, category, sort = 'newest' } = req.query;
        let sql = `
            SELECT p.*, 
                   GROUP_CONCAT(DISTINCT c.name) as category_names,
                   GROUP_CONCAT(DISTINCT c.id) as category_ids,
                   COUNT(DISTINCT pu.id) as usage_count,
                   AVG(r.rating) as avg_rating
            FROM prompts p
            LEFT JOIN prompt_categories pc ON p.id = pc.prompt_id
            LEFT JOIN categories c ON pc.category_id = c.id
            LEFT JOIN prompt_usage pu ON p.id = pu.prompt_id
            LEFT JOIN ratings r ON p.id = r.prompt_id
            WHERE p.status = 'approved'
        `;
        
        const params = [];
        
        if (search) {
            sql += ` AND (p.title LIKE ? OR p.description LIKE ? OR p.prompt_text LIKE ?)`;
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam);
        }
        
        if (category) {
            sql += ` AND c.id = ?`;
            params.push(category);
        }
        
        sql += ` GROUP BY p.id`;
        
        // Sorting
        switch(sort) {
            case 'popular':
                sql += ` ORDER BY usage_count DESC`;
                break;
            case 'rating':
                sql += ` ORDER BY avg_rating DESC`;
                break;
            case 'newest':
            default:
                sql += ` ORDER BY p.created_at DESC`;
        }
        
        const prompts = await allQuery(sql, params);
        res.json(prompts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single prompt
app.get('/api/prompts/:id', async (req, res) => {
    try {
        const prompt = await getQuery(`
            SELECT p.*, 
                   GROUP_CONCAT(DISTINCT c.name) as category_names,
                   GROUP_CONCAT(DISTINCT c.id) as category_ids,
                   COUNT(DISTINCT pu.id) as usage_count,
                   AVG(r.rating) as avg_rating
            FROM prompts p
            LEFT JOIN prompt_categories pc ON p.id = pc.prompt_id
            LEFT JOIN categories c ON pc.category_id = c.id
            LEFT JOIN prompt_usage pu ON p.id = pu.prompt_id
            LEFT JOIN ratings r ON p.id = r.prompt_id
            WHERE p.id = ?
            GROUP BY p.id
        `, [req.params.id]);
        
        if (!prompt) {
            return res.status(404).json({ error: 'Prompt not found' });
        }
        
        // Track view
        await runQuery('INSERT INTO prompt_usage (prompt_id, action) VALUES (?, ?)', 
            [req.params.id, 'view']);
        
        res.json(prompt);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new prompt
app.post('/api/prompts', async (req, res) => {
    try {
        const {
            title,
            description,
            prompt_text,
            categories,
            time_saved,
            difficulty_level,
            ai_tool,
            example_output,
            tips,
            tags
        } = req.body;
        
        // Validate required fields
        if (!title || !description || !prompt_text) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Insert prompt
        const result = await runQuery(`
            INSERT INTO prompts (
                title, description, prompt_text, time_saved, 
                difficulty_level, ai_tool, example_output, tips
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [title, description, prompt_text, time_saved, 
            difficulty_level, ai_tool, example_output, tips]);
        
        const promptId = result.id;
        
        // Add categories
        if (categories && categories.length > 0) {
            for (const categoryId of categories) {
                await runQuery(
                    'INSERT INTO prompt_categories (prompt_id, category_id) VALUES (?, ?)',
                    [promptId, categoryId]
                );
            }
        }
        
        // Add tags
        if (tags && tags.length > 0) {
            for (const tagName of tags) {
                // Insert or get tag
                await runQuery('INSERT OR IGNORE INTO tags (name) VALUES (?)', [tagName]);
                const tag = await getQuery('SELECT id FROM tags WHERE name = ?', [tagName]);
                
                // Link tag to prompt
                await runQuery(
                    'INSERT INTO prompt_tags (prompt_id, tag_id) VALUES (?, ?)',
                    [promptId, tag.id]
                );
            }
        }
        
        res.status(201).json({ id: promptId, message: 'Prompt created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update prompt
app.put('/api/prompts/:id', async (req, res) => {
    try {
        const {
            title,
            description,
            prompt_text,
            categories,
            time_saved,
            difficulty_level,
            ai_tool,
            example_output,
            tips
        } = req.body;
        
        await runQuery(`
            UPDATE prompts 
            SET title = ?, description = ?, prompt_text = ?, 
                time_saved = ?, difficulty_level = ?, ai_tool = ?, 
                example_output = ?, tips = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [title, description, prompt_text, time_saved, 
            difficulty_level, ai_tool, example_output, tips, req.params.id]);
        
        // Update categories
        if (categories) {
            // Remove existing categories
            await runQuery('DELETE FROM prompt_categories WHERE prompt_id = ?', [req.params.id]);
            
            // Add new categories
            for (const categoryId of categories) {
                await runQuery(
                    'INSERT INTO prompt_categories (prompt_id, category_id) VALUES (?, ?)',
                    [req.params.id, categoryId]
                );
            }
        }
        
        res.json({ message: 'Prompt updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete prompt
app.delete('/api/prompts/:id', async (req, res) => {
    try {
        await runQuery('UPDATE prompts SET status = ? WHERE id = ?', ['deleted', req.params.id]);
        res.json({ message: 'Prompt deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Track prompt copy
app.post('/api/prompts/:id/copy', async (req, res) => {
    try {
        await runQuery('INSERT INTO prompt_usage (prompt_id, action) VALUES (?, ?)', 
            [req.params.id, 'copy']);
        res.json({ message: 'Copy tracked' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rate prompt
app.post('/api/prompts/:id/rate', async (req, res) => {
    try {
        const { rating } = req.body;
        const userId = req.body.user_id || 1; // Default user for now
        
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }
        
        // Check if user already rated
        const existing = await getQuery(
            'SELECT id FROM ratings WHERE prompt_id = ? AND user_id = ?',
            [req.params.id, userId]
        );
        
        if (existing) {
            // Update existing rating
            await runQuery(
                'UPDATE ratings SET rating = ? WHERE prompt_id = ? AND user_id = ?',
                [rating, req.params.id, userId]
            );
        } else {
            // Insert new rating
            await runQuery(
                'INSERT INTO ratings (prompt_id, user_id, rating) VALUES (?, ?, ?)',
                [req.params.id, userId, rating]
            );
        }
        
        res.json({ message: 'Rating saved' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get popular tags
app.get('/api/tags', async (req, res) => {
    try {
        const tags = await allQuery(`
            SELECT t.*, COUNT(pt.prompt_id) as usage_count
            FROM tags t
            LEFT JOIN prompt_tags pt ON t.id = pt.tag_id
            GROUP BY t.id
            ORDER BY usage_count DESC
            LIMIT 20
        `);
        res.json(tags);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Prompt Library API running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close(() => {
        console.log('Database connection closed.');
        process.exit(0);
    });
});