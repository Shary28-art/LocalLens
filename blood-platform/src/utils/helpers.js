/**
 * Blood Platform Helper Utilities
 * Common utility functions for the blood donation platform
 */

/**
 * Validate geographic coordinates
 */
function validateCoordinates(lat, lng) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    if (isNaN(latitude) || isNaN(longitude)) {
        return { valid: false, error: 'Coordinates must be valid numbers' };
    }
    
    if (latitude < -90 || latitude > 90) {
        return { valid: false, error: 'Latitude must be between -90 and 90' };
    }
    
    if (longitude < -180 || longitude > 180) {
        return { valid: false, error: 'Longitude must be between -180 and 180' };
    }
    
    return { valid: true, lat: latitude, lng: longitude };
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Validate blood type
 */
function validateBloodType(bloodType) {
    const validTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    return validTypes.includes(bloodType);
}

/**
 * Get blood type compatibility
 */
function getBloodTypeCompatibility(donorType, recipientType) {
    const compatibility = {
        'O-': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        'O+': ['A+', 'B+', 'AB+', 'O+'],
        'A-': ['A+', 'A-', 'AB+', 'AB-'],
        'A+': ['A+', 'AB+'],
        'B-': ['B+', 'B-', 'AB+', 'AB-'],
        'B+': ['B+', 'AB+'],
        'AB-': ['AB+', 'AB-'],
        'AB+': ['AB+']
    };
    
    return compatibility[donorType]?.includes(recipientType) || false;
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age;
}

/**
 * Validate donor eligibility
 */
function validateDonorEligibility(donor) {
    const errors = [];
    
    // Age validation (18-65 years)
    const age = calculateAge(donor.date_of_birth);
    if (age < 18) {
        errors.push('Donor must be at least 18 years old');
    }
    if (age > 65) {
        errors.push('Donor must be under 65 years old');
    }
    
    // Blood type validation
    if (!validateBloodType(donor.blood_type)) {
        errors.push('Invalid blood type');
    }
    
    // Medical conditions check (basic validation)
    if (donor.medical_conditions && Array.isArray(donor.medical_conditions)) {
        const restrictiveConditions = [
            'HIV', 'Hepatitis B', 'Hepatitis C', 'Syphilis', 'Malaria',
            'Heart Disease', 'Cancer', 'Diabetes (insulin-dependent)'
        ];
        
        const hasRestrictiveCondition = donor.medical_conditions.some(condition =>
            restrictiveConditions.some(restricted =>
                condition.toLowerCase().includes(restricted.toLowerCase())
            )
        );
        
        if (hasRestrictiveCondition) {
            errors.push('Medical condition may restrict donation eligibility');
        }
    }
    
    return {
        eligible: errors.length === 0,
        errors
    };
}

/**
 * Format phone number
 */
function formatPhoneNumber(phone) {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Check if it's a valid length
    if (cleaned.length < 10 || cleaned.length > 15) {
        return null;
    }
    
    return cleaned;
}

/**
 * Validate email format
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Generate unique identifier
 */
function generateUniqueId(prefix = '') {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `${prefix}${timestamp}${randomStr}`.toUpperCase();
}

/**
 * Calculate donation eligibility date
 */
function calculateNextDonationDate(lastDonationDate) {
    if (!lastDonationDate) {
        return new Date(); // Can donate immediately if never donated
    }
    
    const lastDonation = new Date(lastDonationDate);
    const nextEligibleDate = new Date(lastDonation);
    nextEligibleDate.setDate(nextEligibleDate.getDate() + 56); // 8 weeks minimum
    
    return nextEligibleDate;
}

/**
 * Check if donor can donate now
 */
function canDonateNow(lastDonationDate) {
    const nextEligibleDate = calculateNextDonationDate(lastDonationDate);
    return new Date() >= nextEligibleDate;
}

/**
 * Format date for display
 */
function formatDate(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    
    if (format === 'YYYY-MM-DD') {
        return d.toISOString().split('T')[0];
    }
    
    if (format === 'DD/MM/YYYY') {
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    }
    
    if (format === 'readable') {
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    return d.toISOString();
}

/**
 * Calculate time until needed
 */
function calculateTimeUntilNeeded(neededBy) {
    const now = new Date();
    const needed = new Date(neededBy);
    const diffMs = needed - now;
    
    if (diffMs <= 0) {
        return { overdue: true, message: 'Overdue' };
    }
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
        return { 
            overdue: false, 
            days: diffDays, 
            hours: diffHours % 24,
            message: `${diffDays} day(s) ${diffHours % 24} hour(s)`
        };
    }
    
    return { 
        overdue: false, 
        hours: diffHours,
        message: `${diffHours} hour(s)`
    };
}

/**
 * Sanitize input string
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') {
        return input;
    }
    
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .substring(0, 1000); // Limit length
}

/**
 * Generate random password
 */
function generateRandomPassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
}

/**
 * Check if time is within business hours
 */
function isWithinBusinessHours(date = new Date()) {
    const hour = date.getHours();
    const day = date.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Monday to Friday, 8 AM to 6 PM
    return day >= 1 && day <= 5 && hour >= 8 && hour < 18;
}

/**
 * Get urgency color code
 */
function getUrgencyColor(urgency) {
    const colors = {
        'low': '#28a745',      // Green
        'medium': '#ffc107',   // Yellow
        'high': '#fd7e14',     // Orange
        'critical': '#dc3545'  // Red
    };
    
    return colors[urgency] || '#6c757d'; // Default gray
}

/**
 * Calculate response time priority
 */
function calculateResponsePriority(urgency, distance, donorCount) {
    let priority = 0;
    
    // Urgency weight (0-100)
    const urgencyWeights = {
        'critical': 100,
        'high': 75,
        'medium': 50,
        'low': 25
    };
    priority += urgencyWeights[urgency] || 50;
    
    // Distance factor (closer = higher priority)
    const distanceFactor = Math.max(0, 50 - distance);
    priority += distanceFactor;
    
    // Donor availability factor
    if (donorCount === 0) {
        priority *= 0.5; // Reduce priority if no donors available
    } else if (donorCount > 5) {
        priority *= 1.2; // Increase priority if many donors available
    }
    
    return Math.min(200, Math.max(0, Math.round(priority)));
}

module.exports = {
    validateCoordinates,
    calculateDistance,
    validateBloodType,
    getBloodTypeCompatibility,
    calculateAge,
    validateDonorEligibility,
    formatPhoneNumber,
    validateEmail,
    generateUniqueId,
    calculateNextDonationDate,
    canDonateNow,
    formatDate,
    calculateTimeUntilNeeded,
    sanitizeInput,
    generateRandomPassword,
    isWithinBusinessHours,
    getUrgencyColor,
    calculateResponsePriority
};