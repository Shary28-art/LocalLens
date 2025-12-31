/**
 * Complaint Platform Logging Utilities
 * Centralized logging configuration for the complaint management platform
 */

const winston = require('winston');
const path = require('path');

/**
 * Setup logger with appropriate configuration
 */
function setupLogger(service = 'complaint-platform') {
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
 * Log complaint management events
 */
function logComplaintEvent(logger, event, data = {}) {
    const eventTypes = {
        'complaint_filed': 'Complaint Filed',
        'complaint_assigned': 'Complaint Assigned',
        'status_updated': 'Status Updated',
        'comment_added': 'Comment Added',
        'feedback_submitted': 'Feedback Submitted',
        'complaint_escalated': 'Complaint Escalated',
        'complaint_resolved': 'Complaint Resolved',
        'authority_notified': 'Authority Notified',
        'citizen_notified': 'Citizen Notified'
    };

    logger.info(eventTypes[event] || 'Complaint Platform Event', {
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
 * Log file upload events
 */
function logFileUpload(logger, filename, size, mimetype, complaintId) {
    logger.info('File Upload', {
        filename,
        size,
        mimetype,
        complaint_id: complaintId,
        timestamp: new Date().toISOString()
    });
}

/**
 * Log notification events
 */
function logNotificationEvent(logger, type, recipient, success, error = null) {
    const logData = {
        notification_type: type,
        recipient,
        success,
        timestamp: new Date().toISOString()
    };

    if (error) {
        logData.error = error;
        logger.error('Notification Failed', logData);
    } else {
        logger.info('Notification Sent', logData);
    }
}

/**
 * Log routing decisions
 */
function logRoutingDecision(logger, complaintId, fromAuthority, toAuthority, reason) {
    logger.info('Complaint Routing', {
        complaint_id: complaintId,
        from_authority: fromAuthority,
        to_authority: toAuthority,
        reason,
        timestamp: new Date().toISOString()
    });
}

/**
 * Log analytics queries
 */
function logAnalyticsQuery(logger, queryType, filters, executionTime) {
    logger.info('Analytics Query', {
        query_type: queryType,
        filters,
        execution_time: executionTime,
        timestamp: new Date().toISOString()
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
    logger.info('Complaint Platform Starting', {
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
    logger.info('Complaint Platform Shutting Down', {
        reason,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
}

/**
 * Log error with context
 */
function logError(logger, error, context = {}) {
    logger.error('Application Error', {
        error: {
            message: error.message,
            stack: error.stack,
            name: error.name
        },
        context,
        timestamp: new Date().toISOString()
    });
}

/**
 * Log validation errors
 */
function logValidationError(logger, errors, requestData = {}) {
    logger.warn('Validation Error', {
        validation_errors: errors,
        request_data: requestData,
        timestamp: new Date().toISOString()
    });
}

/**
 * Log rate limiting events
 */
function logRateLimit(logger, ip, endpoint, limit) {
    logger.warn('Rate Limit Exceeded', {
        ip,
        endpoint,
        limit,
        timestamp: new Date().toISOString()
    });
}

/**
 * Log cache operations
 */
function logCacheOperation(logger, operation, key, hit = null) {
    const logData = {
        cache_operation: operation,
        cache_key: key,
        timestamp: new Date().toISOString()
    };

    if (hit !== null) {
        logData.cache_hit = hit;
    }

    logger.debug('Cache Operation', logData);
}

module.exports = {
    setupLogger,
    logWithExtra,
    logRequest,
    logDatabaseOperation,
    logComplaintEvent,
    logPerformanceMetric,
    logSecurityEvent,
    logFileUpload,
    logNotificationEvent,
    logRoutingDecision,
    logAnalyticsQuery,
    createRequestLogger,
    logStartup,
    logShutdown,
    logError,
    logValidationError,
    logRateLimit,
    logCacheOperation
};