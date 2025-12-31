/**
 * Helper utility functions for authentication service
 */

const crypto = require('crypto');
const validator = require('validator');

/**
 * Validate input data
 */
function validateInput(data, rules) {
    const errors = [];
    
    Object.keys(rules).forEach(field => {
        const value = data[field];
        const rule = rules[field];
        
        // Check required fields
        if (rule.required && (!value || value.toString().trim() === '')) {
            errors.push(`${field} is required`);
            return;
        }
        
        // Skip validation if field is not required and empty
        if (!rule.required && (!value || value.toString().trim() === '')) {
            return;
        }
        
        // Type validation
        if (rule.type) {
            switch (rule.type) {
                case 'email':
                    if (!validator.isEmail(value)) {
                        errors.push(`${field} must be a valid email`);
                    }
                    break;
                case 'string':
                    if (typeof value !== 'string') {
                        errors.push(`${field} must be a string`);
                    }
                    break;
                case 'number':
                    if (isNaN(value)) {
                        errors.push(`${field} must be a number`);
                    }
                    break;
                case 'boolean':
                    if (typeof value !== 'boolean') {
                        errors.push(`${field} must be a boolean`);
                    }
                    break;
            }
        }
        
        // Length validation
        if (rule.minLength && value.length < rule.minLength) {
            errors.push(`${field} must be at least ${rule.minLength} characters`);
        }
        
        if (rule.maxLength && value.length > rule.maxLength) {
            errors.push(`${field} must be no more than ${rule.maxLength} characters`);
        }
        
        // Pattern validation
        if (rule.pattern && !rule.pattern.test(value)) {
            errors.push(`${field} format is invalid`);
        }
        
        // Custom validation
        if (rule.custom && typeof rule.custom === 'function') {
            const customResult = rule.custom(value);
            if (customResult !== true) {
                errors.push(customResult || `${field} is invalid`);
            }
        }
    });
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Sanitize input to prevent XSS and injection attacks
 */
function sanitizeInput(input) {
    if (typeof input === 'string') {
        return validator.escape(input.trim());
    }
    
    if (typeof input === 'object' && input !== null) {
        const sanitized = {};
        Object.keys(input).forEach(key => {
            sanitized[key] = sanitizeInput(input[key]);
        });
        return sanitized;
    }
    
    return input;
}

/**
 * Generate secure random token
 */
function generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash data using SHA-256
 */
function hashData(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate HMAC signature
 */
function generateHMAC(data, secret) {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Verify HMAC signature
 */
function verifyHMAC(data, signature, secret) {
    const expectedSignature = generateHMAC(data, secret);
    return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
    );
}

/**
 * Validate password strength
 */
function validatePasswordStrength(password) {
    const errors = [];
    
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    
    if (!/[@$!%*?&]/.test(password)) {
        errors.push('Password must contain at least one special character (@$!%*?&)');
    }
    
    // Check for common weak passwords
    const commonPasswords = [
        'password', '123456', '123456789', 'qwerty', 'abc123',
        'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
        errors.push('Password is too common, please choose a stronger password');
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        score: calculatePasswordScore(password)
    };
}

/**
 * Calculate password strength score (0-100)
 */
function calculatePasswordScore(password) {
    let score = 0;
    
    // Length bonus
    score += Math.min(password.length * 4, 25);
    
    // Character variety bonus
    if (/[a-z]/.test(password)) score += 5;
    if (/[A-Z]/.test(password)) score += 5;
    if (/\d/.test(password)) score += 5;
    if (/[@$!%*?&]/.test(password)) score += 10;
    if (/[^a-zA-Z0-9@$!%*?&]/.test(password)) score += 5;
    
    // Pattern penalties
    if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
    if (/123|abc|qwe/i.test(password)) score -= 10; // Sequential characters
    
    return Math.max(0, Math.min(100, score));
}

/**
 * Validate email format and domain
 */
function validateEmail(email) {
    if (!validator.isEmail(email)) {
        return { isValid: false, error: 'Invalid email format' };
    }
    
    // Check for disposable email domains
    const disposableDomains = [
        '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
        'mailinator.com', 'throwaway.email'
    ];
    
    const domain = email.split('@')[1].toLowerCase();
    if (disposableDomains.includes(domain)) {
        return { isValid: false, error: 'Disposable email addresses are not allowed' };
    }
    
    return { isValid: true };
}

/**
 * Rate limiting helper
 */
class RateLimiter {
    constructor(windowMs = 15 * 60 * 1000, maxAttempts = 5) {
        this.windowMs = windowMs;
        this.maxAttempts = maxAttempts;
        this.attempts = new Map();
    }
    
    isAllowed(identifier) {
        const now = Date.now();
        const windowStart = now - this.windowMs;
        
        // Clean old entries
        this.attempts.forEach((timestamps, key) => {
            const validTimestamps = timestamps.filter(ts => ts > windowStart);
            if (validTimestamps.length === 0) {
                this.attempts.delete(key);
            } else {
                this.attempts.set(key, validTimestamps);
            }
        });
        
        // Check current attempts
        const userAttempts = this.attempts.get(identifier) || [];
        const recentAttempts = userAttempts.filter(ts => ts > windowStart);
        
        if (recentAttempts.length >= this.maxAttempts) {
            return {
                allowed: false,
                resetTime: Math.min(...recentAttempts) + this.windowMs
            };
        }
        
        // Record this attempt
        recentAttempts.push(now);
        this.attempts.set(identifier, recentAttempts);
        
        return {
            allowed: true,
            remaining: this.maxAttempts - recentAttempts.length
        };
    }
    
    reset(identifier) {
        this.attempts.delete(identifier);
    }
}

/**
 * Generate user-friendly error messages
 */
function formatErrorMessage(error) {
    const errorMap = {
        'INVALID_CREDENTIALS': 'Invalid email or password',
        'USER_NOT_FOUND': 'User not found',
        'USER_ALREADY_EXISTS': 'An account with this email already exists',
        'INVALID_TOKEN': 'Invalid or expired token',
        'INSUFFICIENT_PERMISSIONS': 'You do not have permission to perform this action',
        'RATE_LIMIT_EXCEEDED': 'Too many attempts. Please try again later',
        'WEAK_PASSWORD': 'Password does not meet security requirements',
        'INVALID_EMAIL': 'Please enter a valid email address'
    };
    
    return errorMap[error] || 'An unexpected error occurred';
}

/**
 * Parse user agent for device information
 */
function parseUserAgent(userAgent) {
    if (!userAgent) return { browser: 'Unknown', os: 'Unknown', device: 'Unknown' };
    
    const browser = /Chrome/.test(userAgent) ? 'Chrome' :
                   /Firefox/.test(userAgent) ? 'Firefox' :
                   /Safari/.test(userAgent) ? 'Safari' :
                   /Edge/.test(userAgent) ? 'Edge' : 'Unknown';
    
    const os = /Windows/.test(userAgent) ? 'Windows' :
              /Mac/.test(userAgent) ? 'macOS' :
              /Linux/.test(userAgent) ? 'Linux' :
              /Android/.test(userAgent) ? 'Android' :
              /iOS/.test(userAgent) ? 'iOS' : 'Unknown';
    
    const device = /Mobile/.test(userAgent) ? 'Mobile' :
                  /Tablet/.test(userAgent) ? 'Tablet' : 'Desktop';
    
    return { browser, os, device };
}

/**
 * Generate audit log entry
 */
function generateAuditLog(action, userId, details = {}) {
    return {
        timestamp: new Date().toISOString(),
        action,
        user_id: userId,
        details,
        session_id: details.sessionId || null,
        ip_address: details.ipAddress || null,
        user_agent: details.userAgent || null
    };
}

/**
 * Mask sensitive data for logging
 */
function maskSensitiveData(data) {
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'hash'];
    const masked = { ...data };
    
    Object.keys(masked).forEach(key => {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
            masked[key] = '***MASKED***';
        }
    });
    
    return masked;
}

/**
 * Convert time string to milliseconds
 */
function parseTimeToMs(timeString) {
    const units = {
        's': 1000,
        'm': 60 * 1000,
        'h': 60 * 60 * 1000,
        'd': 24 * 60 * 60 * 1000
    };
    
    const match = timeString.match(/^(\d+)([smhd])$/);
    if (!match) {
        throw new Error('Invalid time format. Use format like "30s", "5m", "2h", "1d"');
    }
    
    const [, value, unit] = match;
    return parseInt(value) * units[unit];
}

/**
 * Check if IP address is in allowed range
 */
function isIPAllowed(ip, allowedRanges = []) {
    if (allowedRanges.length === 0) return true;
    
    // Simple IP range checking (can be enhanced with proper CIDR support)
    return allowedRanges.some(range => {
        if (range.includes('/')) {
            // CIDR notation - simplified check
            const [network, prefix] = range.split('/');
            return ip.startsWith(network.split('.').slice(0, Math.floor(prefix / 8)).join('.'));
        } else {
            // Exact match or wildcard
            return ip === range || range === '*';
        }
    });
}

module.exports = {
    validateInput,
    sanitizeInput,
    generateSecureToken,
    hashData,
    generateHMAC,
    verifyHMAC,
    validatePasswordStrength,
    calculatePasswordScore,
    validateEmail,
    RateLimiter,
    formatErrorMessage,
    parseUserAgent,
    generateAuditLog,
    maskSensitiveData,
    parseTimeToMs,
    isIPAllowed
};