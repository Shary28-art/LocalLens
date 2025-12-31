/**
 * Complaint Platform Notification Service
 * Handles notifications for citizens, authorities, and system events
 */

class NotificationService {
    constructor(io) {
        this.io = io;
        this.notificationChannels = {
            email: true,
            sms: true,
            push: true,
            socket: true
        };
    }

    async initialize() {
        console.log('NotificationService initialized');
    }

    /**
     * Notify when complaint is filed
     */
    async notifyComplaintFiled(complaint, assignedAuthority) {
        try {
            // Notify citizen
            const citizenNotification = {
                type: 'complaint_filed',
                title: 'Complaint Filed Successfully',
                message: `Your complaint "${complaint.title}" has been filed and assigned ID: ${complaint.complaint_id}`,
                data: {
                    complaint_id: complaint.complaint_id,
                    title: complaint.title,
                    category: complaint.category,
                    priority: complaint.priority,
                    assigned_authority: assignedAuthority?.name,
                    estimated_resolution: complaint.estimated_resolution_time
                },
                timestamp: new Date().toISOString()
            };

            await this.sendNotificationToCitizen(complaint.citizen_email, citizenNotification);

            // Notify assigned authority
            if (assignedAuthority) {
                const authorityNotification = {
                    type: 'new_complaint_assigned',
                    title: 'New Complaint Assigned',
                    message: `New ${complaint.priority} priority complaint in ${complaint.category} category`,
                    data: {
                        complaint_id: complaint.complaint_id,
                        title: complaint.title,
                        category: complaint.category,
                        priority: complaint.priority,
                        location: complaint.location,
                        citizen_name: complaint.is_anonymous ? 'Anonymous' : complaint.citizen_name
                    },
                    timestamp: new Date().toISOString()
                };

                await this.sendNotificationToAuthority(assignedAuthority.id, authorityNotification);
            }

            // Emit real-time events
            this.io.to(`citizen_${complaint.citizen_email}`).emit('complaint_filed', complaint);
            if (assignedAuthority) {
                this.io.to(`authority_${assignedAuthority.id}`).emit('new_complaint', complaint);
            }

            console.log(`Notifications sent for complaint ${complaint.complaint_id}`);

        } catch (error) {
            console.error('Error sending complaint filed notifications:', error);
            throw error;
        }
    }

    /**
     * Notify when complaint status is updated
     */
    async notifyStatusUpdate(complaint) {
        try {
            const statusMessages = {
                'acknowledged': 'Your complaint has been acknowledged and is being reviewed',
                'in_progress': 'Work has started on your complaint',
                'resolved': 'Your complaint has been resolved',
                'closed': 'Your complaint has been closed',
                'rejected': 'Your complaint has been rejected'
            };

            const citizenNotification = {
                type: 'status_update',
                title: 'Complaint Status Updated',
                message: statusMessages[complaint.status] || 'Your complaint status has been updated',
                data: {
                    complaint_id: complaint.complaint_id,
                    status: complaint.status,
                    resolution_notes: complaint.resolution_notes,
                    updated_at: complaint.updated_at
                },
                timestamp: new Date().toISOString()
            };

            await this.sendNotificationToCitizen(complaint.citizen_email, citizenNotification);

            // Emit real-time event
            this.io.to(`citizen_${complaint.citizen_email}`).emit('status_updated', complaint);
            this.io.to(`complaint_${complaint.complaint_id}`).emit('status_updated', complaint);

            console.log(`Status update notification sent for complaint ${complaint.complaint_id}`);

        } catch (error) {
            console.error('Error sending status update notification:', error);
            throw error;
        }
    }

    /**
     * Notify when new comment is added
     */
    async notifyNewComment(complaintId, comment) {
        try {
            const notification = {
                type: 'new_comment',
                title: 'New Comment Added',
                message: `A new comment has been added to your complaint`,
                data: {
                    complaint_id: complaintId,
                    comment: comment.comment,
                    author_type: comment.author_type,
                    created_at: comment.created_at
                },
                timestamp: new Date().toISOString()
            };

            // Notify relevant parties based on comment author
            if (comment.author_type === 'authority') {
                // Notify citizen
                const complaint = await this.getComplaintById(complaintId);
                if (complaint) {
                    await this.sendNotificationToCitizen(complaint.citizen_email, notification);
                }
            } else if (comment.author_type === 'citizen') {
                // Notify assigned authority
                const complaint = await this.getComplaintById(complaintId);
                if (complaint && complaint.assigned_authority_id) {
                    await this.sendNotificationToAuthority(complaint.assigned_authority_id, notification);
                }
            }

            // Emit real-time event
            this.io.to(`complaint_${complaintId}`).emit('new_comment', comment);

            console.log(`Comment notification sent for complaint ${complaintId}`);

        } catch (error) {
            console.error('Error sending comment notification:', error);
            throw error;
        }
    }

    /**
     * Notify about overdue complaints
     */
    async notifyOverdueComplaint(complaint, authority) {
        try {
            const authorityNotification = {
                type: 'complaint_overdue',
                title: 'Complaint Overdue',
                message: `Complaint ${complaint.complaint_id} is overdue for resolution`,
                priority: 'high',
                data: {
                    complaint_id: complaint.complaint_id,
                    title: complaint.title,
                    days_overdue: this.calculateDaysOverdue(complaint),
                    original_due_date: complaint.estimated_resolution_date
                },
                timestamp: new Date().toISOString()
            };

            await this.sendNotificationToAuthority(authority.id, authorityNotification);

            // Also notify supervisors or escalation contacts
            if (authority.supervisor_id) {
                await this.sendNotificationToAuthority(authority.supervisor_id, {
                    ...authorityNotification,
                    title: 'Subordinate Has Overdue Complaint',
                    message: `Authority ${authority.name} has an overdue complaint: ${complaint.complaint_id}`
                });
            }

            console.log(`Overdue notification sent for complaint ${complaint.complaint_id}`);

        } catch (error) {
            console.error('Error sending overdue notification:', error);
            throw error;
        }
    }

    /**
     * Notify about complaint escalation
     */
    async notifyComplaintEscalation(complaint, fromAuthority, toAuthority, reason) {
        try {
            // Notify new authority
            const newAuthorityNotification = {
                type: 'complaint_escalated',
                title: 'Complaint Escalated to You',
                message: `Complaint ${complaint.complaint_id} has been escalated to your department`,
                priority: 'high',
                data: {
                    complaint_id: complaint.complaint_id,
                    title: complaint.title,
                    escalation_reason: reason,
                    from_authority: fromAuthority.name,
                    escalated_at: new Date().toISOString()
                },
                timestamp: new Date().toISOString()
            };

            await this.sendNotificationToAuthority(toAuthority.id, newAuthorityNotification);

            // Notify citizen about escalation
            const citizenNotification = {
                type: 'complaint_escalated',
                title: 'Your Complaint Has Been Escalated',
                message: `Your complaint has been escalated to ${toAuthority.name} for faster resolution`,
                data: {
                    complaint_id: complaint.complaint_id,
                    new_authority: toAuthority.name,
                    escalation_reason: reason
                },
                timestamp: new Date().toISOString()
            };

            await this.sendNotificationToCitizen(complaint.citizen_email, citizenNotification);

            console.log(`Escalation notifications sent for complaint ${complaint.complaint_id}`);

        } catch (error) {
            console.error('Error sending escalation notifications:', error);
            throw error;
        }
    }

    /**
     * Send bulk notifications to authorities
     */
    async sendBulkNotificationToAuthorities(authorityIds, notification) {
        try {
            const results = [];
            
            for (const authorityId of authorityIds) {
                try {
                    await this.sendNotificationToAuthority(authorityId, notification);
                    results.push({ authorityId, success: true });
                } catch (error) {
                    results.push({ authorityId, success: false, error: error.message });
                }
            }

            return results;

        } catch (error) {
            console.error('Error sending bulk notifications:', error);
            throw error;
        }
    }

    /**
     * Send notification to citizen
     */
    async sendNotificationToCitizen(citizenEmail, notification) {
        try {
            // Socket notification
            if (this.notificationChannels.socket) {
                this.io.to(`citizen_${citizenEmail}`).emit('notification', notification);
            }

            // Email notification
            if (this.notificationChannels.email) {
                await this.sendEmail(citizenEmail, notification);
            }

            // SMS notification for urgent matters
            if (this.notificationChannels.sms && notification.priority === 'high') {
                await this.sendSMS(citizenEmail, notification);
            }

            // Push notification
            if (this.notificationChannels.push) {
                await this.sendPushNotification(citizenEmail, notification);
            }

        } catch (error) {
            console.error(`Error sending notification to citizen ${citizenEmail}:`, error);
        }
    }

    /**
     * Send notification to authority
     */
    async sendNotificationToAuthority(authorityId, notification) {
        try {
            // Socket notification
            if (this.notificationChannels.socket) {
                this.io.to(`authority_${authorityId}`).emit('notification', notification);
            }

            // Email notification
            if (this.notificationChannels.email) {
                const authority = await this.getAuthorityById(authorityId);
                if (authority && authority.contact_email) {
                    await this.sendEmail(authority.contact_email, notification);
                }
            }

            // SMS for urgent notifications
            if (this.notificationChannels.sms && notification.priority === 'high') {
                const authority = await this.getAuthorityById(authorityId);
                if (authority && authority.contact_phone) {
                    await this.sendSMS(authority.contact_phone, notification);
                }
            }

        } catch (error) {
            console.error(`Error sending notification to authority ${authorityId}:`, error);
        }
    }

    /**
     * Mock email service
     */
    async sendEmail(recipient, notification) {
        console.log(`Email sent to ${recipient}: ${notification.title}`);
        return true;
    }

    /**
     * Mock SMS service
     */
    async sendSMS(recipient, notification) {
        console.log(`SMS sent to ${recipient}: ${notification.message}`);
        return true;
    }

    /**
     * Mock push notification service
     */
    async sendPushNotification(recipient, notification) {
        console.log(`Push notification sent to ${recipient}: ${notification.title}`);
        return true;
    }

    /**
     * Schedule reminder notifications
     */
    async scheduleReminder(complaintId, reminderDate, message) {
        try {
            // This would typically use a job queue or scheduler
            console.log(`Reminder scheduled for complaint ${complaintId} on ${reminderDate}`);
            
            return {
                complaint_id: complaintId,
                reminder_date: reminderDate,
                message,
                scheduled_at: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error scheduling reminder:', error);
            throw error;
        }
    }

    /**
     * Send daily digest to authorities
     */
    async sendDailyDigest(authorityId) {
        try {
            // Get authority's pending complaints
            const pendingComplaints = await this.getAuthorityPendingComplaints(authorityId);
            
            const digestNotification = {
                type: 'daily_digest',
                title: 'Daily Complaint Digest',
                message: `You have ${pendingComplaints.length} pending complaints`,
                data: {
                    pending_count: pendingComplaints.length,
                    urgent_count: pendingComplaints.filter(c => c.priority === 'urgent').length,
                    overdue_count: pendingComplaints.filter(c => this.isOverdue(c)).length,
                    complaints: pendingComplaints.slice(0, 5) // Top 5 complaints
                },
                timestamp: new Date().toISOString()
            };

            await this.sendNotificationToAuthority(authorityId, digestNotification);

        } catch (error) {
            console.error('Error sending daily digest:', error);
            throw error;
        }
    }

    /**
     * Helper methods
     */
    async getComplaintById(complaintId) {
        // This would query the database
        return null;
    }

    async getAuthorityById(authorityId) {
        // This would query the database
        return null;
    }

    async getAuthorityPendingComplaints(authorityId) {
        // This would query the database
        return [];
    }

    calculateDaysOverdue(complaint) {
        if (!complaint.estimated_resolution_date) return 0;
        
        const now = new Date();
        const dueDate = new Date(complaint.estimated_resolution_date);
        const diffTime = now - dueDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return Math.max(0, diffDays);
    }

    isOverdue(complaint) {
        return this.calculateDaysOverdue(complaint) > 0;
    }

    /**
     * Update notification preferences
     */
    updateNotificationChannels(channels) {
        this.notificationChannels = { ...this.notificationChannels, ...channels };
    }

    /**
     * Get notification statistics
     */
    async getNotificationStatistics(timeframe = '30d') {
        return {
            total_sent: 0,
            delivery_rate: 0,
            channel_breakdown: {
                email: 0,
                sms: 0,
                push: 0,
                socket: 0
            },
            by_type: {
                complaint_filed: 0,
                status_update: 0,
                new_comment: 0,
                overdue: 0,
                escalation: 0
            }
        };
    }
}

module.exports = NotificationService;