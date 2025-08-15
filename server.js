import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Database file paths
const USERS_DB = 'users.json';
const UNSUBSCRIBES_DB = 'unsubscribes.json';
const PREFERENCES_DB = 'preferences.json';

// Initialize database files if they don't exist
async function initDatabase() {
    try {
        await fs.access(USERS_DB);
    } catch {
        await fs.writeFile(USERS_DB, JSON.stringify([], null, 2));
    }
    
    try {
        await fs.access(UNSUBSCRIBES_DB);
    } catch {
        await fs.writeFile(UNSUBSCRIBES_DB, JSON.stringify([], null, 2));
    }
    
    try {
        await fs.access(PREFERENCES_DB);
    } catch {
        await fs.writeFile(PREFERENCES_DB, JSON.stringify([], null, 2));
    }
}

// Read database
async function readDB(filename) {
    try {
        const data = await fs.readFile(filename, 'utf8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

// Write database
async function writeDB(filename, data) {
    await fs.writeFile(filename, JSON.stringify(data, null, 2));
}

// API Routes

// Get all users (for admin dashboard)
app.get('/api/users', async (req, res) => {
    try {
        const users = await readDB(USERS_DB);
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get unsubscribe list
app.get('/api/unsubscribes', async (req, res) => {
    try {
        const unsubscribes = await readDB(UNSUBSCRIBES_DB);
        res.json(unsubscribes);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch unsubscribes' });
    }
});

// Get all preferences
app.get('/api/preferences', async (req, res) => {
    try {
        const preferences = await readDB(PREFERENCES_DB);
        res.json(preferences);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch preferences' });
    }
});

// Check if user is unsubscribed
app.get('/api/check-unsubscribe/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const unsubscribes = await readDB(UNSUBSCRIBES_DB);
        const isUnsubscribed = unsubscribes.some(u => u.email === email);
        res.json({ email, isUnsubscribed });
    } catch (error) {
        res.status(500).json({ error: 'Failed to check unsubscribe status' });
    }
});

// Unsubscribe user
app.post('/api/unsubscribe', async (req, res) => {
    try {
        const { email, token, reason = 'User requested' } = req.body;
        
        if (!email || !token) {
            return res.status(400).json({ error: 'Email and token required' });
        }
        
        // Validate token (basic validation)
        if (token.length < 20) {
            return res.status(400).json({ error: 'Invalid token' });
        }
        
        const unsubscribes = await readDB(UNSUBSCRIBES_DB);
        
        // Check if already unsubscribed
        const existingIndex = unsubscribes.findIndex(u => u.email === email);
        
        if (existingIndex >= 0) {
            // Update existing record
            unsubscribes[existingIndex] = {
                email,
                unsubscribedAt: new Date().toISOString(),
                reason,
                token,
                updatedAt: new Date().toISOString()
            };
        } else {
            // Add new unsubscribe record
            unsubscribes.push({
                email,
                unsubscribedAt: new Date().toISOString(),
                reason,
                token,
                createdAt: new Date().toISOString()
            });
        }
        
        await writeDB(UNSUBSCRIBES_DB, unsubscribes);
        
        // Log the unsubscribe action
        console.log(`User unsubscribed: ${email} - Reason: ${reason}`);
        
        res.json({ 
            success: true, 
            message: 'Successfully unsubscribed',
            email,
            unsubscribedAt: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Unsubscribe error:', error);
        res.status(500).json({ error: 'Failed to unsubscribe user' });
    }
});

// Update user preferences
app.post('/api/preferences', async (req, res) => {
    try {
        const { email, token, preferences } = req.body;
        
        if (!email || !token || !preferences) {
            return res.status(400).json({ error: 'Email, token, and preferences required' });
        }
        
        // Validate token
        if (token.length < 20) {
            return res.status(400).json({ error: 'Invalid token' });
        }
        
        const allPreferences = await readDB(PREFERENCES_DB);
        
        // Check if already has preferences
        const existingIndex = allPreferences.findIndex(p => p.email === email);
        
        const preferenceData = {
            email,
            token,
            preferences: {
                ...preferences,
                updatedAt: new Date().toISOString()
            },
            lastUpdated: new Date().toISOString()
        };
        
        if (existingIndex >= 0) {
            // Update existing preferences
            allPreferences[existingIndex] = preferenceData;
        } else {
            // Add new preferences
            preferenceData.createdAt = new Date().toISOString();
            allPreferences.push(preferenceData);
        }
        
        await writeDB(PREFERENCES_DB, allPreferences);
        
        // Log the preference update
        console.log(`Preferences updated for: ${email}`, preferences);
        
        res.json({ 
            success: true, 
            message: 'Preferences updated successfully',
            email,
            updatedAt: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Preferences error:', error);
        res.status(500).json({ error: 'Failed to update preferences' });
    }
});

// Resubscribe user
app.post('/api/resubscribe', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email required' });
        }
        
        const unsubscribes = await readDB(UNSUBSCRIBES_DB);
        const filteredUnsubscribes = unsubscribes.filter(u => u.email !== email);
        
        await writeDB(UNSUBSCRIBES_DB, filteredUnsubscribes);
        
        console.log(`User resubscribed: ${email}`);
        
        res.json({ 
            success: true, 
            message: 'Successfully resubscribed',
            email,
            resubscribedAt: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Resubscribe error:', error);
        res.status(500).json({ error: 'Failed to resubscribe user' });
    }
});

// Admin dashboard route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
});

// Initialize database and start server
initDatabase().then(() => {
    app.listen(PORT, () => {
        const host = isProduction ? 'production server' : `http://localhost:${PORT}`;
        console.log(`🚀 Server running on ${host}`);
        console.log(`📊 Admin dashboard: ${isProduction ? 'https://your-domain.com/admin' : `http://localhost:${PORT}/admin`}`);
        console.log(`📧 API endpoints:`);
        console.log(`   - GET  /api/users`);
        console.log(`   - GET  /api/unsubscribes`);
        console.log(`   - GET  /api/preferences`);
        console.log(`   - POST /api/unsubscribe`);
        console.log(`   - POST /api/preferences`);
        console.log(`   - POST /api/resubscribe`);
        
        if (isProduction) {
            console.log(`🌐 Production mode enabled`);
            console.log(`📝 Check logs for any errors`);
        }
    });
}).catch(console.error);
