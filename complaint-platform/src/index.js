#!/usr/bin/env node

/**
 * Local Lens Complaint Management Platform
 * Citizen complaint filing and authority management system
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

// Import custom modules
const DatabaseManager = require('./config/database');
const ComplaintService = require('./services/complaintService');
const RoutingService = require('./services/routingService');
const NotificationService = require('./services/notificationService');
const AnalyticsService = require('./services/analyticsService');
const { setupLogger, logWithExtra } = require('./utils/logger');
const { validateCoordinates, generateComplaintId, sanitizeInput } = require('./utils/helpers');

// Initialize Express app and Socket.IO
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

const logger = setupLogger('complaint-platform');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 5 // Maximum 5 files
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images and documents are allowed.'));
        }
    }
});

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Initialize services
const dbManager = new DatabaseManager();
const complaintService = new ComplaintService();
const routingService = new RoutingService();
const notificationService = new NotificationService(io);
const analyticsService = new AnalyticsService();

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'complaint-platform',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: process.uptime()
    });
});

// Complaint filing endpoints
app.post('/api/complaints', upload.array('attachments', 5), [
    body('title').isLength({ min: 5, max: 200 }).trim().escape(),
    body('description').isLength({ min: 10, max: 2000 }).trim().escape(),
    body('category').isIn(['infrastructure', 'sanitation', 'traffic', 'noise', 'water', 'electricity', 'public_safety', 'environment', 'other']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('location.lat').isFloat({ min: -90, max: 90 }),
    body('location.lng').isFloat({ min: -180, max: 180 }),
    body('location.address').optional().isLength({ max: 500 }).trim(),
    body('citizen_name').isLength({ min: 2, max: 100 }).trim().escape(),
    body('citizen_email').isEmail().normalizeEmail(),
    body('citizen_phone').isMobilePhone(),
    body('is_anonymous').optional().isBoolean()
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

        const complaintData = {
            ...req.body,
            attachments: req.files ? req.files.map(file => ({
                filename: file.filename,
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                path: file.path
            })) : []
        };

        // Generate unique complaint ID
        complaintData.complaint_id = generateComplaintId();

        // Create complaint
        const complaint = await complaintService.createComplaint(complaintData);

        // Route to appropriate authority
        const assignedAuthority = await routingService.routeComplaint(complaint);

        // Send notifications
        await notificationService.notifyComplaintFiled(complaint, assignedAuthority);

        // Emit real-time event
        io.emit('complaint_filed', {
            complaint_id: complaint.complaint_id,
            category: complaint.category,
            priority: complaint.priority,
            location: complaint.location
        });

        logWithExtra(logger, 'info', 'Complaint filed successfully', {
            complaintId: complaint.complaint_id,
            category: complaint.category,
            priority: complaint.priority,
            authorityId: assignedAuthority?.id
        });

        res.status(201).json({
            success: true,
            message: 'Complaint filed successfully',
            complaint: {
                complaint_id: complaint.complaint_id,
                title: complaint.title,
                category: complaint.category,
                priority: complaint.priority,
                status: complaint.status,
                assigned_authority: assignedAuthority,
                estimated_resolution_time: complaintService.calculateEstimatedResolutionTime(complaint),
                created_at: complaint.created_at
            }
        });

    } catch (error) {
        logger.error('Complaint filing error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

app.get('/api/complaints/:complaintId', async (req, res) => {
    try {
        const { complaintId } = req.params;
        
        const complaint = await complaintService.getComplaintById(complaintId);
        
        if (!complaint) {
            return res.status(404).json({
                success: false,
                error: 'Complaint not found'
            });
        }

        res.json({
            success: true,
            complaint
        });

    } catch (error) {
        logger.error('Complaint fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

app.get('/api/complaints', async (req, res) => {
    try {
        const {
            status,
            category,
            priority,
            authority_id,
            citizen_email,
            start_date,
            end_date,
            page = 1,
            limit = 20
        } = req.query;

        const complaints = await complaintService.getComplaints({
            status,
            category,
            priority,
            authority_id,
            citizen_email,
            start_date,
            end_date,
            page: parseInt(page),
            limit: parseInt(limit)
        });

        res.json({
            success: true,
            complaints: complaints.data,
            pagination: complaints.pagination
        });

    } catch (error) {
        logger.error('Complaints fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Complaint status update endpoints
app.put('/api/complaints/:complaintId/status', [
    body('status').isIn(['filed', 'acknowledged', 'in_progress', 'resolved', 'closed', 'rejected']),
    body('authority_id').optional().isUUID(),
    body('resolution_notes').optional().isLength({ max: 1000 }).trim(),
    body('estimated_resolution_date').optional().isISO8601()
], async (req, res) => {
    try {
        const { complaintId } = req.params;
        const { status, authority_id, resolution_notes, estimated_resolution_date } = req.body;

        const updatedComplaint = await complaintService.updateComplaintStatus(complaintId, {
            status,
            authority_id,
            resolution_notes,
            estimated_resolution_date: estimated_resolution_date ? new Date(estimated_resolution_date) : null,
            updated_by: authority_id,
            updated_at: new Date()
        });

        if (!updatedComplaint) {
            return res.status(404).json({
                success: false,
                error: 'Complaint not found'
            });
        }

        // Send status update notification
        await notificationService.notifyStatusUpdate(updatedComplaint);

        // Emit real-time event
        io.emit('complaint_status_updated', {
            complaint_id: complaintId,
            status,
            updated_at: new Date().toISOString()
        });

        logWithExtra(logger, 'info', 'Complaint status updated', {
            complaintId,
            status,
            authorityId: authority_id
        });

        res.json({
            success: true,
            message: 'Complaint status updated successfully',
            complaint: updatedComplaint
        });

    } catch (error) {
        logger.error('Complaint status update error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

app.post('/api/complaints/:complaintId/comments', [
    body('comment').isLength({ min: 1, max: 1000 }).trim().escape(),
    body('author_type').isIn(['citizen', 'authority']),
    body('author_id').isUUID(),
    body('is_public').optional().isBoolean()
], async (req, res) => {
    try {
        const { complaintId } = req.params;
        const commentData = req.body;

        const comment = await complaintService.addComment(complaintId, commentData);

        // Send notification about new comment
        await notificationService.notifyNewComment(complaintId, comment);

        // Emit real-time event
        io.emit('complaint_comment_added', {
            complaint_id: complaintId,
            comment
        });

        res.status(201).json({
            success: true,
            message: 'Comment added successfully',
            comment
        });

    } catch (error) {
        logger.error('Comment addition error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Authority management endpoints
app.get('/api/authorities', async (req, res) => {
    try {
        const { category, location, active_only = true } = req.query;
        
        const authorities = await routingService.getAuthorities({
            category,
            location,
            active_only: active_only === 'true'
        });

        res.json({
            success: true,
            authorities
        });

    } catch (error) {
        logger.error('Authorities fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

app.get('/api/authorities/:authorityId/complaints', async (req, res) => {
    try {
        const { authorityId } = req.params;
        const { status, priority, page = 1, limit = 20 } = req.query;

        const complaints = await complaintService.getComplaintsByAuthority(authorityId, {
            status,
            priority,
            page: parseInt(page),
            limit: parseInt(limit)
        });

        res.json({
            success: true,
            complaints: complaints.data,
            pagination: complaints.pagination
        });

    } catch (error) {
        logger.error('Authority complaints fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Analytics endpoints
app.get('/api/analytics/dashboard', async (req, res) => {
    try {
        const { start_date, end_date, authority_id, category } = req.query;
        
        const analytics = await analyticsService.getDashboardAnalytics({
            start_date: start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            end_date: end_date ? new Date(end_date) : new Date(),
            authority_id,
            category
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

app.get('/api/analytics/trends', async (req, res) => {
    try {
        const { period = '30d', category, location } = req.query;
        
        const trends = await analyticsService.getComplaintTrends({
            period,
            category,
            location
        });

        res.json({
            success: true,
            trends
        });

    } catch (error) {
        logger.error('Trends fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Geospatial endpoints
app.get('/api/complaints/nearby', [
    body('lat').isFloat({ min: -90, max: 90 }),
    body('lng').isFloat({ min: -180, max: 180 }),
    body('radius').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
    try {
        const { lat, lng, radius = 5, category, status } = req.query;
        
        const nearbyComplaints = await complaintService.getNearbyComplaints({
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            radius: parseInt(radius),
            category,
            status
        });

        res.json({
            success: true,
            complaints: nearbyComplaints,
            search_center: { lat: parseFloat(lat), lng: parseFloat(lng) },
            search_radius: parseInt(radius)
        });

    } catch (error) {
        logger.error('Nearby complaints fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Citizen feedback endpoints
app.post('/api/complaints/:complaintId/feedback', [
    body('rating').isInt({ min: 1, max: 5 }),
    body('feedback_text').optional().isLength({ max: 500 }).trim(),
    body('citizen_email').isEmail().normalizeEmail()
], async (req, res) => {
    try {
        const { complaintId } = req.params;
        const feedbackData = req.body;

        const feedback = await complaintService.addFeedback(complaintId, feedbackData);

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            feedback
        });

    } catch (error) {
        logger.error('Feedback submission error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    logger.info('Client connected to complaint platform', { socketId: socket.id });

    socket.on('join_citizen_room', (citizenEmail) => {
        socket.join(`citizen_${citizenEmail}`);
        logger.info('Citizen joined room', { citizenEmail, socketId: socket.id });
    });

    socket.on('join_authority_room', (authorityId) => {
        socket.join(`authority_${authorityId}`);
        logger.info('Authority joined room', { authorityId, socketId: socket.id });
    });

    socket.on('join_complaint_room', (complaintId) => {
        socket.join(`complaint_${complaintId}`);
        logger.info('Joined complaint room', { complaintId, socketId: socket.id });
    });

    socket.on('disconnect', () => {
        logger.info('Client disconnected from complaint platform', { socketId: socket.id });
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File too large. Maximum size is 10MB.'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: 'Too many files. Maximum is 5 files.'
            });
        }
    }
    
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
        await complaintService.initialize();
        await routingService.initialize();
        await notificationService.initialize();
        await analyticsService.initialize();

        // Start server
        const port = process.env.PORT || 3000;
        server.listen(port, () => {
            logger.info(`Complaint platform started on port ${port}`);
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