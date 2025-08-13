/**
 * @fileoverview Standardized API response class for consistent response formatting.
 * Provides static methods for creating success and error responses with consistent structure.
 *
 * @author abhisekadhikari
 * @version 1.0.0
 */

/**
 * Standardized API response class
 * Provides a consistent structure for all API responses in the application
 *
 * @class ApiResponse
 * @example
 * // Success response
 * return ApiResponse.success(200, "Data fetched successfully", data);
 *
 * // Error response
 * return ApiResponse.error(404, "Resource not found", null);
 */
export class ApiResponse {
    /**
     * HTTP status code
     * @type {number}
     * @private
     */
    private statusCode: number;

    /**
     * Response message
     * @type {string}
     * @private
     */
    private message: string;

    /**
     * Error data (used for error responses)
     * @type {any}
     * @private
     */
    private error: any;

    /**
     * Response data (used for success responses)
     * @type {any}
     * @private
     */
    private data: any;

    /**
     * Creates an instance of ApiResponse
     * @param {number} statusCode - HTTP status code
     * @param {string | null} message - Response message
     * @param {any} error - Error data or response data
     */
    constructor(statusCode: number, message: string | null, error: any) {
        this.statusCode = statusCode;
        this.message = message;
        this.error = error;
    }

    /**
     * Creates a success response
     * @param {number} statusCode - HTTP status code (200, 201, etc.)
     * @param {string | null} message - Success message
     * @param {any} data - Response data
     * @returns {ApiResponse} New ApiResponse instance for success
     *
     * @example
     * ApiResponse.success(200, "User created successfully", { id: 1, name: "John" });
     */
    static success(statusCode: number, message: string | null, data: any) {
        return new ApiResponse(statusCode, message, data);
    }

    /**
     * Creates an error response
     * @param {number} statusCode - HTTP error status code (400, 404, 500, etc.)
     * @param {string | null} message - Error message
     * @param {any} error - Error details or error object
     * @returns {ApiResponse} New ApiResponse instance for error
     *
     * @example
     * ApiResponse.error(404, "User not found", { userId: 123 });
     */
    static error(statusCode: number, message: string | null, error: any) {
        return new ApiResponse(statusCode, message, error);
    }
}
