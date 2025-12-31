/**
 * Authentication Service - Core Business Logic
 * Handles user authentication, JWT tokens, and session management
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const redis = require('redis');
const { v4: uuidv4 } = require('uuid');
const DatabaseManager = require('../config/database');

class AuthService {
    constructor() {
        this.dbManager = new DatabaseManager();
        this.redisClient = redis.createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });
        
        this.redisClient.on('error', (err) => {
            console.error('Redis Client Error:', err);
        });
        
        this.redisClient.connect();
        
        this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
        this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
        this.refreshTokenExpiresIn = '7d';
    }

    /**
     * Create a new user
     */
    async createUser(userData) {
        const { email, password, name, role = 'citizen', phone, location } = userData;
        
        // Hash password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        // Create user in database
        const user = await this.dbManager.createUser({
            email,
            password_hash: passwordHash,
            name,
            role,
            phone,
            location: location ? JSON.stringify(location) : null,
            platforms_access: [role === 'admin' ? 'all' : 'basic']
        });
        
        return user;
    }

    /**
     * Authenticate user with email and password
     */
    async authenticateUser(email, password) {
        const user = await this.dbManager.getUserByEmail(email);
        
        if (!user) {
            return null;
        }
        
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!isValidPassword) {
            return null;
        }
        
        return user;
    }

    /**
     * Generate JWT access token
     */
    generateToken(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            platforms_access: user.platforms_access
        };
        
        return jwt.sign(payload, this.jwtSecret, {
            expiresIn: this.jwtExpiresIn,
            issuer: 'local-lens-auth',
            audience: 'local-lens-platforms'
        });
    }

    /**
     * Generate refresh token
     */
    generateRefreshToken(user) {
        const payload = {
            userId: user.id,
            tokenId: uuidv4(),
            type: 'refresh'
        };
        
        return jwt.sign(payload, this.jwtSecret, {
            expiresIn: this.refreshTokenExpiresIn,
            issuer: 'local-lens-auth'
        });
    }

    /**
     * Verify JWT token
     */
    verifyToken(token) {
        try {
            return jwt.verify(token, this.jwtSecret);
        } catch (error) {
            return null;
        }
    }

    /**
     * Store refresh token in Redis
     */
    async storeRefreshToken(userId, refreshToken) {
        const decoded = jwt.decode(refreshToken);
        const key = `refresh_token:${userId}:${decoded.tokenId}`;
        
        // Store for 7 days
        await this.redisClient.setEx(key, 7 * 24 * 60 * 60, refreshToken);
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, this.jwtSecret);
            
            if (decoded.type !== 'refresh') {
                return { success: false, error: 'Invalid token type' };
            }
            
            // Check if refresh token exists in Redis
            const key = `refresh_token:${decoded.userId}:${decoded.tokenId}`;
            const storedToken = await this.redisClient.get(key);
            
            if (!storedToken || storedToken !== refreshToken) {
                return { success: false, error: 'Invalid refresh token' };
            }
            
            // Get user data
            const user = await this.dbManager.getUserById(decoded.userId);
            if (!user) {
                return { success: false, error: 'User not found' };
            }
            
            // Generate new tokens
            const newAccessToken = this.generateToken(user);
            const newRefreshToken = this.generateRefreshToken(user);
            
            // Store new refresh token and remove old one
            await this.redisClient.del(key);
            await this.storeRefreshToken(user.id, newRefreshToken);
            
            return {
                success: true,
                token: newAccessToken,
                refreshToken: newRefreshToken
            };
            
        } catch (error) {
            return { success: false, error: 'Invalid refresh token' };
        }
    }

    /**
     * Invalidate refresh token
     */
    async invalidateRefreshToken(refreshToken) {
        try {
            const decoded = jwt.decode(refreshToken);
            if (decoded && decoded.tokenId) {
                const key = `refresh_token:${decoded.userId}:${decoded.tokenId}`;
                await this.redisClient.del(key);
            }
        } catch (error) {
            // Token might be malformed, ignore error
        }
    }

    /**
     * Invalidate all refresh tokens for a user
     */
    async invalidateAllUserTokens(userId) {
        const pattern = `refresh_token:${userId}:*`;
        const keys = await this.redisClient.keys(pattern);
        
        if (keys.length > 0) {
            await this.redisClient.del(keys);
        }
    }

    /**
     * Blacklist access token
     */
    async blacklistToken(token) {
        try {
            const decoded = jwt.decode(token);
            if (decoded && decoded.exp) {
                const key = `blacklist:${token}`;
                const ttl = decoded.exp - Math.floor(Date.now() / 1000);
                
                if (ttl > 0) {
                    await this.redisClient.setEx(key, ttl, 'blacklisted');
                }
            }
        } catch (error) {
            // Token might be malformed, ignore error
        }
    }

    /**
     * Check if token is blacklisted
     */
    async isTokenBlacklisted(token) {
        const key = `blacklist:${token}`;
        const result = await this.redisClient.get(key);
        return result === 'blacklisted';
    }

    /**
     * Get user by ID
     */
    async getUserById(userId) {
        return await this.dbManager.getUserById(userId);
    }

    /**
     * Get user by email
     */
    async getUserByEmail(email) {
        return await this.dbManager.getUserByEmail(email);
    }

    /**
     * Update user information
     */
    async updateUser(userId, updates) {
        return await this.dbManager.updateUser(userId, updates);
    }

    /**
     * Update user password
     */
    async updatePassword(userId, newPassword) {
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);
        
        return await this.dbManager.updateUser(userId, {
            password_hash: passwordHash,
            password_changed_at: new Date()
        });
    }

    /**
     * Update last login timestamp
     */
    async updateLastLogin(userId) {
        return await this.dbManager.updateUser(userId, {
            last_login: new Date()
        });
    }

    /**
     * Get users with pagination and filtering
     */
    async getUsers(options = {}) {
        return await this.dbManager.getUsers(options);
    }

    /**
     * Update user role (admin only)
     */
    async updateUserRole(userId, role) {
        return await this.dbManager.updateUser(userId, { role });
    }

    /**
     * Grant platform access to user
     */
    async grantPlatformAccess(userId, platform) {
        const user = await this.getUserById(userId);
        
        if (!user) {
            throw new Error('User not found');
        }
        
        let platformsAccess = user.platforms_access || [];
        
        if (!platformsAccess.includes(platform) && !platformsAccess.includes('all')) {
            platformsAccess.push(platform);
            await this.updateUser(userId, { platforms_access: platformsAccess });
        }
    }

    /**
     * Middleware to authenticate JWT token
     */
    authenticateToken = async (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Access token is required'
            });
        }

        try {
            // Check if token is blacklisted
            const isBlacklisted = await this.isTokenBlacklisted(token);
            if (isBlacklisted) {
                return res.status(401).json({
                    success: false,
                    error: 'Token has been revoked'
                });
            }

            const decoded = this.verifyToken(token);
            if (!decoded) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid or expired token'
                });
            }

            // Get fresh user data
            const user = await this.getUserById(decoded.userId);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'User not found'
                });
            }

            req.user = user;
            next();

        } catch (error) {
            return res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        }
    };

    /**
     * Middleware to require specific roles
     */
    requireRole = (allowedRoles) => {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
            }

            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    error: 'Insufficient permissions'
                });
            }

            next();
        };
    };

    /**
     * Middleware to require platform access
     */
    requirePlatformAccess = (platform) => {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required'
                });
            }

            const platformsAccess = req.user.platforms_access || [];
            
            if (!platformsAccess.includes(platform) && 
                !platformsAccess.includes('all') && 
                req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: `Access denied to ${platform} platform`
                });
            }

            next();
        };
    };

    /**
     * Generate password reset token
     */
    async generatePasswordResetToken(email) {
        const user = await this.getUserByEmail(email);
        
        if (!user) {
            return null;
        }
        
        const resetToken = uuidv4();
        const key = `password_reset:${resetToken}`;
        
        // Store reset token for 1 hour
        await this.redisClient.setEx(key, 3600, JSON.stringify({
            userId: user.id,
            email: user.email,
            createdAt: new Date().toISOString()
        }));
        
        return resetToken;
    }

    /**
     * Verify password reset token
     */
    async verifyPasswordResetToken(resetToken) {
        const key = `password_reset:${resetToken}`;
        const data = await this.redisClient.get(key);
        
        if (!data) {
            return null;
        }
        
        return JSON.parse(data);
    }

    /**
     * Reset password using reset token
     */
    async resetPassword(resetToken, newPassword) {
        const resetData = await this.verifyPasswordResetToken(resetToken);
        
        if (!resetData) {
            throw new Error('Invalid or expired reset token');
        }
        
        // Update password
        await this.updatePassword(resetData.userId, newPassword);
        
        // Invalidate reset token
        const key = `password_reset:${resetToken}`;
        await this.redisClient.del(key);
        
        // Invalidate all user sessions for security
        await this.invalidateAllUserTokens(resetData.userId);
        
        return true;
    }

    /**
     * Get authentication statistics
     */
    async getAuthStats() {
        const stats = await this.dbManager.getAuthStats();
        
        // Add Redis stats
        const redisInfo = await this.redisClient.info('memory');
        const activeTokens = await this.redisClient.keys('refresh_token:*');
        
        return {
            ...stats,
            active_sessions: activeTokens.length,
            redis_memory_usage: redisInfo
        };
    }

    /**
     * Close connections
     */
    async close() {
        await this.redisClient.quit();
        await this.dbManager.close();
    }
}

module.exports = AuthService;