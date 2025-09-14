/**
 * @fileoverview Monitoring service for tracking authentication and system metrics
 *
 * @author abhisekadhikari
 * @version 1.0.0
 */

import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger";

const prisma = new PrismaClient();

export interface AuthMetrics {
    totalUsers: number;
    verifiedUsers: number;
    totalOTPs: number;
    successfulOTPs: number;
    failedOTPs: number;
    smsDelivered: number;
    smsFailed: number;
    averageOTPTime: number;
    topPhoneNumbers: Array<{ phone: string; count: number }>;
    recentActivity: Array<{
        timestamp: Date;
        event: string;
        phoneNumber: string;
        success: boolean;
    }>;
}

export interface SystemHealth {
    database: "healthy" | "unhealthy";
    smsService: "healthy" | "unhealthy" | "not_configured";
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    timestamp: Date;
}

class MonitoringService {
    private startTime = Date.now();

    /**
     * Get authentication metrics
     */
    async getAuthMetrics(): Promise<AuthMetrics> {
        try {
            // Get user statistics
            const totalUsers = await prisma.users.count();
            const verifiedUsers = await prisma.users.count({
                where: { is_phone_verified: true },
            });

            // Get OTP statistics
            const totalOTPs = await prisma.otps.count();
            const successfulOTPs = await prisma.otps.count({
                where: { consumed_at: { not: null } },
            });
            const failedOTPs = totalOTPs - successfulOTPs;

            // Get SMS delivery statistics (approximate)
            const smsDelivered = successfulOTPs; // Assuming successful OTPs = delivered SMS
            const smsFailed = failedOTPs;

            // Calculate average OTP verification time
            const otpRecords = await prisma.otps.findMany({
                where: {
                    consumed_at: { not: null },
                    created_at: { not: null },
                },
                select: {
                    created_at: true,
                    consumed_at: true,
                },
            });

            const averageOTPTime =
                otpRecords.length > 0
                    ? otpRecords.reduce((sum, record) => {
                          const duration =
                              record.consumed_at!.getTime() -
                              record.created_at!.getTime();
                          return sum + duration;
                      }, 0) /
                      otpRecords.length /
                      1000 // Convert to seconds
                    : 0;

            // Get top phone numbers by OTP requests
            const topPhoneNumbers = await prisma.otps
                .groupBy({
                    by: ["phone_number"],
                    _count: { phone_number: true },
                    orderBy: { _count: { phone_number: "desc" } },
                    take: 10,
                })
                .then((results) =>
                    results.map((r) => ({
                        phone: r.phone_number || "unknown",
                        count: r._count.phone_number,
                    }))
                );

            // Get recent activity (last 24 hours)
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const recentActivity = await prisma.otps
                .findMany({
                    where: {
                        created_at: { gte: yesterday },
                    },
                    select: {
                        created_at: true,
                        phone_number: true,
                        consumed_at: true,
                    },
                    orderBy: { created_at: "desc" },
                    take: 50,
                })
                .then((records) =>
                    records.map((r) => ({
                        timestamp: r.created_at!,
                        event: "otp_generated",
                        phoneNumber: r.phone_number || "unknown",
                        success: r.consumed_at !== null,
                    }))
                );

            return {
                totalUsers,
                verifiedUsers,
                totalOTPs,
                successfulOTPs,
                failedOTPs,
                smsDelivered,
                smsFailed,
                averageOTPTime: Math.round(averageOTPTime),
                topPhoneNumbers,
                recentActivity,
            };
        } catch (error) {
            logger.error("Failed to get auth metrics", {
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Get system health status
     */
    async getSystemHealth(): Promise<SystemHealth> {
        try {
            // Test database connection
            await prisma.$queryRaw`SELECT 1`;
            const database: "healthy" | "unhealthy" = "healthy";

            // Check SMS service status
            const smsService: "healthy" | "unhealthy" | "not_configured" =
                process.env.FAST2SMS_API_KEY ? "healthy" : "not_configured";

            // Calculate uptime
            const uptime = Date.now() - this.startTime;

            // Get memory usage
            const memoryUsage = process.memoryUsage();

            return {
                database,
                smsService,
                uptime,
                memoryUsage,
                timestamp: new Date(),
            };
        } catch (error) {
            logger.error("Failed to get system health", {
                error: error.message,
            });
            return {
                database: "unhealthy",
                smsService: "unhealthy",
                uptime: Date.now() - this.startTime,
                memoryUsage: process.memoryUsage(),
                timestamp: new Date(),
            };
        }
    }

    /**
     * Log authentication event
     */
    logAuthEvent(
        event: string,
        phoneNumber: string,
        success: boolean,
        context?: any
    ): void {
        logger.info(`Auth event: ${event}`, {
            phoneNumber,
            success,
            event: `auth_${event}`,
            ...context,
        });
    }

    /**
     * Log performance metrics
     */
    logPerformance(operation: string, startTime: number, context?: any): void {
        const duration = Date.now() - startTime;
        logger.performance(operation, duration, context);
    }

    /**
     * Check for suspicious activity
     */
    async checkSuspiciousActivity(phoneNumber: string): Promise<boolean> {
        try {
            // Check for too many OTP requests in last hour
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const recentOTPs = await prisma.otps.count({
                where: {
                    phone_number: phoneNumber,
                    created_at: { gte: oneHourAgo },
                },
            });

            if (recentOTPs > 10) {
                logger.suspiciousActivity(
                    phoneNumber,
                    `Too many OTP requests: ${recentOTPs} in last hour`
                );
                return true;
            }

            // Check for too many failed attempts
            const failedAttempts = await prisma.otps.count({
                where: {
                    phone_number: phoneNumber,
                    created_at: { gte: oneHourAgo },
                    attempts: { gte: 5 },
                },
            });

            if (failedAttempts > 3) {
                logger.suspiciousActivity(
                    phoneNumber,
                    `Too many failed attempts: ${failedAttempts} in last hour`
                );
                return true;
            }

            return false;
        } catch (error) {
            logger.error("Failed to check suspicious activity", {
                error: error.message,
            });
            return false;
        }
    }

    /**
     * Clean up old OTP records
     */
    async cleanupOldOTPs(): Promise<number> {
        try {
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const result = await prisma.otps.deleteMany({
                where: {
                    created_at: { lt: oneDayAgo },
                },
            });

            logger.info(`Cleaned up ${result.count} old OTP records`);
            return result.count;
        } catch (error) {
            logger.error("Failed to cleanup old OTPs", {
                error: error.message,
            });
            return 0;
        }
    }

    /**
     * Get daily statistics
     */
    async getDailyStats(): Promise<{
        date: string;
        otpsGenerated: number;
        otpsVerified: number;
        usersCreated: number;
        smsDelivered: number;
    }> {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const otpsGenerated = await prisma.otps.count({
                where: {
                    created_at: { gte: today, lt: tomorrow },
                },
            });

            const otpsVerified = await prisma.otps.count({
                where: {
                    consumed_at: { gte: today, lt: tomorrow },
                },
            });

            const usersCreated = await prisma.users.count({
                where: {
                    created_at: { gte: today, lt: tomorrow },
                },
            });

            return {
                date: today.toISOString().split("T")[0],
                otpsGenerated,
                otpsVerified,
                usersCreated,
                smsDelivered: otpsVerified, // Assuming verified OTPs = delivered SMS
            };
        } catch (error) {
            logger.error("Failed to get daily stats", { error: error.message });
            throw error;
        }
    }
}

export const monitoringService = new MonitoringService();
export default monitoringService;
