/**
 * Blood Donation Matching Service
 * Handles donor-recipient matching algorithms and compatibility checks
 */

const { calculateDistance } = require('../utils/helpers');

class MatchingService {
    constructor() {
        this.bloodCompatibility = {
            'A+': ['A+', 'AB+'],
            'A-': ['A+', 'A-', 'AB+', 'AB-'],
            'B+': ['B+', 'AB+'],
            'B-': ['B+', 'B-', 'AB+', 'AB-'],
            'AB+': ['AB+'],
            'AB-': ['AB+', 'AB-'],
            'O+': ['A+', 'B+', 'AB+', 'O+'],
            'O-': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
        };
        
        this.urgencyWeights = {
            'critical': 1.0,
            'high': 0.8,
            'medium': 0.6,
            'low': 0.4
        };
    }

    async initialize() {
        // Initialize any required resources
        console.log('MatchingService initialized');
    }

    /**
     * Find compatible donors for a blood request
     */
    async findCompatibleDonors(bloodRequest) {
        try {
            const { blood_type, location, urgency = 'medium' } = bloodRequest;
            
            // Get compatible blood types
            const compatibleTypes = this.getCompatibleBloodTypes(blood_type);
            
            // Calculate search radius based on urgency
            const searchRadius = this.calculateSearchRadius(urgency);
            
            // Find available donors
            const donors = await this.findDonorsByBloodType(blood_type, {
                location,
                radius: searchRadius,
                urgency,
                availability: true
            });

            // Score and sort donors
            const scoredDonors = donors.map(donor => ({
                ...donor,
                compatibility_score: this.calculateCompatibilityScore(donor, bloodRequest)
            }));

            return scoredDonors.sort((a, b) => b.compatibility_score - a.compatibility_score);

        } catch (error) {
            console.error('Error finding compatible donors:', error);
            throw error;
        }
    }

    /**
     * Find donors by blood type with filters
     */
    async findDonorsByBloodType(bloodType, filters = {}) {
        const { location, radius = 50, urgency = 'medium', availability = true } = filters;
        
        // This would typically query the database
        // For now, returning mock data structure
        return [];
    }

    /**
     * Get compatible blood types for donation
     */
    getCompatibleBloodTypes(recipientBloodType) {
        const compatible = [];
        
        for (const [donorType, canDonateTo] of Object.entries(this.bloodCompatibility)) {
            if (canDonateTo.includes(recipientBloodType)) {
                compatible.push(donorType);
            }
        }
        
        return compatible;
    }

    /**
     * Calculate compatibility score between donor and request
     */
    calculateCompatibilityScore(donor, request) {
        let score = 0;
        
        // Blood type compatibility (base score)
        if (this.isBloodTypeCompatible(donor.blood_type, request.blood_type)) {
            score += 100;
        }
        
        // Distance factor (closer is better)
        const distance = calculateDistance(
            donor.location.lat, donor.location.lng,
            request.location.lat, request.location.lng
        );
        
        const distanceScore = Math.max(0, 50 - (distance * 2));
        score += distanceScore;
        
        // Availability factor
        if (donor.availability) {
            score += 30;
        }
        
        // Recent donation history (prefer donors who haven't donated recently)
        if (donor.last_donation_date) {
            const daysSinceLastDonation = (Date.now() - new Date(donor.last_donation_date)) / (1000 * 60 * 60 * 24);
            if (daysSinceLastDonation >= 56) { // 8 weeks minimum
                score += 20;
            }
        } else {
            score += 20; // First-time donor
        }
        
        // Urgency multiplier
        const urgencyMultiplier = this.urgencyWeights[request.urgency] || 0.6;
        score *= urgencyMultiplier;
        
        return Math.round(score);
    }

    /**
     * Check if donor blood type is compatible with recipient
     */
    isBloodTypeCompatible(donorType, recipientType) {
        return this.bloodCompatibility[donorType]?.includes(recipientType) || false;
    }

    /**
     * Calculate search radius based on urgency
     */
    calculateSearchRadius(urgency) {
        const radiusMap = {
            'critical': 200, // 200km for critical cases
            'high': 100,     // 100km for high priority
            'medium': 50,    // 50km for medium priority
            'low': 25        // 25km for low priority
        };
        
        return radiusMap[urgency] || 50;
    }

    /**
     * Calculate estimated response time
     */
    calculateEstimatedResponseTime(urgency, donorCount) {
        const baseTime = {
            'critical': 30,  // 30 minutes
            'high': 120,     // 2 hours
            'medium': 360,   // 6 hours
            'low': 720       // 12 hours
        };
        
        const base = baseTime[urgency] || 360;
        
        // Adjust based on available donors
        if (donorCount === 0) return base * 3;
        if (donorCount < 3) return base * 1.5;
        if (donorCount > 10) return base * 0.7;
        
        return base;
    }

    /**
     * Find pending requests for a specific donor
     */
    async findPendingRequestsForDonor(donorId) {
        // This would query the database for pending requests
        // that match the donor's blood type and location
        return [];
    }

    /**
     * Update matching algorithm parameters
     */
    updateMatchingParameters(params) {
        if (params.urgencyWeights) {
            this.urgencyWeights = { ...this.urgencyWeights, ...params.urgencyWeights };
        }
        
        if (params.bloodCompatibility) {
            this.bloodCompatibility = { ...this.bloodCompatibility, ...params.bloodCompatibility };
        }
    }

    /**
     * Get matching statistics
     */
    async getMatchingStatistics(timeframe = '30d') {
        return {
            total_matches: 0,
            successful_donations: 0,
            average_response_time: 0,
            compatibility_rate: 0,
            urgency_distribution: {
                critical: 0,
                high: 0,
                medium: 0,
                low: 0
            }
        };
    }
}

module.exports = MatchingService;