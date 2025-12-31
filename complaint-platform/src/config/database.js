/**
 * Complaint Platform Database Manager
 * Handles all database operations for complaint management system
 */

const { Pool } = require('pg');
const { setupLogger } = require('../utils/logger');

class DatabaseManager {
    constructor() {
        this.pool = null;
        this.logger = setupLogger('database');
    }

    async initialize() {
        try {
            this.pool = new Pool({
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 5432,
                database: process.env.DB_NAME || 'complaint_platform',
                user: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASSWORD || 'password',
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            });

            // Test connection
            await this.pool.query('SELECT NOW()');
            this.logger.info('Database connection established');

            // Initialize tables
            await this.createTables();

        } catch (error) {
            this.logger.error('Database initialization failed:', error);
            throw error;
        }
    }

    async createTables() {
        const queries = [
            // Complaints table
            `CREATE TABLE IF NOT EXISTS complaints (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                complaint_id VARCHAR(20) UNIQUE NOT NULL,
                title VARCHAR(200) NOT NULL,
                description TEXT NOT NULL,
                category VARCHAR(50) NOT NULL CHECK (category IN ('infrastructure', 'sanitation', 'traffic', 'noise', 'water', 'electricity', 'public_safety', 'environment', 'other')),
                priority VARCHAR(10) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
                status VARCHAR(20) DEFAULT 'filed' CHECK (status IN ('filed', 'acknowledged', 'in_progress', 'resolved', 'closed', 'rejected')),
                location JSONB NOT NULL,
                citizen_name VARCHAR(100) NOT NULL,
                citizen_email VARCHAR(255) NOT NULL,
                citizen_phone VARCHAR(20) NOT NULL,
                is_anonymous BOOLEAN DEFAULT false,
                attachments JSONB DEFAULT '[]',
                assigned_authority_id UUID,
                estimated_resolution_date DATE,
                actual_resolution_date DATE,
                resolution_notes TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                updated_by UUID
            )`,

            // Authorities table
            `CREATE TABLE IF NOT EXISTS authorities (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(200) NOT NULL,
                type VARCHAR(50) NOT NULL,
                jurisdiction JSONB,
                contact_email VARCHAR(255),
                contact_phone VARCHAR(20),
                working_hours VARCHAR(50) DEFAULT '09:00-17:00',
                categories JSONB NOT NULL,
                current_workload INTEGER DEFAULT 0,
                max_capacity INTEGER DEFAULT 50,
                average_resolution_time INTEGER DEFAULT 7,
                supervisor_id UUID REFERENCES authorities(id),
                active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )`,

            // Comments table
            `CREATE TABLE IF NOT EXISTS complaint_comments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
                comment TEXT NOT NULL,
                author_type VARCHAR(20) NOT NULL CHECK (author_type IN ('citizen', 'authority')),
                author_id UUID NOT NULL,
                author_name VARCHAR(100),
                is_public BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            // Feedback table
            `CREATE TABLE IF NOT EXISTS complaint_feedback (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
                citizen_email VARCHAR(255) NOT NULL,
                rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                feedback_text TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            // Complaint assignments table
            `CREATE TABLE IF NOT EXISTS complaint_assignments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
                authority_id UUID REFERENCES authorities(id),
                assigned_at TIMESTAMP DEFAULT NOW(),
                assigned_by UUID,
                is_current BOOLEAN DEFAULT true,
                reassignment_reason TEXT
            )`,

            // Complaint status history table
            `CREATE TABLE IF NOT EXISTS complaint_status_history (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
                old_status VARCHAR(20),
                new_status VARCHAR(20) NOT NULL,
                changed_by UUID,
                change_reason TEXT,
                changed_at TIMESTAMP DEFAULT NOW()
            )`,

            // Notifications table
            `CREATE TABLE IF NOT EXISTS notifications (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('citizen', 'authority')),
                recipient_id VARCHAR(255) NOT NULL,
                type VARCHAR(50) NOT NULL,
                title VARCHAR(200) NOT NULL,
                message TEXT NOT NULL,
                data JSONB,
                read_at TIMESTAMP,
                sent_at TIMESTAMP DEFAULT NOW(),
                delivery_status VARCHAR(20) DEFAULT 'pending'
            )`,

            // Analytics cache table
            `CREATE TABLE IF NOT EXISTS analytics_cache (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                cache_key VARCHAR(255) UNIQUE NOT NULL,
                data JSONB NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )`,

            // Indexes for performance
            `CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status)`,
            `CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category)`,
            `CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority)`,
            `CREATE INDEX IF NOT EXISTS idx_complaints_citizen_email ON complaints(citizen_email)`,
            `CREATE INDEX IF NOT EXISTS idx_complaints_assigned_authority ON complaints(assigned_authority_id)`,
            `CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at)`,
            `CREATE INDEX IF NOT EXISTS idx_complaints_location ON complaints USING GIN(location)`,
            `CREATE INDEX IF NOT EXISTS idx_authorities_type ON authorities(type)`,
            `CREATE INDEX IF NOT EXISTS idx_authorities_active ON authorities(active)`,
            `CREATE INDEX IF NOT EXISTS idx_authorities_categories ON authorities USING GIN(categories)`,
            `CREATE INDEX IF NOT EXISTS idx_complaint_comments_complaint_id ON complaint_comments(complaint_id)`,
            `CREATE INDEX IF NOT EXISTS idx_complaint_assignments_complaint_id ON complaint_assignments(complaint_id)`,
            `CREATE INDEX IF NOT EXISTS idx_complaint_assignments_authority_id ON complaint_assignments(authority_id)`,
            `CREATE INDEX IF NOT EXISTS idx_complaint_assignments_current ON complaint_assignments(is_current)`,
            `CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_type, recipient_id)`,
            `CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications(sent_at)`
        ];

        for (const query of queries) {
            await this.pool.query(query);
        }

        this.logger.info('Database tables initialized');
    }

    // Complaint operations
    async createComplaint(complaintData) {
        const query = `
            INSERT INTO complaints (
                complaint_id, title, description, category, priority, location,
                citizen_name, citizen_email, citizen_phone, is_anonymous, attachments
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `;
        
        const values = [
            complaintData.complaint_id,
            complaintData.title,
            complaintData.description,
            complaintData.category,
            complaintData.priority,
            JSON.stringify(complaintData.location),
            complaintData.citizen_name,
            complaintData.citizen_email,
            complaintData.citizen_phone,
            complaintData.is_anonymous || false,
            JSON.stringify(complaintData.attachments || [])
        ];

        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    async getComplaintById(complaintId) {
        const query = 'SELECT * FROM complaints WHERE complaint_id = $1';
        const result = await this.pool.query(query, [complaintId]);
        return result.rows[0];
    }

    async updateComplaintStatus(complaintId, updateData) {
        const query = `
            UPDATE complaints 
            SET status = $2, resolution_notes = $3, estimated_resolution_date = $4,
                updated_by = $5, updated_at = NOW()
            WHERE complaint_id = $1
            RETURNING *
        `;
        
        const values = [
            complaintId,
            updateData.status,
            updateData.resolution_notes,
            updateData.estimated_resolution_date,
            updateData.updated_by
        ];

        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    async getComplaints(filters = {}) {
        let query = 'SELECT * FROM complaints WHERE 1=1';
        const values = [];
        let paramCount = 0;

        // Apply filters
        if (filters.status) {
            paramCount++;
            query += ` AND status = $${paramCount}`;
            values.push(filters.status);
        }

        if (filters.category) {
            paramCount++;
            query += ` AND category = $${paramCount}`;
            values.push(filters.category);
        }

        if (filters.priority) {
            paramCount++;
            query += ` AND priority = $${paramCount}`;
            values.push(filters.priority);
        }

        if (filters.authority_id) {
            paramCount++;
            query += ` AND assigned_authority_id = $${paramCount}`;
            values.push(filters.authority_id);
        }

        if (filters.citizen_email) {
            paramCount++;
            query += ` AND citizen_email = $${paramCount}`;
            values.push(filters.citizen_email);
        }

        if (filters.start_date) {
            paramCount++;
            query += ` AND created_at >= $${paramCount}`;
            values.push(filters.start_date);
        }

        if (filters.end_date) {
            paramCount++;
            query += ` AND created_at <= $${paramCount}`;
            values.push(filters.end_date);
        }

        query += ' ORDER BY created_at DESC';

        // Pagination
        if (filters.limit) {
            paramCount++;
            query += ` LIMIT $${paramCount}`;
            values.push(filters.limit);
        }

        if (filters.page && filters.limit) {
            paramCount++;
            const offset = (filters.page - 1) * filters.limit;
            query += ` OFFSET $${paramCount}`;
            values.push(offset);
        }

        const result = await this.pool.query(query, values);
        
        return {
            data: result.rows,
            pagination: {
                page: filters.page || 1,
                limit: filters.limit || 20,
                total: result.rowCount
            }
        };
    }

    // Authority operations
    async createAuthority(authorityData) {
        const query = `
            INSERT INTO authorities (
                name, type, jurisdiction, contact_email, contact_phone,
                working_hours, categories, max_capacity, supervisor_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;
        
        const values = [
            authorityData.name,
            authorityData.type,
            JSON.stringify(authorityData.jurisdiction),
            authorityData.contact_email,
            authorityData.contact_phone,
            authorityData.working_hours,
            JSON.stringify(authorityData.categories),
            authorityData.max_capacity,
            authorityData.supervisor_id
        ];

        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    async getAuthorities(filters = {}) {
        let query = 'SELECT * FROM authorities WHERE 1=1';
        const values = [];
        let paramCount = 0;

        if (filters.type) {
            paramCount++;
            query += ` AND type = $${paramCount}`;
            values.push(filters.type);
        }

        if (filters.active_only) {
            query += ' AND active = true';
        }

        query += ' ORDER BY name';

        const result = await this.pool.query(query, values);
        return result.rows;
    }

    // Comment operations
    async addComment(complaintId, commentData) {
        const query = `
            INSERT INTO complaint_comments (
                complaint_id, comment, author_type, author_id, author_name, is_public
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        
        const values = [
            complaintId,
            commentData.comment,
            commentData.author_type,
            commentData.author_id,
            commentData.author_name,
            commentData.is_public !== false
        ];

        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    // Feedback operations
    async addFeedback(complaintId, feedbackData) {
        const query = `
            INSERT INTO complaint_feedback (complaint_id, citizen_email, rating, feedback_text)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        
        const values = [
            complaintId,
            feedbackData.citizen_email,
            feedbackData.rating,
            feedbackData.feedback_text
        ];

        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    // Analytics operations
    async getAnalyticsData(query, params = []) {
        const result = await this.pool.query(query, params);
        return result.rows;
    }

    async cacheAnalytics(cacheKey, data, expiresIn = 300) {
        const expiresAt = new Date(Date.now() + expiresIn * 1000);
        
        const query = `
            INSERT INTO analytics_cache (cache_key, data, expires_at)
            VALUES ($1, $2, $3)
            ON CONFLICT (cache_key) 
            DO UPDATE SET data = $2, expires_at = $3, created_at = NOW()
        `;
        
        await this.pool.query(query, [cacheKey, JSON.stringify(data), expiresAt]);
    }

    async getCachedAnalytics(cacheKey) {
        const query = `
            SELECT data FROM analytics_cache 
            WHERE cache_key = $1 AND expires_at > NOW()
        `;
        
        const result = await this.pool.query(query, [cacheKey]);
        return result.rows[0] ? JSON.parse(result.rows[0].data) : null;
    }

    // Notification operations
    async createNotification(notificationData) {
        const query = `
            INSERT INTO notifications (
                recipient_type, recipient_id, type, title, message, data
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        
        const values = [
            notificationData.recipient_type,
            notificationData.recipient_id,
            notificationData.type,
            notificationData.title,
            notificationData.message,
            JSON.stringify(notificationData.data || {})
        ];

        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
            this.logger.info('Database connection closed');
        }
    }
}

module.exports = DatabaseManager;