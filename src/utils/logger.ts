/**
 * @fileoverview Centralized logging utility for the application
 * Provides structured logging with different levels and contexts
 *
 * @author abhisekadhikari
 * @version 1.0.0
 */

export enum LogLevel {
    ERROR = "error",
    WARN = "warn",
    INFO = "info",
    DEBUG = "debug",
}

export interface LogContext {
    userId?: string;
    phoneNumber?: string;
    otpId?: string;
    requestId?: string;
    endpoint?: string;
    method?: string;
    ip?: string;
    userAgent?: string;
    [key: string]: any;
}

class Logger {
    private isDevelopment = process.env.NODE_ENV === "development";
    private isProduction = process.env.NODE_ENV === "production";

    private formatMessage(
        level: LogLevel,
        message: string,
        context?: LogContext
    ): string {
        const timestamp = new Date().toISOString();
        const contextStr = context ? ` | ${JSON.stringify(context)}` : "";
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
    }

    private log(level: LogLevel, message: string, context?: LogContext): void {
        const formattedMessage = this.formatMessage(level, message, context);

        switch (level) {
            case LogLevel.ERROR:
                console.error(formattedMessage);
                break;
            case LogLevel.WARN:
                console.warn(formattedMessage);
                break;
            case LogLevel.INFO:
                console.log(formattedMessage);
                break;
            case LogLevel.DEBUG:
                if (this.isDevelopment) {
                    console.log(formattedMessage);
                }
                break;
        }
    }

    error(message: string, context?: LogContext): void {
        this.log(LogLevel.ERROR, message, context);
    }

    warn(message: string, context?: LogContext): void {
        this.log(LogLevel.WARN, message, context);
    }

    info(message: string, context?: LogContext): void {
        this.log(LogLevel.INFO, message, context);
    }

    debug(message: string, context?: LogContext): void {
        this.log(LogLevel.DEBUG, message, context);
    }

    // Specialized logging methods for authentication
    otpGenerated(
        phoneNumber: string,
        otpId: string,
        context?: LogContext
    ): void {
        this.info(`OTP generated for phone: ${phoneNumber}`, {
            ...context,
            phoneNumber,
            otpId,
            event: "otp_generated",
        });
    }

    otpSent(
        phoneNumber: string,
        method: "sms" | "console",
        context?: LogContext
    ): void {
        this.info(`OTP sent via ${method} to phone: ${phoneNumber}`, {
            ...context,
            phoneNumber,
            method,
            event: "otp_sent",
        });
    }

    otpVerified(
        phoneNumber: string,
        userId: string,
        isNewUser: boolean,
        context?: LogContext
    ): void {
        this.info(
            `OTP verified for phone: ${phoneNumber}, user: ${userId}, new: ${isNewUser}`,
            {
                ...context,
                phoneNumber,
                userId,
                isNewUser,
                event: "otp_verified",
            }
        );
    }

    otpFailed(phoneNumber: string, reason: string, context?: LogContext): void {
        this.warn(
            `OTP verification failed for phone: ${phoneNumber}, reason: ${reason}`,
            {
                ...context,
                phoneNumber,
                reason,
                event: "otp_failed",
            }
        );
    }

    smsError(phoneNumber: string, error: string, context?: LogContext): void {
        this.error(
            `SMS sending failed for phone: ${phoneNumber}, error: ${error}`,
            {
                ...context,
                phoneNumber,
                error,
                event: "sms_error",
            }
        );
    }

    userCreated(
        userId: string,
        phoneNumber: string,
        userName: string,
        context?: LogContext
    ): void {
        this.info(
            `User created: ${userId}, phone: ${phoneNumber}, name: ${userName}`,
            {
                ...context,
                userId,
                phoneNumber,
                userName,
                event: "user_created",
            }
        );
    }

    userLogin(userId: string, phoneNumber: string, context?: LogContext): void {
        this.info(`User login: ${userId}, phone: ${phoneNumber}`, {
            ...context,
            userId,
            phoneNumber,
            event: "user_login",
        });
    }

    // Analytics logging
    interactionCreated(
        userId: string,
        questionId: string,
        interactionType: string,
        context?: LogContext
    ): void {
        this.info(
            `Interaction created: user ${userId}, question ${questionId}, type: ${interactionType}`,
            {
                ...context,
                userId,
                questionId,
                interactionType,
                event: "interaction_created",
            }
        );
    }

    // Security logging
    suspiciousActivity(
        phoneNumber: string,
        activity: string,
        context?: LogContext
    ): void {
        this.warn(
            `Suspicious activity detected: phone ${phoneNumber}, activity: ${activity}`,
            {
                ...context,
                phoneNumber,
                activity,
                event: "suspicious_activity",
            }
        );
    }

    // Performance logging
    performance(
        operation: string,
        duration: number,
        context?: LogContext
    ): void {
        this.info(`Performance: ${operation} took ${duration}ms`, {
            ...context,
            operation,
            duration,
            event: "performance",
        });
    }
}

export const logger = new Logger();
export default logger;
