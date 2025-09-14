/**
 * @fileoverview Monitoring routes for system health and metrics
 *
 * @author abhisekadhikari
 * @version 1.0.0
 */

import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import monitoringService from "../services/monitoring.service";
import { ApiResponse } from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandler";

const router = Router();

/**
 * @route   GET /monitoring/health
 * @desc    Get system health status
 * @access  Private (requires authentication)
 * @returns {Object} System health information
 */
router.get(
    "/health",
    requireAuth,
    asyncHandler(async (req, res) => {
        const health = await monitoringService.getSystemHealth();

        return res.json(
            ApiResponse.success(
                200,
                "System health retrieved successfully",
                health
            )
        );
    })
);

/**
 * @route   GET /monitoring/metrics
 * @desc    Get authentication metrics
 * @access  Private (requires authentication)
 * @returns {Object} Authentication metrics and statistics
 */
router.get(
    "/metrics",
    requireAuth,
    asyncHandler(async (req, res) => {
        const metrics = await monitoringService.getAuthMetrics();

        return res.json(
            ApiResponse.success(200, "Metrics retrieved successfully", metrics)
        );
    })
);

/**
 * @route   GET /monitoring/daily-stats
 * @desc    Get daily statistics
 * @access  Private (requires authentication)
 * @returns {Object} Daily statistics
 */
router.get(
    "/daily-stats",
    requireAuth,
    asyncHandler(async (req, res) => {
        const stats = await monitoringService.getDailyStats();

        return res.json(
            ApiResponse.success(
                200,
                "Daily stats retrieved successfully",
                stats
            )
        );
    })
);

/**
 * @route   POST /monitoring/cleanup
 * @desc    Clean up old OTP records
 * @access  Private (requires authentication)
 * @returns {Object} Cleanup results
 */
router.post(
    "/cleanup",
    requireAuth,
    asyncHandler(async (req, res) => {
        const cleanedCount = await monitoringService.cleanupOldOTPs();

        return res.json(
            ApiResponse.success(200, "Cleanup completed successfully", {
                cleanedRecords: cleanedCount,
            })
        );
    })
);

export default router;
