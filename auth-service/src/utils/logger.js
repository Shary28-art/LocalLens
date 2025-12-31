/**
 * Logging Configuration for Authentication Service
 */

const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for structured logging
const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return JSON.stringify({
            timestamp,
            level,
            message,
            service: 'auth-service',
            ...meta
        });
    })
);

// Console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        return `${timestamp} [${level}]: ${message} ${metaStr}`;
    })
);

/**
 * Setup logger with appropriate transports
 */
function setupLogger(module = 'auth-service') {
    const logger = winston.createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: logFormat,
        defaultMeta: { module },
        transports: [
            // File transport for all logs
            new winston.transports.File({
                filename: path.join(logsDir, 'auth-service.log'),
                maxsize: 10 * 1024 * 1024, // 10MB
                maxFiles: 5
            }),
            
            // File transport for errors only
            new winston.transports.File({
                filename: path.join(logsDir, 'auth-errors.log'),
                level: 'error',
                maxsize: 10 * 1024 * 1024, // 10MB
                maxFiles: 3
            })
        ]
    });

    // Add console transport for development
    if (process.env.NODE_ENV !== 'production') {
        logger.add(new winston.transports.Console({
            format: consoleFormat
        }));
    }

    return logger;
}

/**
 * Log with extra structured data
 */
function logWithExtra(logger, level, message, extraData = {}) {
    logger.log(level, message, extraData);
}

/**
 * Performance monitoring decorator
 */
function logPerformance(logger) {
    return function(target, propertyName, descriptor) {
        const method = descriptor.value;
        
        descriptor.value = async function(...args) {
            const start = Date.now();
            const methodName = `${target.constructor.name}.${propertyName}`;
            
            try {
                const result = await method.apply(this, args);
                const duration = Date.now() - start;
                
                logWithExtra(logger, 'info', `Method completed: ${methodName}`, {
                    method: methodName,
                    duration_ms: duration,
                    status: 'success'
                });
                
                return result;
            } catch (error) {
                const duration = Date.now() - start;
                
                logWithExtra(logger, 'error', `Method failed: ${methodName}`, {
                    method: methodName,
                    duration_ms: duration,
                    status: 'error',
                    error: error.message,
                    stack: error.stack
                });
                
                throw error;
            }
        };
        
        return descriptor;
    };
}

/**
 * Log authentication events
 */
function logAuthEvent(logger, eventType, userId, extraData = {}) {
    logWithExtra(logger, 'info', `Auth event: ${eventType}`, {
        event_type: eventType,
        user_id: userId,
        timestamp: new Date().toISOString(),
        ...extraData
    });
}

/**
 * Log security events
 */
function logSecurityEvent(logger, eventType, details = {}) {
    logWithExtra(logger, 'warn', `Security event: ${eventType}`, {
        event_type: eventType,
        security_level: 'high',
        timestamp: new Date().toISOString(),
        ...details
    });
}

/**
 * Log API requests
 */
function logApiRequest(logger, req, res, responseTime) {
    const { method, url, ip, headers } = req;
    const { statusCode } = res;
    
    logWithExtra(logger, 'info', `API Request: ${method} ${url}`, {
        method,
        url,
        status_code: statusCode,
        ip_address: ip,
        user_agent: headers['user-agent'],
        response_time_ms: responseTime,
        timestamp: new Date().toISOString()
    });
}

module.exports = {
    setupLogger,
    logWithExtra,
    logPerformance,
    logAuthEvent,
    logSecurityEvent,
    logApiRequest
};