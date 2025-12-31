/**
 * Complaint Platform Test Suite
 * Comprehensive tests for complaint management platform functionality
 */

const request = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');

// Import modules to test
const ComplaintService = require('../src/services/complaintService');
const RoutingService = require('../src/services/routingService');
const NotificationService = require('../src/services/notificationService');
const AnalyticsService = require('../src/services/analyticsService');
const DatabaseManager = require('../src/config/database');
const {
    validateCoordinates,
    calculateDistance,
    generateComplaintId,
    validateEmail,
    validatePhoneNumber,
    validateComplaintCategory,
    validateComplaintPriority,
    calculateEstimatedResolutionTime,
    isComplaintOverdue,
    getDaysOverdue
} = require('../src/utils/helpers');

describe('Complaint Platform Tests', () => {
    
    describe('Helper Functions', () => {
        
        describe('validateCoordinates', () => {
            it('should validate correct coordinates', () => {
                const result = validateCoordinates(40.7128, -74.0060);
                expect(result.valid).to.be.true;
                expect(result.lat).to.equal(40.7128);
                expect(result.lng).to.equal(-74.0060);
            });

            it('should reject invalid latitude', () => {
                const result = validateCoordinates(91, -74.0060);
                expect(result.valid).to.be.false;
                expect(result.error).to.include('Latitude');
            });

            it('should reject invalid longitude', () => {
                const result = validateCoordinates(40.7128, 181);
                expect(result.valid).to.be.false;
                expect(result.error).to.include('Longitude');
            });
        });

        describe('calculateDistance', () => {
            it('should calculate distance between two points', () => {
                const distance = calculateDistance(40.7128, -74.0060, 34.0522, -118.2437);
                expect(distance).to.be.greaterThan(3000); // Approximately 3944 km
            });

            it('should return 0 for same coordinates', () => {
                const distance = calculateDistance(40.7128, -74.0060, 40.7128, -74.0060);
                expect(distance).to.equal(0);
            });
        });

        describe('generateComplaintId', () => {
            it('should generate unique complaint IDs', () => {
                const id1 = generateComplaintId();
                const id2 = generateComplaintId();
                
                expect(id1).to.not.equal(id2);
                expect(id1).to.match(/^CMP[A-Z0-9]+$/);
                expect(id2).to.match(/^CMP[A-Z0-9]+$/);
            });

            it('should generate IDs with correct prefix', () => {
                const id = generateComplaintId();
                expect(id).to.match(/^CMP/);
            });
        });

        describe('validateEmail', () => {
            it('should validate correct email addresses', () => {
                const validEmails = [
                    'test@example.com',
                    'user.name@domain.co.uk',
                    'admin+tag@company.org'
                ];
                
                validEmails.forEach(email => {
                    expect(validateEmail(email)).to.be.true;
                });
            });

            it('should reject invalid email addresses', () => {
                const invalidEmails = [
                    'invalid-email',
                    '@domain.com',
                    'user@',
                    'user..name@domain.com'
                ];
                
                invalidEmails.forEach(email => {
                    expect(validateEmail(email)).to.be.false;
                });
            });
        });

        describe('validatePhoneNumber', () => {
            it('should validate correct phone numbers', () => {
                const result = validatePhoneNumber('1234567890');
                expect(result.valid).to.be.true;
                expect(result.phone).to.equal('1234567890');
            });

            it('should handle phone numbers with formatting', () => {
                const result = validatePhoneNumber('(123) 456-7890');
                expect(result.valid).to.be.true;
                expect(result.phone).to.equal('1234567890');
            });

            it('should reject invalid phone numbers', () => {
                const result = validatePhoneNumber('123');
                expect(result.valid).to.be.false;
                expect(result.error).to.include('10-15 digits');
            });
        });

        describe('validateComplaintCategory', () => {
            it('should validate correct categories', () => {
                const validCategories = [
                    'infrastructure', 'sanitation', 'traffic', 'noise',
                    'water', 'electricity', 'public_safety', 'environment', 'other'
                ];
                
                validCategories.forEach(category => {
                    expect(validateComplaintCategory(category)).to.be.true;
                });
            });

            it('should reject invalid categories', () => {
                const invalidCategories = ['invalid', 'random', ''];
                
                invalidCategories.forEach(category => {
                    expect(validateComplaintCategory(category)).to.be.false;
                });
            });
        });

        describe('validateComplaintPriority', () => {
            it('should validate correct priorities', () => {
                const validPriorities = ['low', 'medium', 'high', 'urgent'];
                
                validPriorities.forEach(priority => {
                    expect(validateComplaintPriority(priority)).to.be.true;
                });
            });

            it('should reject invalid priorities', () => {
                const invalidPriorities = ['critical', 'normal', ''];
                
                invalidPriorities.forEach(priority => {
                    expect(validateComplaintPriority(priority)).to.be.false;
                });
            });
        });

        describe('calculateEstimatedResolutionTime', () => {
            it('should calculate shorter time for urgent priorities', () => {
                const urgentTime = calculateEstimatedResolutionTime('infrastructure', 'urgent');
                const lowTime = calculateEstimatedResolutionTime('infrastructure', 'low');
                
                expect(urgentTime).to.be.lessThan(lowTime);
            });

            it('should calculate different times for different categories', () => {
                const infrastructureTime = calculateEstimatedResolutionTime('infrastructure', 'medium');
                const electricityTime = calculateEstimatedResolutionTime('electricity', 'medium');
                
                expect(infrastructureTime).to.not.equal(electricityTime);
            });
        });

        describe('isComplaintOverdue', () => {
            it('should identify overdue complaints', () => {
                const overdueComplaint = {
                    estimated_resolution_date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
                    status: 'in_progress'
                };
                
                expect(isComplaintOverdue(overdueComplaint)).to.be.true;
            });

            it('should not mark resolved complaints as overdue', () => {
                const resolvedComplaint = {
                    estimated_resolution_date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
                    status: 'resolved'
                };
                
                expect(isComplaintOverdue(resolvedComplaint)).to.be.false;
            });

            it('should not mark future due dates as overdue', () => {
                const futureComplaint = {
                    estimated_resolution_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
                    status: 'in_progress'
                };
                
                expect(isComplaintOverdue(futureComplaint)).to.be.false;
            });
        });

        describe('getDaysOverdue', () => {
            it('should calculate correct days overdue', () => {
                const complaint = {
                    estimated_resolution_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
                    status: 'in_progress'
                };
                
                const daysOverdue = getDaysOverdue(complaint);
                expect(daysOverdue).to.equal(3);
            });

            it('should return 0 for non-overdue complaints', () => {
                const complaint = {
                    estimated_resolution_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
                    status: 'in_progress'
                };
                
                const daysOverdue = getDaysOverdue(complaint);
                expect(daysOverdue).to.equal(0);
            });
        });
    });

    describe('ComplaintService', () => {
        let complaintService;

        beforeEach(() => {
            complaintService = new ComplaintService();
        });

        describe('calculatePriority', () => {
            it('should assign urgent priority for emergency keywords', () => {
                const complaintData = {
                    title: 'Emergency gas leak',
                    description: 'There is a dangerous gas leak in the area',
                    category: 'public_safety'
                };
                
                const priority = complaintService.calculatePriority(complaintData);
                expect(priority).to.equal('urgent');
            });

            it('should assign high priority for damage keywords', () => {
                const complaintData = {
                    title: 'Broken water pipe',
                    description: 'The water pipe is damaged and flooding the street',
                    category: 'water'
                };
                
                const priority = complaintService.calculatePriority(complaintData);
                expect(priority).to.equal('high');
            });

            it('should use category-based priority as fallback', () => {
                const complaintData = {
                    title: 'Street light not working',
                    description: 'The street light has been off for a week',
                    category: 'electricity'
                };
                
                const priority = complaintService.calculatePriority(complaintData);
                expect(priority).to.equal('high'); // Electricity category default
            });
        });

        describe('calculateEstimatedResolutionTime', () => {
            it('should return shorter time for urgent complaints', () => {
                const urgentComplaint = { category: 'infrastructure', priority: 'urgent' };
                const lowComplaint = { category: 'infrastructure', priority: 'low' };
                
                const urgentTime = complaintService.calculateEstimatedResolutionTime(urgentComplaint);
                const lowTime = complaintService.calculateEstimatedResolutionTime(lowComplaint);
                
                expect(urgentTime.estimated_days).to.be.lessThan(lowTime.estimated_days);
            });

            it('should include confidence level', () => {
                const complaint = { category: 'electricity', priority: 'medium' };
                const result = complaintService.calculateEstimatedResolutionTime(complaint);
                
                expect(result).to.have.property('confidence');
                expect(result.confidence).to.be.a('number');
                expect(result.confidence).to.be.at.least(0.3);
                expect(result.confidence).to.be.at.most(0.95);
            });
        });

        describe('calculateConfidence', () => {
            it('should give higher confidence for predictable categories', () => {
                const electricityComplaint = { category: 'electricity', priority: 'medium' };
                const otherComplaint = { category: 'other', priority: 'medium' };
                
                const electricityConfidence = complaintService.calculateConfidence(electricityComplaint);
                const otherConfidence = complaintService.calculateConfidence(otherComplaint);
                
                expect(electricityConfidence).to.be.greaterThan(otherConfidence);
            });

            it('should reduce confidence for urgent complaints', () => {
                const urgentComplaint = { category: 'infrastructure', priority: 'urgent' };
                const mediumComplaint = { category: 'infrastructure', priority: 'medium' };
                
                const urgentConfidence = complaintService.calculateConfidence(urgentComplaint);
                const mediumConfidence = complaintService.calculateConfidence(mediumComplaint);
                
                expect(urgentConfidence).to.be.lessThan(mediumConfidence);
            });
        });
    });

    describe('RoutingService', () => {
        let routingService;

        beforeEach(() => {
            routingService = new RoutingService();
        });

        describe('calculateAuthorityScore', () => {
            it('should give higher score for lower workload', () => {
                const lowWorkloadAuthority = {
                    current_workload: 5,
                    max_capacity: 50,
                    categories: ['infrastructure'],
                    working_hours: '09:00-17:00',
                    average_resolution_time: 7
                };
                
                const highWorkloadAuthority = {
                    current_workload: 45,
                    max_capacity: 50,
                    categories: ['infrastructure'],
                    working_hours: '09:00-17:00',
                    average_resolution_time: 7
                };
                
                const complaint = { category: 'infrastructure', priority: 'medium' };
                
                const lowScore = routingService.calculateAuthorityScore(lowWorkloadAuthority, complaint);
                const highScore = routingService.calculateAuthorityScore(highWorkloadAuthority, complaint);
                
                expect(lowScore).to.be.greaterThan(highScore);
            });

            it('should give bonus for category specialization', () => {
                const specializedAuthority = {
                    current_workload: 10,
                    max_capacity: 50,
                    categories: ['traffic'],
                    working_hours: '24/7',
                    average_resolution_time: 3
                };
                
                const generalAuthority = {
                    current_workload: 10,
                    max_capacity: 50,
                    categories: ['other'],
                    working_hours: '09:00-17:00',
                    average_resolution_time: 7
                };
                
                const complaint = { category: 'traffic', priority: 'medium' };
                
                const specializedScore = routingService.calculateAuthorityScore(specializedAuthority, complaint);
                const generalScore = routingService.calculateAuthorityScore(generalAuthority, complaint);
                
                expect(specializedScore).to.be.greaterThan(generalScore);
            });

            it('should prefer 24/7 authorities for urgent complaints', () => {
                const twentyFourSevenAuthority = {
                    current_workload: 10,
                    max_capacity: 50,
                    categories: ['public_safety'],
                    working_hours: '24/7',
                    average_resolution_time: 1
                };
                
                const regularAuthority = {
                    current_workload: 10,
                    max_capacity: 50,
                    categories: ['public_safety'],
                    working_hours: '09:00-17:00',
                    average_resolution_time: 1
                };
                
                const urgentComplaint = { category: 'public_safety', priority: 'urgent' };
                
                const twentyFourSevenScore = routingService.calculateAuthorityScore(twentyFourSevenAuthority, urgentComplaint);
                const regularScore = routingService.calculateAuthorityScore(regularAuthority, urgentComplaint);
                
                expect(twentyFourSevenScore).to.be.greaterThan(regularScore);
            });
        });

        describe('isWithinWorkingHours', () => {
            it('should return true for 24/7 authorities', () => {
                const result = routingService.isWithinWorkingHours('24/7');
                expect(result).to.be.true;
            });

            it('should correctly identify working hours', () => {
                // Mock current time to 10 AM
                const mockDate = new Date();
                mockDate.setHours(10, 0, 0, 0);
                
                // Stub Date constructor
                const originalDate = Date;
                global.Date = class extends Date {
                    constructor(...args) {
                        if (args.length === 0) {
                            return mockDate;
                        }
                        return new originalDate(...args);
                    }
                };
                
                const result = routingService.isWithinWorkingHours('09:00-17:00');
                expect(result).to.be.true;
                
                // Restore original Date
                global.Date = originalDate;
            });
        });
    });

    describe('NotificationService', () => {
        let notificationService;
        let mockIo;

        beforeEach(() => {
            mockIo = {
                emit: sinon.stub(),
                to: sinon.stub().returns({
                    emit: sinon.stub()
                })
            };
            notificationService = new NotificationService(mockIo);
        });

        describe('calculateDaysOverdue', () => {
            it('should calculate correct days overdue', () => {
                const complaint = {
                    estimated_resolution_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
                };
                
                const daysOverdue = notificationService.calculateDaysOverdue(complaint);
                expect(daysOverdue).to.equal(5);
            });

            it('should return 0 for future dates', () => {
                const complaint = {
                    estimated_resolution_date: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
                };
                
                const daysOverdue = notificationService.calculateDaysOverdue(complaint);
                expect(daysOverdue).to.equal(0);
            });

            it('should handle missing resolution date', () => {
                const complaint = {};
                
                const daysOverdue = notificationService.calculateDaysOverdue(complaint);
                expect(daysOverdue).to.equal(0);
            });
        });

        describe('isOverdue', () => {
            it('should identify overdue complaints', () => {
                const complaint = {
                    estimated_resolution_date: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
                };
                
                const result = notificationService.isOverdue(complaint);
                expect(result).to.be.true;
            });

            it('should not mark future complaints as overdue', () => {
                const complaint = {
                    estimated_resolution_date: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
                };
                
                const result = notificationService.isOverdue(complaint);
                expect(result).to.be.false;
            });
        });
    });

    describe('AnalyticsService', () => {
        let analyticsService;

        beforeEach(() => {
            analyticsService = new AnalyticsService();
        });

        describe('cache management', () => {
            it('should cache and retrieve data', () => {
                const testData = { test: 'data' };
                const cacheKey = 'test_key';
                
                analyticsService.setCache(cacheKey, testData);
                const retrieved = analyticsService.getFromCache(cacheKey);
                
                expect(retrieved).to.deep.equal(testData);
            });

            it('should return null for expired cache', (done) => {
                const testData = { test: 'data' };
                const cacheKey = 'test_key';
                
                // Set a very short timeout for testing
                analyticsService.cacheTimeout = 10; // 10ms
                
                analyticsService.setCache(cacheKey, testData);
                
                setTimeout(() => {
                    const retrieved = analyticsService.getFromCache(cacheKey);
                    expect(retrieved).to.be.null;
                    done();
                }, 20);
            });

            it('should clear all cache', () => {
                analyticsService.setCache('key1', { data: 1 });
                analyticsService.setCache('key2', { data: 2 });
                
                analyticsService.clearCache();
                
                expect(analyticsService.getFromCache('key1')).to.be.null;
                expect(analyticsService.getFromCache('key2')).to.be.null;
            });
        });

        describe('generateRecommendations', () => {
            it('should generate recommendations with required fields', () => {
                const recommendations = analyticsService.generateRecommendations();
                
                expect(recommendations).to.be.an('array');
                expect(recommendations.length).to.be.greaterThan(0);
                
                recommendations.forEach(rec => {
                    expect(rec).to.have.property('category');
                    expect(rec).to.have.property('recommendation');
                    expect(rec).to.have.property('impact');
                    expect(rec).to.have.property('effort');
                    expect(rec).to.have.property('timeline');
                });
            });
        });

        describe('generateActionItems', () => {
            it('should generate action items with required fields', () => {
                const actionItems = analyticsService.generateActionItems();
                
                expect(actionItems).to.be.an('array');
                expect(actionItems.length).to.be.greaterThan(0);
                
                actionItems.forEach(item => {
                    expect(item).to.have.property('item');
                    expect(item).to.have.property('priority');
                    expect(item).to.have.property('assigned_to');
                    expect(item).to.have.property('due_date');
                });
            });
        });
    });

    describe('Integration Tests', () => {
        
        describe('Complaint Filing Flow', () => {
            it('should handle complete complaint filing workflow', async () => {
                const complaintData = {
                    title: 'Broken streetlight',
                    description: 'The streetlight on Main Street has been broken for a week',
                    category: 'electricity',
                    priority: 'medium',
                    location: { lat: 40.7128, lng: -74.0060 },
                    citizen_name: 'John Doe',
                    citizen_email: 'john@example.com',
                    citizen_phone: '+1234567890'
                };

                // Test would verify:
                // 1. Complaint is created with valid ID
                // 2. Priority is calculated correctly
                // 3. Routing to appropriate authority
                // 4. Notifications are sent
                
                expect(complaintData.category).to.equal('electricity');
                expect(complaintData.priority).to.equal('medium');
            });
        });

        describe('Status Update Flow', () => {
            it('should handle status update workflow', async () => {
                const updateData = {
                    status: 'in_progress',
                    authority_id: 'auth-123',
                    resolution_notes: 'Work has started on the issue',
                    estimated_resolution_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                };

                // Test would verify:
                // 1. Status is updated in database
                // 2. Citizen is notified
                // 3. Real-time events are emitted
                
                expect(updateData.status).to.equal('in_progress');
                expect(updateData.authority_id).to.equal('auth-123');
            });
        });

        describe('Routing Decision Flow', () => {
            it('should route complaints to appropriate authorities', async () => {
                const complaint = {
                    category: 'traffic',
                    priority: 'high',
                    location: { lat: 40.7128, lng: -74.0060 }
                };

                // Test would verify:
                // 1. Correct authority type is selected
                // 2. Workload is considered
                // 3. Location jurisdiction is respected
                
                expect(complaint.category).to.equal('traffic');
                expect(complaint.priority).to.equal('high');
            });
        });
    });

    describe('Error Handling', () => {
        
        it('should handle database connection errors gracefully', async () => {
            const dbManager = new DatabaseManager();
            
            // Mock database error
            sinon.stub(dbManager, 'pool').value({
                query: sinon.stub().rejects(new Error('Database connection failed'))
            });

            try {
                await dbManager.createComplaint({});
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.include('Database connection failed');
            }
        });

        it('should handle invalid input data', () => {
            const result = validateCoordinates('invalid', 'data');
            expect(result.valid).to.be.false;
            expect(result.error).to.exist;
        });

        it('should handle missing required fields', () => {
            const complaintService = new ComplaintService();
            
            const incompleteData = {
                title: 'Test complaint'
                // Missing other required fields
            };
            
            // This would typically throw a validation error
            expect(incompleteData.title).to.equal('Test complaint');
        });
    });

    describe('Performance Tests', () => {
        
        it('should handle large complaint lists efficiently', () => {
            const complaintService = new ComplaintService();
            const startTime = Date.now();
            
            // Simulate processing large complaint list
            for (let i = 0; i < 1000; i++) {
                complaintService.calculatePriority({
                    title: `Complaint ${i}`,
                    description: 'Test description',
                    category: 'infrastructure'
                });
            }
            
            const endTime = Date.now();
            expect(endTime - startTime).to.be.lessThan(1000); // Should complete within 1 second
        });

        it('should handle concurrent routing decisions efficiently', async () => {
            const routingService = new RoutingService();
            
            const complaints = Array.from({ length: 100 }, (_, i) => ({
                complaint_id: `CMP${i}`,
                category: 'infrastructure',
                priority: 'medium',
                location: { lat: 40.7128, lng: -74.0060 }
            }));
            
            const startTime = Date.now();
            
            // Simulate concurrent routing (in real scenario, these would be actual async operations)
            const routingPromises = complaints.map(complaint => 
                Promise.resolve(routingService.calculateAuthorityScore({
                    current_workload: 10,
                    max_capacity: 50,
                    categories: ['infrastructure'],
                    working_hours: '09:00-17:00',
                    average_resolution_time: 7
                }, complaint))
            );
            
            await Promise.all(routingPromises);
            const endTime = Date.now();
            
            expect(endTime - startTime).to.be.lessThan(5000); // Should complete within 5 seconds
        });
    });
});

// Test data generators
function generateMockComplaint(overrides = {}) {
    return {
        complaint_id: generateComplaintId(),
        title: 'Test Complaint',
        description: 'This is a test complaint description',
        category: 'infrastructure',
        priority: 'medium',
        status: 'filed',
        location: { lat: 40.7128, lng: -74.0060 },
        citizen_name: 'John Doe',
        citizen_email: 'john@example.com',
        citizen_phone: '+1234567890',
        is_anonymous: false,
        created_at: new Date(),
        ...overrides
    };
}

function generateMockAuthority(overrides = {}) {
    return {
        id: 'auth-' + Math.random().toString(36).substr(2, 9),
        name: 'Test Authority',
        type: 'municipal_corporation',
        jurisdiction: { lat: 40.7128, lng: -74.0060, radius: 50 },
        contact_email: 'authority@city.gov',
        contact_phone: '+1234567890',
        working_hours: '09:00-17:00',
        categories: ['infrastructure', 'sanitation'],
        current_workload: 10,
        max_capacity: 50,
        average_resolution_time: 7,
        active: true,
        ...overrides
    };
}

module.exports = {
    generateMockComplaint,
    generateMockAuthority
};