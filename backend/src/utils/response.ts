import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    totalCount?: number;
    totalPages?: number;
  };
}

/**
 * Send success response
 */
export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  meta?: ApiResponse['meta'],
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data: data || undefined,
    meta: meta || undefined,
  };
  return res.status(statusCode).json(response);
};

/**
 * Send error response
 */
export const sendError = (
  res: Response,
  message: string,
  code: string,
  details?: any,
  statusCode: number = 500
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    error: {
      code,
      details: details || undefined,
    },
  };
  return res.status(statusCode).json(response);
};
