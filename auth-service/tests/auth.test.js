/**
 * Comprehensive tests for Authentication Service
 * Tests user registration, login, JWT tokens, and security features
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const redis = require('redis');

// Mock dependencies
jest.mock('pg');
jest.mock('redis');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const AuthService = require('../src/services/authService');
const DatabaseManager = require('../src/config/database');
const { validatePasswordStrength, validateEmail, RateLimiter } = require('../src/utils/helpers');

describe('Authentication Service', () => {
    let authService;
    let mockRedisClient;
    let mockDbManager;

    beforeEach(() => {
        // Mock Redis client
        mockRedisClient = {
            connect: jest.fn(),
            setEx: jest.fn(),
            get: jest.fn(),
            del: jest.fn(),
            keys: jest.fn(),
            quit: jest.fn(),
            on: jest.fn()
        };
        redis.createClient.mockReturnValue(mockRedisClient);

        // Mock Database Manager
        mockDbManager = {
            createUser: jest.fn(),
            getUserByEmail: jest.fn(),
            getUserById: jest.fn(),
            updateUser: jest.fn(),
            getUsers: jest.fn(),
            close: jest.fn()
        };

        authService = new AuthService();
        authService.dbManager = mockDbManager;
        authService.redisClient = mockRedisClient;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // Feature: local-lens, Property 1: Valid credential authentication
    test('Property 1: Valid credential authentication', async () => {
        // Property-based test: For any valid user credentials, authentication should succeed
        fc.assert(fc.property(
            fc.record({
                email: fc.emailAddress(),
                password: fc.stringOf(fc.char().filter(c => c.charCodeAt(0) >= 33 && c.charCodeAt(0) <= 126), { minLength: 8, maxLength: 50 }), // Printable ASCII chars only
                name: fc.stringOf(fc.char().filter(c => c.charCodeAt(0) >= 33 && c.charCodeAt(0) <= 126), { minLength: 2, maxLength: 100 }), // Printable ASCII chars only
                role: fc.constantFrom('citizen', 'donor', 'recipient', 'admin')
            }),
            async (validCreds) => {
                // Clear mocks for each run
                jest.clearAllMocks();
                
                const testUser = {
                    id: 'user-' + Math.random().toString(36).substr(2, 9),
                    email: validCreds.email,
                    password_hash: 'hashed_' + validCreds.password,
                    name: validCreds.name,
                    role: validCreds.role,
                    platforms_access: ['basic']
                };

                // Setup mocks to simulate successful authentication
                mockDbManager.getUserByEmail.mockResolvedValue(testUser);
                bcrypt.compare.mockResolvedValue(true);

                // Test authentication
                const authResult = await authService.authenticateUser(validCreds.email, validCreds.password);

                // Property: For any valid credentials, authentication should succeed
                return authResult !== null && 
                       authResult.email === validCreds.email && 
                       authResult.role === validCreds.role;
            }
        ), { numRuns: 100 });
    });

    describe('User Registration', () => {
        test('should create user with valid data', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'Test@123456',
                name: 'Test User',
                role: 'citizen'
            };

            const hashedPassword = 'hashed_password';
            bcrypt.hash.mockResolvedValue(hashedPassword);

            const createdUser = {
                id: 'user-123',
                email: userData.email,
                name: userData.name,
                role: userData.role,
                created_at: new Date()
            };

            mockDbManager.createUser.mockResolvedValue(createdUser);

            const result = await authService.createUser(userData);

            expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 12);
            expect(mockDbManager.createUser).toHaveBeenCalledWith({
                email: userData.email,
                password_hash: hashedPassword,
                name: userData.name,
                role: userData.role,
                phone: undefined,
                location: null,
                platforms_access: ['basic']
            });
            expect(result).toEqual(createdUser);
        });

        test('should hash password with proper salt rounds', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'Test@123456',
                name: 'Test User'
            };

            bcrypt.hash.mockResolvedValue('hashed_password');
            mockDbManager.createUser.mockResolvedValue({ id: 'user-123' });

            await authService.createUser(userData);

            expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 12);
        });
    });

    describe('User Authentication', () => {
        test('should authenticate user with valid credentials', async () => {
            const email = 'test@example.com';
            const password = 'Test@123456';
            const user = {
                id: 'user-123',
                email,
                password_hash: 'hashed_password',
                name: 'Test User',
                role: 'citizen'
            };

            mockDbManager.getUserByEmail.mockResolvedValue(user);
            bcrypt.compare.mockResolvedValue(true);

            const result = await authService.authenticateUser(email, password);

            expect(mockDbManager.getUserByEmail).toHaveBeenCalledWith(email);
            expect(bcrypt.compare).toHaveBeenCalledWith(password, user.password_hash);
            expect(result).toEqual(user);
        });

        test('should return null for invalid credentials', async () => {
            const email = 'test@example.com';
            const password = 'wrongpassword';
            const user = {
                id: 'user-123',
                email,
                password_hash: 'hashed_password'
            };

            mockDbManager.getUserByEmail.mockResolvedValue(user);
            bcrypt.compare.mockResolvedValue(false);

            const result = await authService.authenticateUser(email, password);

            expect(result).toBeNull();
        });

        test('should return null for non-existent user', async () => {
            mockDbManager.getUserByEmail.mockResolvedValue(null);

            const result = await authService.authenticateUser('nonexistent@example.com', 'password');

            expect(result).toBeNull();
        });
    });

    describe('JWT Token Management', () => {
        test('should generate valid access token', () => {
            const user = {
                id: 'user-123',
                email: 'test@example.com',
                role: 'citizen',
                platforms_access: ['basic']
            };

            const mockToken = 'mock.jwt.token';
            jwt.sign.mockReturnValue(mockToken);

            const token = authService.generateToken(user);

            expect(jwt.sign).toHaveBeenCalledWith(
                {
                    userId: user.id,
                    email: user.email,
                    role: user.role,
                    platforms_access: user.platforms_access
                },
                authService.jwtSecret,
                {
                    expiresIn: authService.jwtExpiresIn,
                    issuer: 'local-lens-auth',
                    audience: 'local-lens-platforms'
                }
            );
            expect(token).toBe(mockToken);
        });

        test('should generate refresh token', () => {
            const user = { id: 'user-123' };
            const mockToken = 'mock.refresh.token';
            jwt.sign.mockReturnValue(mockToken);

            const token = authService.generateRefreshToken(user);

            expect(jwt.sign).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: user.id,
                    type: 'refresh'
                }),
                authService.jwtSecret,
                {
                    expiresIn: authService.refreshTokenExpiresIn,
                    issuer: 'local-lens-auth'
                }
            );
            expect(token).toBe(mockToken);
        });

        test('should verify valid token', () => {
            const token = 'valid.jwt.token';
            const decoded = { userId: 'user-123', email: 'test@example.com' };
            jwt.verify.mockReturnValue(decoded);

            const result = authService.verifyToken(token);

            expect(jwt.verify).toHaveBeenCalledWith(token, authService.jwtSecret);
            expect(result).toEqual(decoded);
        });

        test('should return null for invalid token', () => {
            const token = 'invalid.jwt.token';
            jwt.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });

            const result = authService.verifyToken(token);

            expect(result).toBeNull();
        });
    });

    describe('Refresh Token Management', () => {
        test('should store refresh token in Redis', async () => {
            const userId = 'user-123';
            const refreshToken = 'refresh.token';
            const decoded = { tokenId: 'token-123' };

            jwt.decode.mockReturnValue(decoded);
            mockRedisClient.setEx.mockResolvedValue('OK');

            await authService.storeRefreshToken(userId, refreshToken);

            expect(mockRedisClient.setEx).toHaveBeenCalledWith(
                `refresh_token:${userId}:${decoded.tokenId}`,
                7 * 24 * 60 * 60,
                refreshToken
            );
        });

        test('should refresh access token with valid refresh token', async () => {
            const refreshToken = 'valid.refresh.token';
            const decoded = {
                userId: 'user-123',
                tokenId: 'token-123',
                type: 'refresh'
            };
            const user = {
                id: 'user-123',
                email: 'test@example.com',
                role: 'citizen'
            };

            jwt.verify.mockReturnValue(decoded);
            mockRedisClient.get.mockResolvedValue(refreshToken);
            mockDbManager.getUserById.mockResolvedValue(user);
            jwt.sign.mockReturnValue('new.access.token');

            const result = await authService.refreshAccessToken(refreshToken);

            expect(result.success).toBe(true);
            expect(result.token).toBe('new.access.token');
            expect(result.refreshToken).toBe('new.access.token');
        });

        test('should reject invalid refresh token', async () => {
            const refreshToken = 'invalid.refresh.token';
            jwt.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });

            const result = await authService.refreshAccessToken(refreshToken);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid refresh token');
        });
    });

    describe('Token Blacklisting', () => {
        test('should blacklist access token', async () => {
            const token = 'access.token';
            const decoded = { exp: Math.floor(Date.now() / 1000) + 3600 };

            jwt.decode.mockReturnValue(decoded);
            mockRedisClient.setEx.mockResolvedValue('OK');

            await authService.blacklistToken(token);

            expect(mockRedisClient.setEx).toHaveBeenCalledWith(
                `blacklist:${token}`,
                expect.any(Number),
                'blacklisted'
            );
        });

        test('should check if token is blacklisted', async () => {
            const token = 'blacklisted.token';
            mockRedisClient.get.mockResolvedValue('blacklisted');

            const result = await authService.isTokenBlacklisted(token);

            expect(result).toBe(true);
        });

        test('should return false for non-blacklisted token', async () => {
            const token = 'valid.token';
            mockRedisClient.get.mockResolvedValue(null);

            const result = await authService.isTokenBlacklisted(token);

            expect(result).toBe(false);
        });
    });

    describe('Password Management', () => {
        test('should update password with proper hashing', async () => {
            const userId = 'user-123';
            const newPassword = 'NewPassword@123';
            const hashedPassword = 'new_hashed_password';

            bcrypt.hash.mockResolvedValue(hashedPassword);
            mockDbManager.updateUser.mockResolvedValue({ id: userId });

            await authService.updatePassword(userId, newPassword);

            expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 12);
            expect(mockDbManager.updateUser).toHaveBeenCalledWith(userId, {
                password_hash: hashedPassword,
                password_changed_at: expect.any(Date)
            });
        });
    });

    describe('Platform Access Management', () => {
        test('should grant platform access to user', async () => {
            const userId = 'user-123';
            const platform = 'blood';
            const user = {
                id: userId,
                platforms_access: ['basic']
            };

            mockDbManager.getUserById.mockResolvedValue(user);
            mockDbManager.updateUser.mockResolvedValue(user);

            await authService.grantPlatformAccess(userId, platform);

            expect(mockDbManager.updateUser).toHaveBeenCalledWith(userId, {
                platforms_access: ['basic', platform]
            });
        });

        test('should not duplicate platform access', async () => {
            const userId = 'user-123';
            const platform = 'blood';
            const user = {
                id: userId,
                platforms_access: ['basic', 'blood']
            };

            mockDbManager.getUserById.mockResolvedValue(user);

            await authService.grantPlatformAccess(userId, platform);

            expect(mockDbManager.updateUser).not.toHaveBeenCalled();
        });
    });
});

describe('Password Validation', () => {
    test('should validate strong password', () => {
        const password = 'StrongP@ssw0rd123';
        const result = validatePasswordStrength(password);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.score).toBeGreaterThan(70);
    });

    test('should reject weak password', () => {
        const password = 'weak';
        const result = validatePasswordStrength(password);

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.score).toBeLessThan(50);
    });

    test('should reject common passwords', () => {
        const password = 'password123';
        const result = validatePasswordStrength(password);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password is too common, please choose a stronger password');
    });

    test('should require all character types', () => {
        const testCases = [
            { password: 'nouppercase123!', missing: 'uppercase' },
            { password: 'NOLOWERCASE123!', missing: 'lowercase' },
            { password: 'NoNumbers!', missing: 'number' },
            { password: 'NoSpecialChars123', missing: 'special character' }
        ];

        testCases.forEach(({ password, missing }) => {
            const result = validatePasswordStrength(password);
            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes(missing))).toBe(true);
        });
    });
});

describe('Email Validation', () => {
    test('should validate correct email format', () => {
        const validEmails = [
            'test@example.com',
            'user.name@domain.co.uk',
            'user+tag@example.org'
        ];

        validEmails.forEach(email => {
            const result = validateEmail(email);
            expect(result.isValid).toBe(true);
        });
    });

    test('should reject invalid email format', () => {
        const invalidEmails = [
            'invalid-email',
            '@example.com',
            'test@',
            'test..test@example.com'
        ];

        invalidEmails.forEach(email => {
            const result = validateEmail(email);
            expect(result.isValid).toBe(false);
        });
    });

    test('should reject disposable email domains', () => {
        const disposableEmails = [
            'test@10minutemail.com',
            'user@tempmail.org',
            'fake@guerrillamail.com'
        ];

        disposableEmails.forEach(email => {
            const result = validateEmail(email);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('Disposable email addresses are not allowed');
        });
    });
});

describe('Rate Limiter', () => {
    test('should allow requests within limit', () => {
        const limiter = new RateLimiter(60000, 5); // 5 requests per minute
        const identifier = 'user-123';

        for (let i = 0; i < 5; i++) {
            const result = limiter.isAllowed(identifier);
            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(4 - i);
        }
    });

    test('should block requests exceeding limit', () => {
        const limiter = new RateLimiter(60000, 3); // 3 requests per minute
        const identifier = 'user-123';

        // Make 3 allowed requests
        for (let i = 0; i < 3; i++) {
            limiter.isAllowed(identifier);
        }

        // 4th request should be blocked
        const result = limiter.isAllowed(identifier);
        expect(result.allowed).toBe(false);
        expect(result.resetTime).toBeDefined();
    });

    test('should reset after time window', () => {
        const limiter = new RateLimiter(100, 2); // 2 requests per 100ms
        const identifier = 'user-123';

        // Make 2 requests
        limiter.isAllowed(identifier);
        limiter.isAllowed(identifier);

        // 3rd request should be blocked
        expect(limiter.isAllowed(identifier).allowed).toBe(false);

        // Wait for window to reset
        setTimeout(() => {
            const result = limiter.isAllowed(identifier);
            expect(result.allowed).toBe(true);
        }, 150);
    });

    test('should handle multiple identifiers independently', () => {
        const limiter = new RateLimiter(60000, 2);

        // User 1 makes 2 requests
        expect(limiter.isAllowed('user-1').allowed).toBe(true);
        expect(limiter.isAllowed('user-1').allowed).toBe(true);
        expect(limiter.isAllowed('user-1').allowed).toBe(false);

        // User 2 should still be allowed
        expect(limiter.isAllowed('user-2').allowed).toBe(true);
        expect(limiter.isAllowed('user-2').allowed).toBe(true);
        expect(limiter.isAllowed('user-2').allowed).toBe(false);
    });
});

describe('Authentication Middleware', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = {
            headers: {},
            user: null
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();
    });

    test('should authenticate valid token', async () => {
        const token = 'valid.jwt.token';
        const decoded = { userId: 'user-123' };
        const user = { id: 'user-123', email: 'test@example.com' };

        mockReq.headers.authorization = `Bearer ${token}`;
        
        authService.verifyToken = jest.fn().mockReturnValue(decoded);
        authService.isTokenBlacklisted = jest.fn().mockResolvedValue(false);
        authService.getUserById = jest.fn().mockResolvedValue(user);

        await authService.authenticateToken(mockReq, mockRes, mockNext);

        expect(mockReq.user).toEqual(user);
        expect(mockNext).toHaveBeenCalled();
    });

    test('should reject request without token', async () => {
        await authService.authenticateToken(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
            success: false,
            error: 'Access token is required'
        });
        expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject blacklisted token', async () => {
        const token = 'blacklisted.token';
        mockReq.headers.authorization = `Bearer ${token}`;

        authService.isTokenBlacklisted = jest.fn().mockResolvedValue(true);

        await authService.authenticateToken(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
            success: false,
            error: 'Token has been revoked'
        });
    });
});

describe('Role-based Access Control', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = { user: null };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();
    });

    test('should allow access for authorized role', () => {
        mockReq.user = { role: 'admin' };
        const middleware = authService.requireRole(['admin', 'moderator']);

        middleware(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
    });

    test('should deny access for unauthorized role', () => {
        mockReq.user = { role: 'citizen' };
        const middleware = authService.requireRole(['admin']);

        middleware(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({
            success: false,
            error: 'Insufficient permissions'
        });
    });

    test('should require authentication', () => {
        const middleware = authService.requireRole(['admin']);

        middleware(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
            success: false,
            error: 'Authentication required'
        });
    });
});

// Property-based testing with fast-check
const fc = require('fast-check');

describe('Property-Based Tests', () => {
    test('Password hashing should be deterministic', () => {
        fc.assert(fc.property(
            fc.string({ minLength: 8, maxLength: 50 }),
            async (password) => {
                const hash1 = await bcrypt.hash(password, 12);
                const hash2 = await bcrypt.hash(password, 12);
                
                // Hashes should be different due to salt
                expect(hash1).not.toBe(hash2);
                
                // But both should verify correctly
                expect(await bcrypt.compare(password, hash1)).toBe(true);
                expect(await bcrypt.compare(password, hash2)).toBe(true);
            }
        ));
    });

    test('Token generation should produce unique tokens', () => {
        fc.assert(fc.property(
            fc.record({
                id: fc.uuid(),
                email: fc.emailAddress(),
                role: fc.constantFrom('admin', 'citizen', 'donor')
            }),
            (user) => {
                const token1 = authService.generateToken(user);
                const token2 = authService.generateToken(user);
                
                // Tokens should be different due to timestamp
                expect(token1).not.toBe(token2);
            }
        ));
    });

    test('Email validation should be consistent', () => {
        fc.assert(fc.property(
            fc.emailAddress(),
            (email) => {
                const result1 = validateEmail(email);
                const result2 = validateEmail(email);
                
                expect(result1.isValid).toBe(result2.isValid);
            }
        ));
    });
});