/**
 * Complaint Management Service
 * Core business logic for complaint handling and processing
 */

const { calculateDistance } = require('../utils/helpers');

class ComplaintService {
    constructor() {
        this.priorityWeights = {
            'urgent': 1,
            'high': 3,
            'medium': 7,
            'low': 14
        };
        
        this.categoryResolutionTimes = {
            'infrastructure': 14, // days
            'sanitation': 7,
            'traffic': 3,
            'noise': 5,
            'water': 2,
            'electricity': 1,
            'public_safety': 1,
            'environment': 10,
            'other': 7
        };
    }

    async initialize() {
        console.log('ComplaintService initialized');
    }

    /**
     * Create a new complaint
     */
    async createComplaint(complaintData) {
        try {
            // Set default values
            const complaint = {
                ...complaintData,
                status: 'filed',
                priority: complaintData.priority || this.calculatePriority(complaintData),
                created_at: new Date(),
                updated_at: new Date()
            };

            // This would typically save to database
            console.log('Complaint created:', complaint.complaint_id);
            
            return complaint;

        } catch (error) {
            console.error('Error creating complaint:', error);
            throw error;
        }
    }

    /**
     * Get complaint by ID
     */
    async getComplaintById(complaintId) {
        try {
            // This would query the database
            // Mock implementation for now
            return {
                complaint_id: complaintId,
                title: 'Sample Complaint',
                description: 'Sample description',
                category: 'infrastructure',
                priority: 'medium',
                status: 'filed',
                location: { lat: 40.7128, lng: -74.0060 },
                citizen_name: 'John Doe',
                citizen_email: 'john@example.com',
                created_at: new Date(),
                updated_at: new Date()
            };

        } catch (error) {
            console.error('Error fetching complaint:', error);
            throw error;
        }
    }

    /**
     * Get complaints with filters
     */
    async getComplaints(filters = {}) {
        try {
            // This would query the database with filters
            // Mock implementation for now
            const mockComplaints = [];
            
            return {
                data: mockComplaints,
                pagination: {
                    page: filters.page || 1,
                    limit: filters.limit || 20,
                    total: mockComplaints.length,
                    pages: Math.ceil(mockComplaints.length / (filters.limit || 20))
                }
            };

        } catch (error) {
            console.error('Error fetching complaints:', error);
            throw error;
        }
    }

    /**
     * Update complaint status
     */
    async updateComplaintStatus(complaintId, updateData) {
        try {
            // This would update the database
            console.log(`Updating complaint ${complaintId} status to ${updateData.status}`);
            
            const updatedComplaint = {
                complaint_id: complaintId,
                ...updateData,
                updated_at: new Date()
            };

            return updatedComplaint;

        } catch (error) {
            console.error('Error updating complaint status:', error);
            throw error;
        }
    }

    /**
     * Add comment to complaint
     */
    async addComment(complaintId, commentData) {
        try {
            const comment = {
                id: `comment_${Date.now()}`,
                complaint_id: complaintId,
                ...commentData,
                created_at: new Date()
            };

            console.log(`Comment added to complaint ${complaintId}`);
            return comment;

        } catch (error) {
            console.error('Error adding comment:', error);
            throw error;
        }
    }

    /**
     * Get complaints by authority
     */
    async getComplaintsByAuthority(authorityId, filters = {}) {
        try {
            // This would query complaints assigned to specific authority
            const mockComplaints = [];
            
            return {
                data: mockComplaints,
                pagination: {
                    page: filters.page || 1,
                    limit: filters.limit || 20,
                    total: mockComplaints.length,
                    pages: Math.ceil(mockComplaints.length / (filters.limit || 20))
                }
            };

        } catch (error) {
            console.error('Error fetching authority complaints:', error);
            throw error;
        }
    }

    /**
     * Get nearby complaints
     */
    async getNearbyComplaints(searchParams) {
        try {
            const { lat, lng, radius, category, status } = searchParams;
            
            // This would use geospatial queries
            // Mock implementation for now
            const mockComplaints = [];
            
            return mockComplaints.filter(complaint => {
                const distance = calculateDistance(
                    lat, lng,
                    complaint.location.lat, complaint.location.lng
                );
                
                return distance <= radius &&
                       (!category || complaint.category === category) &&
                       (!status || complaint.status === status);
            });

        } catch (error) {
            console.error('Error fetching nearby complaints:', error);
            throw error;
        }
    }

    /**
     * Add citizen feedback
     */
    async addFeedback(complaintId, feedbackData) {
        try {
            const feedback = {
                id: `feedback_${Date.now()}`,
                complaint_id: complaintId,
                ...feedbackData,
                created_at: new Date()
            };

            console.log(`Feedback added for complaint ${complaintId}`);
            return feedback;

        } catch (error) {
            console.error('Error adding feedback:', error);
            throw error;
        }
    }

    /**
     * Calculate complaint priority based on category and content
     */
    calculatePriority(complaintData) {
        const { category, description, title } = complaintData;
        
        // Keywords that indicate urgency
        const urgentKeywords = [
            'emergency', 'urgent', 'immediate', 'danger', 'hazard',
            'accident', 'injury', 'fire', 'flood', 'gas leak'
        ];
        
        const highKeywords = [
            'broken', 'damaged', 'not working', 'blocked', 'overflow',
            'loud', 'disturbing', 'unsafe'
        ];

        const text = `${title} ${description}`.toLowerCase();
        
        // Check for urgent keywords
        if (urgentKeywords.some(keyword => text.includes(keyword))) {
            return 'urgent';
        }
        
        // Check for high priority keywords
        if (highKeywords.some(keyword => text.includes(keyword))) {
            return 'high';
        }
        
        // Category-based priority
        const categoryPriorities = {
            'public_safety': 'high',
            'water': 'high',
            'electricity': 'high',
            'traffic': 'medium',
            'sanitation': 'medium',
            'infrastructure': 'medium',
            'noise': 'low',
            'environment': 'low',
            'other': 'low'
        };
        
        return categoryPriorities[category] || 'medium';
    }

    /**
     * Calculate estimated resolution time
     */
    calculateEstimatedResolutionTime(complaint) {
        const baseDays = this.categoryResolutionTimes[complaint.category] || 7;
        const priorityMultiplier = this.priorityWeights[complaint.priority] || 7;
        
        // Adjust based on priority
        let estimatedDays = Math.ceil(baseDays * (priorityMultiplier / 7));
        
        // Add buffer for weekends
        if (estimatedDays > 2) {
            estimatedDays += Math.ceil(estimatedDays / 5) * 2; // Add weekend days
        }
        
        const resolutionDate = new Date();
        resolutionDate.setDate(resolutionDate.getDate() + estimatedDays);
        
        return {
            estimated_days: estimatedDays,
            estimated_date: resolutionDate.toISOString(),
            confidence: this.calculateConfidence(complaint)
        };
    }

    /**
     * Calculate confidence in resolution time estimate
     */
    calculateConfidence(complaint) {
        let confidence = 0.7; // Base confidence
        
        // Adjust based on category (some are more predictable)
        const categoryConfidence = {
            'electricity': 0.9,
            'water': 0.8,
            'traffic': 0.7,
            'sanitation': 0.8,
            'infrastructure': 0.6,
            'noise': 0.5,
            'environment': 0.5,
            'public_safety': 0.8,
            'other': 0.4
        };
        
        confidence = categoryConfidence[complaint.category] || 0.7;
        
        // Adjust based on priority (urgent cases are less predictable)
        if (complaint.priority === 'urgent') {
            confidence *= 0.8;
        } else if (complaint.priority === 'low') {
            confidence *= 1.1;
        }
        
        return Math.min(0.95, Math.max(0.3, confidence));
    }

    /**
     * Get complaint statistics
     */
    async getComplaintStatistics(filters = {}) {
        try {
            return {
                total_complaints: 0,
                by_status: {
                    filed: 0,
                    acknowledged: 0,
                    in_progress: 0,
                    resolved: 0,
                    closed: 0,
                    rejected: 0
                },
                by_category: {
                    infrastructure: 0,
                    sanitation: 0,
                    traffic: 0,
                    noise: 0,
                    water: 0,
                    electricity: 0,
                    public_safety: 0,
                    environment: 0,
                    other: 0
                },
                by_priority: {
                    urgent: 0,
                    high: 0,
                    medium: 0,
                    low: 0
                },
                average_resolution_time: 0,
                resolution_rate: 0
            };

        } catch (error) {
            console.error('Error fetching complaint statistics:', error);
            throw error;
        }
    }

    /**
     * Escalate complaint if overdue
     */
    async escalateComplaint(complaintId, reason) {
        try {
            console.log(`Escalating complaint ${complaintId}: ${reason}`);
            
            // This would update the complaint status and notify higher authorities
            return {
                complaint_id: complaintId,
                escalated: true,
                escalation_reason: reason,
                escalated_at: new Date()
            };

        } catch (error) {
            console.error('Error escalating complaint:', error);
            throw error;
        }
    }

    /**
     * Check for overdue complaints
     */
    async checkOverdueComplaints() {
        try {
            // This would query for complaints past their estimated resolution time
            const overdueComplaints = [];
            
            for (const complaint of overdueComplaints) {
                await this.escalateComplaint(complaint.complaint_id, 'Overdue resolution');
            }
            
            return overdueComplaints;

        } catch (error) {
            console.error('Error checking overdue complaints:', error);
            throw error;
        }
    }

    /**
     * Bulk update complaint statuses
     */
    async bulkUpdateStatus(complaintIds, status, authorityId) {
        try {
            const results = [];
            
            for (const complaintId of complaintIds) {
                const result = await this.updateComplaintStatus(complaintId, {
                    status,
                    authority_id: authorityId,
                    updated_at: new Date()
                });
                results.push(result);
            }
            
            return results;

        } catch (error) {
            console.error('Error bulk updating complaints:', error);
            throw error;
        }
    }

    /**
     * Generate complaint report
     */
    async generateReport(filters = {}) {
        try {
            const statistics = await this.getComplaintStatistics(filters);
            const complaints = await this.getComplaints(filters);
            
            return {
                generated_at: new Date().toISOString(),
                filters,
                statistics,
                complaints: complaints.data,
                summary: {
                    total_complaints: statistics.total_complaints,
                    resolution_rate: statistics.resolution_rate,
                    average_resolution_time: statistics.average_resolution_time,
                    most_common_category: this.getMostCommonCategory(statistics.by_category),
                    most_common_priority: this.getMostCommonPriority(statistics.by_priority)
                }
            };

        } catch (error) {
            console.error('Error generating report:', error);
            throw error;
        }
    }

    /**
     * Helper method to get most common category
     */
    getMostCommonCategory(categoryStats) {
        return Object.entries(categoryStats)
            .reduce((a, b) => categoryStats[a[0]] > categoryStats[b[0]] ? a : b)[0];
    }

    /**
     * Helper method to get most common priority
     */
    getMostCommonPriority(priorityStats) {
        return Object.entries(priorityStats)
            .reduce((a, b) => priorityStats[a[0]] > priorityStats[b[0]] ? a : b)[0];
    }
}

module.exports = ComplaintService;