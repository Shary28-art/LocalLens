#!/usr/bin/env node

/**
 * Local Lens Blood Donation Platform
 * Real-time blood donor-recipient matching with emergency response capabilities
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

// Import custom modules
const DatabaseManager = require('./config/database');
const MatchingService = require('./services/matchingService');
const NotificationService = require('./services/notificationService');
const InventoryService = require('./services/inventoryService');
const { setupLogger, logWithExtra } = require('./utils/logger');
const { validateCoordinates, calculateDistance } = require('./utils/helpers');

// Initialize Express app and Socket.IO
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

const logger = setupLogger('blood-platform');

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Initialize services
const dbManager = new DatabaseManager();
const matchingService = new MatchingService();
const notificationService = new NotificationService(io);
const inventoryService = new InventoryService();

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'blood-platform',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: process.uptime()
    });
});

// Donor endpoints
app.post('/api/donors/register', [
    body('name').isLength({ min: 2, max: 100 }).trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('phone').isMobilePhone(),
    body('blood_type').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
    body('date_of_birth').isISO8601(),
    body('location.lat').isFloat({ min: -90, max: 90 }),
    body('location.lng').isFloat({ min: -180, max: 180 }),
    body('medical_conditions').optional().isArray()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const donorData = req.body;
        
        // Check if donor already exists
        const existingDonor = await dbManager.getDonorByEmail(donorData.email);
        if (existingDonor) {
            return res.status(409).json({
                success: false,
                error: 'Donor already registered with this email'
            });
        }

        // Register donor
        const donor = await dbManager.createDonor(donorData);

        logWithExtra(logger, 'info', 'Donor registered successfully', {
            donorId: donor.id,
            bloodType: donor.blood_type,
            location: donor.location
        });

        res.status(201).json({
            success: true,
            message: 'Donor registered successfully',
            donor: {
                id: donor.id,
                name: donor.name,
                blood_type: donor.blood_type,
                availability: donor.availability,
                created_at: donor.created_at
            }
        });

    } catch (error) {
        logger.error('Donor registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

app.put('/api/donors/:donorId/availability', [
    body('availability').isBoolean(),
    body('available_until').optional().isISO8601()
], async (req, res) => {
    try {
        const { donorId } = req.params;
        const { availability, available_until } = req.body;

        const updatedDonor = await dbManager.updateDonorAvailability(donorId, {
            availability,
            available_until: available_until ? new Date(available_until) : null,
            last_availability_update: new Date()
        });

        if (!updatedDonor) {
            return res.status(404).json({
                success: false,
                error: 'Donor not found'
            });
        }

        // If donor became available, check for pending matches
        if (availability) {
            const pendingRequests = await matchingService.findPendingRequestsForDonor(donorId);
            
            for (const request of pendingRequests) {
                const matches = await matchingService.findCompatibleDonors(request);
                if (matches.length > 0) {
                    await notificationService.notifyEmergencyMatch(request, matches);
                }
            }
        }

        logWithExtra(logger, 'info', 'Donor availability updated', {
            donorId,
            availability,
            available_until
        });

        res.json({
            success: true,
            message: 'Availability updated successfully',
            donor: updatedDonor
        });

    } catch (error) {
        logger.error('Donor availability update error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Recipient endpoints
app.post('/api/recipients/request', [
    body('name').isLength({ min: 2, max: 100 }).trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('phone').isMobilePhone(),
    body('blood_type').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
    body('urgency').isIn(['low', 'medium', 'high', 'critical']),
    body('units_needed').isInt({ min: 1, max: 10 }),
    body('hospital_id').isUUID(),
    body('location.lat').isFloat({ min: -90, max: 90 }),
    body('location.lng').isFloat({ min: -180, max: 180 }),
    body('medical_condition').optional().isString(),
    body('needed_by').isISO8601()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const requestData = req.body;
        
        // Create blood request
        const bloodRequest = await dbManager.createBloodRequest(requestData);

        // Find compatible donors immediately
        const compatibleDonors = await matchingService.findCompatibleDonors(bloodRequest);

        // Send notifications to compatible donors
        if (compatibleDonors.length > 0) {
            await notificationService.notifyDonorsOfRequest(bloodRequest, compatibleDonors);
            
            // For critical requests, also send emergency notifications
            if (requestData.urgency === 'critical') {
                await notificationService.notifyEmergencyMatch(bloodRequest, compatibleDonors);
            }
        }

        // Emit real-time event
        io.emit('new_blood_request', {
            request: bloodRequest,
            compatible_donors_count: compatibleDonors.length
        });

        logWithExtra(logger, 'info', 'Blood request created', {
            requestId: bloodRequest.id,
            bloodType: bloodRequest.blood_type,
            urgency: bloodRequest.urgency,
            unitsNeeded: requestData.units_needed,
            compatibleDonorsFound: compatibleDonors.length
        });

        res.status(201).json({
            success: true,
            message: 'Blood request created successfully',
            request: bloodRequest,
            compatible_donors_found: compatibleDonors.length,
            estimated_response_time: matchingService.calculateEstimatedResponseTime(
                requestData.urgency, 
                compatibleDonors.length
            )
        });

    } catch (error) {
        logger.error('Blood request creation error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

app.get('/api/recipients/requests', async (req, res) => {
    try {
        const { status, urgency, blood_type, page = 1, limit = 20 } = req.query;
        
        const requests = await dbManager.getBloodRequests({
            status,
            urgency,
            blood_type,
            page: parseInt(page),
            limit: parseInt(limit)
        });

        res.json({
            success: true,
            requests: requests.data,
            pagination: requests.pagination
        });

    } catch (error) {
        logger.error('Blood requests fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Matching endpoints
app.post('/api/matching/find-donors', [
    body('blood_type').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
    body('location.lat').isFloat({ min: -90, max: 90 }),
    body('location.lng').isFloat({ min: -180, max: 180 }),
    body('radius').optional().isInt({ min: 1, max: 200 }),
    body('urgency').optional().isIn(['low', 'medium', 'high', 'critical'])
], async (req, res) => {
    try {
        const { blood_type, location, radius = 50, urgency = 'medium' } = req.body;

        const donors = await matchingService.findDonorsByBloodType(blood_type, {
            location,
            radius,
            urgency,
            availability: true
        });

        res.json({
            success: true,
            donors,
            total_found: donors.length,
            search_radius: radius,
            blood_type
        });

    } catch (error) {
        logger.error('Donor search error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

app.post('/api/matching/confirm', [
    body('request_id').isUUID(),
    body('donor_id').isUUID(),
    body('donation_date').isISO8601(),
    body('hospital_id').isUUID()
], async (req, res) => {
    try {
        const { request_id, donor_id, donation_date, hospital_id } = req.body;

        // Create donation record
        const donation = await dbManager.createDonation({
            request_id,
            donor_id,
            hospital_id,
            donation_date: new Date(donation_date),
            status: 'scheduled'
        });

        // Update request status
        await dbManager.updateBloodRequestStatus(request_id, 'matched');

        // Update donor availability
        await dbManager.updateDonorAvailability(donor_id, {
            availability: false,
            last_donation_scheduled: new Date(donation_date)
        });

        // Send confirmation notifications
        await notificationService.notifyDonationConfirmed(donation);

        // Emit real-time event
        io.emit('donation_confirmed', {
            donation,
            request_id,
            donor_id
        });

        logWithExtra(logger, 'info', 'Donation confirmed', {
            donationId: donation.id,
            requestId: request_id,
            donorId: donor_id,
            donationDate: donation_date
        });

        res.json({
            success: true,
            message: 'Donation confirmed successfully',
            donation
        });

    } catch (error) {
        logger.error('Donation confirmation error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Blood bank endpoints
app.get('/api/blood-banks', async (req, res) => {
    try {
        const { location, radius = 50 } = req.query;
        
        let bloodBanks;
        if (location) {
            const [lat, lng] = location.split(',').map(parseFloat);
            bloodBanks = await dbManager.getNearbyBloodBanks({ lat, lng }, radius);
        } else {
            bloodBanks = await dbManager.getAllBloodBanks();
        }

        res.json({
            success: true,
            blood_banks: bloodBanks
        });

    } catch (error) {
        logger.error('Blood banks fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

app.get('/api/blood-banks/:bankId/inventory', async (req, res) => {
    try {
        const { bankId } = req.params;
        
        const inventory = await inventoryService.getBloodBankInventory(bankId);

        res.json({
            success: true,
            inventory,
            last_updated: new Date().toISOString()
        });

    } catch (error) {
        logger.error('Inventory fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Analytics endpoints
app.get('/api/analytics/dashboard', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        const analytics = await dbManager.getDashboardAnalytics({
            start_date: start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            end_date: end_date ? new Date(end_date) : new Date()
        });

        res.json({
            success: true,
            analytics
        });

    } catch (error) {
        logger.error('Analytics fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    logger.info('Client connected to blood platform', { socketId: socket.id });

    socket.on('join_donor_room', (donorId) => {
        socket.join(`donor_${donorId}`);
        logger.info('Donor joined room', { donorId, socketId: socket.id });
    });

    socket.on('join_recipient_room', (recipientId) => {
        socket.join(`recipient_${recipientId}`);
        logger.info('Recipient joined room', { recipientId, socketId: socket.id });
    });

    socket.on('join_hospital_room', (hospitalId) => {
        socket.join(`hospital_${hospitalId}`);
        logger.info('Hospital joined room', { hospitalId, socketId: socket.id });
    });

    socket.on('disconnect', () => {
        logger.info('Client disconnected from blood platform', { socketId: socket.id });
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Initialize database and start server
async function startServer() {
    try {
        // Initialize database
        await dbManager.initialize();
        logger.info('Database initialized successfully');

        // Initialize services
        await matchingService.initialize();
        await notificationService.initialize();
        await inventoryService.initialize();

        // Start server
        const port = process.env.PORT || 3000;
        server.listen(port, () => {
            logger.info(`Blood platform started on port ${port}`);
            logger.info(`Health check: http://localhost:${port}/health`);
        });

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await dbManager.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    await dbManager.close();
    process.exit(0);
});

// Start the server
startServer();