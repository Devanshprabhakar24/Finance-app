const { Response  } = require('express');

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  error: {
    code: string;
    details: any;
  };
  meta: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

/**
 * Send success response
 */
const sendSuccess = <T>(
  res,
  message,
  data: T,
  meta: ApiResponse['meta'],
  statusCode: number = 200
)=> {
  const response= {
    success,
    message,
    data,
    meta,
  };
  return res.status(statusCode).json(response);
};

/**
 * Send error response
 */
const sendError = (
  res,
  message,
  code,
  details: any,
  statusCode: number = 500
)=> {
  const response= {
    success,
    message,
    error: {
      code,
      details,
    },
  };
  return res.status(statusCode).json(response);
};
