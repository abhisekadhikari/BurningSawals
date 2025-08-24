export class ApiResponse {
    statusCode: number;
    message: string | null;
    data?: any;
    error?: any;

    private constructor(
        statusCode: number,
        message: string | null,
        data?: any,
        error?: any
    ) {
        this.statusCode = statusCode;
        this.message = message;
        if (data !== undefined) this.data = data;
        if (error !== undefined) this.error = error;
    }

    static success(statusCode: number, message: string | null, data: any) {
        return new ApiResponse(statusCode, message, data, undefined);
    }

    static error(statusCode: number, message: string | null, error: any) {
        return new ApiResponse(statusCode, message, undefined, error);
    }
}
