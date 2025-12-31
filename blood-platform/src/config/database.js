/**
 * Blood Platform Database Manager
 * Handles all database operations for blood donation platform
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
                database: process.env.DB_NAME || 'blood_platform',
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
            // Donors table
            `CREATE TABLE IF NOT EXISTS donors (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(20) NOT NULL,
                blood_type VARCHAR(3) NOT NULL CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
                date_of_birth DATE NOT NULL,
                location JSONB NOT NULL,
                medical_conditions JSONB DEFAULT '[]',
                availability BOOLEAN DEFAULT true,
                available_until TIMESTAMP,
                last_donation_date DATE,
                last_availability_update TIMESTAMP DEFAULT NOW(),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )`,

            // Blood requests table
            `CREATE TABLE IF NOT EXISTS blood_requests (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(100) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                blood_type VARCHAR(3) NOT NULL CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
                urgency VARCHAR(10) NOT NULL CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
                units_needed INTEGER NOT NULL CHECK (units_needed > 0 AND units_needed <= 10),
                hospital_id UUID NOT NULL,
                hospital_name VARCHAR(200) NOT NULL,
                location JSONB NOT NULL,
                medical_condition TEXT,
                needed_by TIMESTAMP NOT NULL,
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'fulfilled', 'expired', 'cancelled')),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )`,

            // Donations table
            `CREATE TABLE IF NOT EXISTS donations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                request_id UUID REFERENCES blood_requests(id),
                donor_id UUID REFERENCES donors(id),
                hospital_id UUID NOT NULL,
                donation_date TIMESTAMP NOT NULL,
                status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
                units INTEGER DEFAULT 1,
                notes TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )`,

            // Blood banks table
            `CREATE TABLE IF NOT EXISTS blood_banks (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(200) NOT NULL,
                address TEXT NOT NULL,
                location JSONB NOT NULL,
                phone VARCHAR(20),
                email VARCHAR(255),
                operating_hours JSONB,
                capacity INTEGER DEFAULT 1000,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )`,

            // Blood inventory table
            `CREATE TABLE IF NOT EXISTS blood_inventory (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                bank_id UUID REFERENCES blood_banks(id),
                blood_type VARCHAR(3) NOT NULL CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
                units INTEGER NOT NULL DEFAULT 0,
                reserved_units INTEGER DEFAULT 0,
                expiration_date DATE NOT NULL,
                donation_date DATE NOT NULL,
                donor_id UUID REFERENCES donors(id),
                status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'used', 'expired')),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )`,

            // Indexes for performance
            `CREATE INDEX IF NOT EXISTS idx_donors_blood_type ON donors(blood_type)`,
            `CREATE INDEX IF NOT EXISTS idx_donors_availability ON donors(availability)`,
            `CREATE INDEX IF NOT EXISTS idx_donors_location ON donors USING GIN(location)`,
            `CREATE INDEX IF NOT EXISTS idx_blood_requests_status ON blood_requests(status)`,
            `CREATE INDEX IF NOT EXISTS idx_blood_requests_urgency ON blood_requests(urgency)`,
            `CREATE INDEX IF NOT EXISTS idx_blood_requests_blood_type ON blood_requests(blood_type)`,
            `CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status)`,
            `CREATE INDEX IF NOT EXISTS idx_blood_inventory_bank_type ON blood_inventory(bank_id, blood_type)`,
            `CREATE INDEX IF NOT EXISTS idx_blood_inventory_expiration ON blood_inventory(expiration_date)`
        ];

        for (const query of queries) {
            await this.pool.query(query);
        }

        this.logger.info('Database tables initialized');
    }

    // Donor operations
    async createDonor(donorData) {
        const query = `
            INSERT INTO donors (name, email, phone, blood_type, date_of_birth, location, medical_conditions)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        
        const values = [
            donorData.name,
            donorData.email,
            donorData.phone,
            donorData.blood_type,
            donorData.date_of_birth,
            JSON.stringify(donorData.location),
            JSON.stringify(donorData.medical_conditions || [])
        ];

        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    async getDonorByEmail(email) {
        const query = 'SELECT * FROM donors WHERE email = $1';
        const result = await this.pool.query(query, [email]);
        return result.rows[0];
    }

    async updateDonorAvailability(donorId, availabilityData) {
        const query = `
            UPDATE donors 
            SET availability = $2, available_until = $3, last_availability_update = $4, updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `;
        
        const values = [
            donorId,
            availabilityData.availability,
            availabilityData.available_until,
            availabilityData.last_availability_update
        ];

        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    // Blood request operations
    async createBloodRequest(requestData) {
        const query = `
            INSERT INTO blood_requests (name, email, phone, blood_type, urgency, units_needed, 
                                      hospital_id, hospital_name, location, medical_condition, needed_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `;
        
        const values = [
            requestData.name,
            requestData.email,
            requestData.phone,
            requestData.blood_type,
            requestData.urgency,
            requestData.units_needed,
            requestData.hospital_id,
            requestData.hospital_name || 'Unknown Hospital',
            JSON.stringify(requestData.location),
            requestData.medical_condition,
            requestData.needed_by
        ];

        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    async getBloodRequests(filters = {}) {
        let query = 'SELECT * FROM blood_requests WHERE 1=1';
        const values = [];
        let paramCount = 0;

        if (filters.status) {
            paramCount++;
            query += ` AND status = $${paramCount}`;
            values.push(filters.status);
        }

        if (filters.urgency) {
            paramCount++;
            query += ` AND urgency = $${paramCount}`;
            values.push(filters.urgency);
        }

        if (filters.blood_type) {
            paramCount++;
            query += ` AND blood_type = $${paramCount}`;
            values.push(filters.blood_type);
        }

        query += ' ORDER BY created_at DESC';

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

    async updateBloodRequestStatus(requestId, status) {
        const query = `
            UPDATE blood_requests 
            SET status = $2, updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `;
        
        const result = await this.pool.query(query, [requestId, status]);
        return result.rows[0];
    }

    // Donation operations
    async createDonation(donationData) {
        const query = `
            INSERT INTO donations (request_id, donor_id, hospital_id, donation_date, status, units)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        
        const values = [
            donationData.request_id,
            donationData.donor_id,
            donationData.hospital_id,
            donationData.donation_date,
            donationData.status || 'scheduled',
            donationData.units || 1
        ];

        const result = await this.pool.query(query, values);
        return result.rows[0];
    }

    // Blood bank operations
    async getAllBloodBanks() {
        const query = 'SELECT * FROM blood_banks ORDER BY name';
        const result = await this.pool.query(query);
        return result.rows;
    }

    async getNearbyBloodBanks(location, radius = 50) {
        // This would use PostGIS for proper geospatial queries
        // For now, returning all blood banks
        return await this.getAllBloodBanks();
    }

    // Analytics operations
    async getDashboardAnalytics(dateRange) {
        const queries = {
            totalDonors: 'SELECT COUNT(*) as count FROM donors',
            activeDonors: 'SELECT COUNT(*) as count FROM donors WHERE availability = true',
            totalRequests: `SELECT COUNT(*) as count FROM blood_requests WHERE created_at >= $1 AND created_at <= $2`,
            pendingRequests: `SELECT COUNT(*) as count FROM blood_requests WHERE status = 'pending' AND created_at >= $1 AND created_at <= $2`,
            completedDonations: `SELECT COUNT(*) as count FROM donations WHERE status = 'completed' AND created_at >= $1 AND created_at <= $2`,
            bloodTypeDistribution: `SELECT blood_type, COUNT(*) as count FROM blood_requests WHERE created_at >= $1 AND created_at <= $2 GROUP BY blood_type`
        };

        const results = {};
        
        for (const [key, query] of Object.entries(queries)) {
            if (key === 'totalDonors' || key === 'activeDonors') {
                const result = await this.pool.query(query);
                results[key] = parseInt(result.rows[0].count);
            } else {
                const result = await this.pool.query(query, [dateRange.start_date, dateRange.end_date]);
                if (key === 'bloodTypeDistribution') {
                    results[key] = result.rows;
                } else {
                    results[key] = parseInt(result.rows[0].count);
                }
            }
        }

        return results;
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
            this.logger.info('Database connection closed');
        }
    }
}

module.exports = DatabaseManager;