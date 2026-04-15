class ApiResponse {
  statusCode: number;
  data: unknown;
  message: string;
  success: boolean;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };

  constructor(
    statusCode: number,
    data: unknown,
    message = 'Success',
    meta?: { page?: number; limit?: number; total?: number; totalPages?: number }
  ) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
    this.meta = meta;
  }

  send(res: {
    status: (code: number) => {
      json: (data: {
        success: boolean;
        message: string;
        data: unknown;
        meta?: {
          page?: number;
          limit?: number;
          total?: number;
          totalPages?: number;
        };
      }) => unknown;
    };
  }) {
    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      data: this.data,
      ...(this.meta && { meta: this.meta }),
    });
  }
}

export default ApiResponse;
