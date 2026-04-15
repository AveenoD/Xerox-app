class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  stack?: string;

  constructor(
    statusCode: number,
    message: string,
    isOperational = true,
    stack = ''
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(message: string): ApiError {
    return new ApiError(400, message);
  }

  static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message = 'Not Found'): ApiError {
    return new ApiError(404, message);
  }

  static conflict(message: string): ApiError {
    return new ApiError(409, message);
  }

  static tooManyRequests(message = 'Too Many Requests'): ApiError {
    return new ApiError(429, message);
  }

  static internal(message = 'Internal Server Error'): ApiError {
    return new ApiError(500, message, false);
  }

  static serviceUnavailable(message = 'Service Unavailable'): ApiError {
    return new ApiError(503, message);
  }
}

export default ApiError;
