/**
 * Database Configuration and Management
 * Handles PostgreSQL connections and user operations
 */

const { Pool } = require('pg');

class DatabaseManager {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/local_lens_auth',
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

        this.pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
        });
    }

    /**
     * Initialize database tables
     */
    async initialize() {
        const client = await this.pool.connect();
        
        try {
            // Create users table
            await client.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    role VARCHAR(50) DEFAULT 'citizen',
                    phone VARCHAR(20),
                    location JSONB,
                    platforms_access TEXT[] DEFAULT ARRAY['basic'],
                    email_verified BOOLEAN DEFAULT FALSE,
                    is_active BOOLEAN DEFAULT TRUE,
                    last_login TIMESTAMP,
                    password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Create user sessions table
            await client.query(`
                CREATE TABLE IF NOT EXISTS user_sessions (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    session_token VARCHAR(255) NOT NULL,
                    ip_address INET,
                    user_agent TEXT,
                    expires_at TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Create user activities table for audit logging
            await client.query(`
                CREATE TABLE IF NOT EXISTS user_activities (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    activity_type VARCHAR(50) NOT NULL,
                    activity_data JSONB,
                    ip_address INET,
                    user_agent TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Create password reset tokens table
            await client.query(`
                CREATE TABLE IF NOT EXISTS password_reset_tokens (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    token VARCHAR(255) UNIQUE NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    used BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Create indexes for better performance
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
                CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
                CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
                CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
                CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
                CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at);
                CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
                CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
            `);

            // Create trigger to update updated_at timestamp
            await client.query(`
                CREATE OR REPLACE FUNCTION update_updated_at_column()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.updated_at = CURRENT_TIMESTAMP;
                    RETURN NEW;
                END;
                $$ language 'plpgsql';

                DROP TRIGGER IF EXISTS update_users_updated_at ON users;
                CREATE TRIGGER update_users_updated_at
                    BEFORE UPDATE ON users
                    FOR EACH ROW
                    EXECUTE FUNCTION update_updated_at_column();
            `);

            // Insert default admin user if not exists
            const adminExists = await client.query(
                'SELECT id FROM users WHERE email = $1',
                ['admin@locallens.com']
            );

            if (adminExists.rows.length === 0) {
                const bcrypt = require('bcryptjs');
                const adminPassword = await bcrypt.hash('Admin@123456', 12);
                
                await client.query(`
                    INSERT INTO users (email, password_hash, name, role, platforms_access, email_verified)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `, [
                    'admin@locallens.com',
                    adminPassword,
                    'System Administrator',
                    'admin',
                    ['all'],
                    true
                ]);
            }

            console.log('Database initialized successfully');

        } finally {
            client.release();
        }
    }

    /**
     * Create a new user
     */
    async createUser(userData) {
        const {
            email,
            password_hash,
            name,
            role,
            phone,
            location,
            platforms_access
        } = userData;

        const query = `
            INSERT INTO users (email, password_hash, name, role, phone, location, platforms_access)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, email, name, role, phone, location, platforms_access, created_at
        `;

        const values = [
            email,
            password_hash,
            name,
            role,
            phone,
            location,
            platforms_access
        ];

        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Get user by email
     */
    async getUserByEmail(email) {
        const query = `
            SELECT id, email, password_hash, name, role, phone, location, 
                   platforms_access, email_verified, is_active, last_login, created_at
            FROM users 
            WHERE email = $1 AND is_active = TRUE
        `;

        const result = await this.pool.query(query, [email]);
        return result.rows[0];
    }

    /**
     * Get user by ID
     */
    async getUserById(userId) {
        const query = `
            SELECT id, email, name, role, phone, location, 
                   platforms_access, email_verified, is_active, last_login, created_at
            FROM users 
            WHERE id = $1 AND is_active = TRUE
        `;

        const result = await this.pool.query(query, [userId]);
        return result.rows[0];
    }

    /**
     * Update user information
     */
    async updateUser(userId, updates) {
        const allowedFields = [
            'name', 'phone', 'location', 'platforms_access', 
            'email_verified', 'is_active', 'last_login', 
            'password_hash', 'password_changed_at', 'role'
        ];

        const updateFields = [];
        const values = [];
        let paramCount = 1;

        Object.keys(updates).forEach(field => {
            if (allowedFields.includes(field)) {
                updateFields.push(`${field} = $${paramCount}`);
                values.push(updates[field]);
                paramCount++;
            }
        });

        if (updateFields.length === 0) {
            throw new Error('No valid fields to update');
        }

        values.push(userId);

        const query = `
            UPDATE users 
            SET ${updateFields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING id, email, name, role, phone, location, platforms_access, updated_at
        `;

        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Get users with pagination and filtering
     */
    async getUsers(options = {}) {
        const {
            page = 1,
            limit = 20,
            role,
            search,
            isActive = true
        } = options;

        const offset = (page - 1) * limit;
        let whereConditions = ['is_active = $1'];
        let values = [isActive];
        let paramCount = 2;

        if (role) {
            whereConditions.push(`role = $${paramCount}`);
            values.push(role);
            paramCount++;
        }

        if (search) {
            whereConditions.push(`(name ILIKE $${paramCount} OR email ILIKE $${paramCount})`);
            values.push(`%${search}%`);
            paramCount++;
        }

        const whereClause = whereConditions.join(' AND ');

        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total
            FROM users
            WHERE ${whereClause}
        `;

        const countResult = await this.pool.query(countQuery, values);
        const total = parseInt(countResult.rows[0].total);

        // Get users
        const query = `
            SELECT id, email, name, role, phone, platforms_access, 
                   email_verified, is_active, last_login, created_at
            FROM users
            WHERE ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${paramCount} OFFSET $${paramCount + 1}
        `;

        values.push(limit, offset);

        const result = await this.pool.query(query, values);

        return {
            data: result.rows,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Log user activity
     */
    async logUserActivity(userId, activityType, activityData = {}, ipAddress = null, userAgent = null) {
        const query = `
            INSERT INTO user_activities (user_id, activity_type, activity_data, ip_address, user_agent)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, created_at
        `;

        const values = [
            userId,
            activityType,
            JSON.stringify(activityData),
            ipAddress,
            userAgent
        ];

        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Get user activities
     */
    async getUserActivities(userId, options = {}) {
        const {
            page = 1,
            limit = 50,
            activityType
        } = options;

        const offset = (page - 1) * limit;
        let whereConditions = ['user_id = $1'];
        let values = [userId];
        let paramCount = 2;

        if (activityType) {
            whereConditions.push(`activity_type = $${paramCount}`);
            values.push(activityType);
            paramCount++;
        }

        const whereClause = whereConditions.join(' AND ');

        const query = `
            SELECT activity_type, activity_data, ip_address, user_agent, created_at
            FROM user_activities
            WHERE ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${paramCount} OFFSET $${paramCount + 1}
        `;

        values.push(limit, offset);

        const result = await this.pool.query(query, values);
        return result.rows;
    }

    /**
     * Clean up expired sessions and tokens
     */
    async cleanupExpiredData() {
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');

            // Clean up expired sessions
            await client.query('DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP');

            // Clean up expired password reset tokens
            await client.query('DELETE FROM password_reset_tokens WHERE expires_at < CURRENT_TIMESTAMP');

            // Clean up old user activities (keep last 90 days)
            await client.query(`
                DELETE FROM user_activities 
                WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days'
            `);

            await client.query('COMMIT');

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get authentication statistics
     */
    async getAuthStats() {
        const queries = [
            'SELECT COUNT(*) as total_users FROM users WHERE is_active = TRUE',
            'SELECT COUNT(*) as active_sessions FROM user_sessions WHERE expires_at > CURRENT_TIMESTAMP',
            `SELECT 
                role, 
                COUNT(*) as count 
             FROM users 
             WHERE is_active = TRUE 
             GROUP BY role`,
            `SELECT 
                DATE(created_at) as date,
                COUNT(*) as registrations
             FROM users 
             WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
             GROUP BY DATE(created_at)
             ORDER BY date DESC`,
            `SELECT 
                DATE(created_at) as date,
                COUNT(*) as logins
             FROM user_activities 
             WHERE activity_type = 'login' 
               AND created_at >= CURRENT_DATE - INTERVAL '30 days'
             GROUP BY DATE(created_at)
             ORDER BY date DESC`
        ];

        const results = await Promise.all(
            queries.map(query => this.pool.query(query))
        );

        return {
            total_users: parseInt(results[0].rows[0].total_users),
            active_sessions: parseInt(results[1].rows[0].active_sessions),
            users_by_role: results[2].rows,
            daily_registrations: results[3].rows,
            daily_logins: results[4].rows
        };
    }

    /**
     * Close database connections
     */
    async close() {
        await this.pool.end();
    }
}

module.exports = DatabaseManager;