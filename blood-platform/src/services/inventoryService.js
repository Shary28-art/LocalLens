/**
 * Blood Bank Inventory Service
 * Manages blood bank inventory, stock levels, and expiration tracking
 */

class InventoryService {
    constructor() {
        this.bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        this.expirationDays = 42; // Blood expires after 42 days
        this.lowStockThreshold = 5; // Alert when stock falls below 5 units
        this.criticalStockThreshold = 2; // Critical alert when stock falls below 2 units
    }

    async initialize() {
        console.log('InventoryService initialized');
    }

    /**
     * Get blood bank inventory
     */
    async getBloodBankInventory(bankId) {
        try {
            // This would typically query the database
            // Mock implementation for now
            const inventory = {};
            
            for (const bloodType of this.bloodTypes) {
                inventory[bloodType] = {
                    total_units: Math.floor(Math.random() * 50),
                    available_units: Math.floor(Math.random() * 40),
                    reserved_units: Math.floor(Math.random() * 10),
                    expired_units: Math.floor(Math.random() * 5),
                    expiring_soon: Math.floor(Math.random() * 8), // Expiring in next 7 days
                    last_updated: new Date().toISOString(),
                    stock_status: this.getStockStatus(Math.floor(Math.random() * 40))
                };
            }

            return {
                bank_id: bankId,
                inventory,
                total_units: Object.values(inventory).reduce((sum, item) => sum + item.total_units, 0),
                last_updated: new Date().toISOString(),
                alerts: this.generateInventoryAlerts(inventory)
            };

        } catch (error) {
            console.error('Error fetching blood bank inventory:', error);
            throw error;
        }
    }

    /**
     * Update inventory after donation
     */
    async updateInventoryAfterDonation(bankId, bloodType, units, donationDate) {
        try {
            const expirationDate = new Date(donationDate);
            expirationDate.setDate(expirationDate.getDate() + this.expirationDays);

            // This would update the database
            console.log(`Updated inventory: +${units} units of ${bloodType} at bank ${bankId}`);
            console.log(`Expiration date: ${expirationDate.toISOString()}`);

            return {
                success: true,
                blood_type: bloodType,
                units_added: units,
                expiration_date: expirationDate,
                updated_at: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error updating inventory after donation:', error);
            throw error;
        }
    }

    /**
     * Reserve blood units for a request
     */
    async reserveBloodUnits(bankId, bloodType, units, requestId) {
        try {
            // Check availability
            const inventory = await this.getBloodBankInventory(bankId);
            const available = inventory.inventory[bloodType]?.available_units || 0;

            if (available < units) {
                throw new Error(`Insufficient stock: ${available} units available, ${units} requested`);
            }

            // Reserve units (would update database)
            console.log(`Reserved ${units} units of ${bloodType} for request ${requestId}`);

            return {
                success: true,
                reservation_id: `RES_${Date.now()}`,
                blood_type: bloodType,
                units_reserved: units,
                bank_id: bankId,
                request_id: requestId,
                reserved_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
            };

        } catch (error) {
            console.error('Error reserving blood units:', error);
            throw error;
        }
    }

    /**
     * Release reserved blood units
     */
    async releaseReservedUnits(reservationId) {
        try {
            // This would update the database to release reserved units
            console.log(`Released reservation ${reservationId}`);

            return {
                success: true,
                reservation_id: reservationId,
                released_at: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error releasing reserved units:', error);
            throw error;
        }
    }

    /**
     * Process blood unit usage (when blood is actually used)
     */
    async processBloodUsage(bankId, bloodType, units, usageType = 'transfusion') {
        try {
            // This would update the database to reduce available stock
            console.log(`Processed usage: -${units} units of ${bloodType} for ${usageType}`);

            return {
                success: true,
                blood_type: bloodType,
                units_used: units,
                usage_type: usageType,
                bank_id: bankId,
                processed_at: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error processing blood usage:', error);
            throw error;
        }
    }

    /**
     * Get stock status based on available units
     */
    getStockStatus(availableUnits) {
        if (availableUnits <= this.criticalStockThreshold) {
            return 'critical';
        } else if (availableUnits <= this.lowStockThreshold) {
            return 'low';
        } else if (availableUnits >= 20) {
            return 'good';
        } else {
            return 'adequate';
        }
    }

    /**
     * Generate inventory alerts
     */
    generateInventoryAlerts(inventory) {
        const alerts = [];

        for (const [bloodType, data] of Object.entries(inventory)) {
            // Low stock alerts
            if (data.available_units <= this.criticalStockThreshold) {
                alerts.push({
                    type: 'critical_stock',
                    blood_type: bloodType,
                    message: `CRITICAL: Only ${data.available_units} units of ${bloodType} remaining`,
                    priority: 'high',
                    created_at: new Date().toISOString()
                });
            } else if (data.available_units <= this.lowStockThreshold) {
                alerts.push({
                    type: 'low_stock',
                    blood_type: bloodType,
                    message: `Low stock: ${data.available_units} units of ${bloodType} remaining`,
                    priority: 'medium',
                    created_at: new Date().toISOString()
                });
            }

            // Expiration alerts
            if (data.expiring_soon > 0) {
                alerts.push({
                    type: 'expiring_soon',
                    blood_type: bloodType,
                    message: `${data.expiring_soon} units of ${bloodType} expiring within 7 days`,
                    priority: 'medium',
                    created_at: new Date().toISOString()
                });
            }
        }

        return alerts;
    }

    /**
     * Get inventory statistics
     */
    async getInventoryStatistics(bankId, timeframe = '30d') {
        try {
            return {
                bank_id: bankId,
                timeframe,
                statistics: {
                    total_donations: Math.floor(Math.random() * 100),
                    total_usage: Math.floor(Math.random() * 80),
                    expired_units: Math.floor(Math.random() * 10),
                    turnover_rate: (Math.random() * 0.5 + 0.3).toFixed(2), // 30-80%
                    waste_percentage: (Math.random() * 0.1).toFixed(2), // 0-10%
                    blood_type_distribution: this.generateBloodTypeDistribution(),
                    peak_usage_hours: ['09:00-12:00', '14:00-17:00'],
                    average_stock_level: Math.floor(Math.random() * 30 + 10)
                },
                generated_at: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error generating inventory statistics:', error);
            throw error;
        }
    }

    /**
     * Generate blood type distribution statistics
     */
    generateBloodTypeDistribution() {
        const distribution = {};
        
        for (const bloodType of this.bloodTypes) {
            distribution[bloodType] = {
                percentage: (Math.random() * 20 + 5).toFixed(1), // 5-25%
                units: Math.floor(Math.random() * 50 + 10)
            };
        }
        
        return distribution;
    }

    /**
     * Check for expired blood units
     */
    async checkExpiredUnits(bankId) {
        try {
            // This would query the database for expired units
            const expiredUnits = [];
            
            for (const bloodType of this.bloodTypes) {
                const expired = Math.floor(Math.random() * 5);
                if (expired > 0) {
                    expiredUnits.push({
                        blood_type: bloodType,
                        units: expired,
                        expired_date: new Date().toISOString()
                    });
                }
            }

            return {
                bank_id: bankId,
                expired_units: expiredUnits,
                total_expired: expiredUnits.reduce((sum, item) => sum + item.units, 0),
                checked_at: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error checking expired units:', error);
            throw error;
        }
    }

    /**
     * Get inventory forecast
     */
    async getInventoryForecast(bankId, days = 7) {
        try {
            const forecast = [];
            
            for (let i = 1; i <= days; i++) {
                const date = new Date();
                date.setDate(date.getDate() + i);
                
                const dayForecast = {};
                for (const bloodType of this.bloodTypes) {
                    dayForecast[bloodType] = {
                        predicted_stock: Math.floor(Math.random() * 40 + 5),
                        predicted_demand: Math.floor(Math.random() * 10 + 1),
                        recommended_action: Math.random() > 0.7 ? 'request_donations' : 'maintain'
                    };
                }
                
                forecast.push({
                    date: date.toISOString().split('T')[0],
                    predictions: dayForecast
                });
            }

            return {
                bank_id: bankId,
                forecast_period: `${days} days`,
                forecast,
                generated_at: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error generating inventory forecast:', error);
            throw error;
        }
    }
}

module.exports = InventoryService;