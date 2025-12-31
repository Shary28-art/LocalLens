/**
 * Blood Platform Logging Utilities
 * Centralized logging configuration for the blood donation platform
 */

const winston = require('winston');
const path = require('path');

/**
 * Setup logger with appropriate configuration
 */
function setupLogger(service = 'blood-platform') {
    const logFormat = winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
            return JSON.stringify({
                timestamp,
                level,
                service,
                message,
                ...meta
            });
        })
    );

    const logger = winston.createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: logFormat,
        defaultMeta: { service },
        transports: [
            // Console transport for development
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple(),
                    winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
                        const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
                        return `${timestamp} [${service}] ${level}: ${message} ${metaStr}`;
                    })
                )
            }),

            // File transport for production logs
            new winston.transports.File({
                filename: path.join(process.cwd(), 'logs', 'error.log'),
                level: 'error',
                maxsize: 5242880, // 5MB
                maxFiles: 5
            }),

            new winston.transports.File({
                filename: path.join(process.cwd(), 'logs', 'combined.log'),
                maxsize: 5242880, // 5MB
                maxFiles: 5
            })
        ],

        // Handle uncaught exceptions
        exceptionHandlers: [
            new winston.transports.File({
                filename: path.join(process.cwd(), 'logs', 'exceptions.log')
            })
        ],

        // Handle unhandled promise rejections
        rejectionHandlers: [
            new winston.transports.File({
                filename: path.join(process.cwd(), 'logs', 'rejections.log')
            })
        ]
    });

    return logger;
}

/**
 * Log with additional context information
 */
function logWithExtra(logger, level, message, extra = {}) {
    logger.log(level, message, {
        ...extra,
        timestamp: new Date().toISOString(),
        pid: process.pid,
        memory: process.memoryUsage(),
        uptime: process.uptime()
    });
}

/**
 * Log API request information
 */
function logRequest(logger, req, res, responseTime) {
    const logData = {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        responseTime: `${responseTime}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        contentLength: res.get('Content-Length') || 0
    };

    if (res.statusCode >= 400) {
        logger.warn('HTTP Request Error', logData);
    } else {
        logger.info('HTTP Request', logData);
    }
}

/**
 * Log database operations
 */
function logDatabaseOperation(logger, operation, table, data = {}) {
    logger.info('Database Operation', {
        operation,
        table,
        data: typeof data === 'object' ? JSON.stringify(data) : data,
        timestamp: new Date().toISOString()
    });
}

/**
 * Log blood donation events
 */
function logBloodDonationEvent(logger, event, data = {}) {
    const eventTypes = {
        'donor_registered': 'Donor Registration',
        'request_created': 'Blood Request Created',
        'match_found': 'Donor-Recipient Match Found',
        'donation_scheduled': 'Donation Scheduled',
        'donation_completed': 'Donation Completed',
        'emergency_alert': 'Emergency Blood Alert',
        'inventory_updated': 'Blood Inventory Updated',
        'stock_alert': 'Stock Level Alert'
    };

    logger.info(eventTypes[event] || 'Blood Platform Event', {
        event,
        ...data,
        timestamp: new Date().toISOString()
    });
}

/**
 * Log performance metrics
 */
function logPerformanceMetric(logger, metric, value, unit = 'ms') {
    logger.info('Performance Metric', {
        metric,
        value,
        unit,
        timestamp: new Date().toISOString()
    });
}

/**
 * Log security events
 */
function logSecurityEvent(logger, event, details = {}) {
    logger.warn('Security Event', {
        event,
        ...details,
        timestamp: new Date().toISOString(),
        severity: 'medium'
    });
}

/**
 * Create request logging middleware
 */
function createRequestLogger(logger) {
    return (req, res, next) => {
        const start = Date.now();
        
        res.on('finish', () => {
            const responseTime = Date.now() - start;
            logRequest(logger, req, res, responseTime);
        });
        
        next();
    };
}

/**
 * Log application startup
 */
function logStartup(logger, config = {}) {
    logger.info('Blood Platform Starting', {
        version: config.version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        port: config.port || process.env.PORT || 3000,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        timestamp: new Date().toISOString()
    });
}

/**
 * Log application shutdown
 */
function logShutdown(logger, reason = 'unknown') {
    logger.info('Blood Platform Shutting Down', {
        reason,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
}

module.exports = {
    setupLogger,
    logWithExtra,
    logRequest,
    logDatabaseOperation,
    logBloodDonationEvent,
    logPerformanceMetric,
    logSecurityEvent,
    createRequestLogger,
    logStartup,
    logShutdown
};