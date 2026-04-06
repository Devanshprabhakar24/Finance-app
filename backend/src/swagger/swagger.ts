import { env } from '../config/env';

export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Finance Dashboard API',
    version: '1.0.0',
    description: 'Production-grade Finance Dashboard Backend API with OTP-based authentication',
    contact: {
      name: 'API Support',
      email: 'support@finance-dashboard.dev',
    },
  },
  servers: [
    {
      url: `http://localhost:${env.port}`,
      description: 'Development server',
    },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication endpoints' },
    { name: 'Users', description: 'User management endpoints' },
    { name: 'Records', description: 'Financial records endpoints' },
    { name: 'Dashboard', description: 'Dashboard analytics endpoints' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              details: { type: 'object' },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          role: { type: 'string', enum: ['ADMIN', 'ANALYST', 'USER'] },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
          isVerified: { type: 'boolean' },
          profileImage: { type: 'string' },
          lastLogin: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      FinancialRecord: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          title: { type: 'string' },
          amount: { type: 'number' },
          type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
          category: { type: 'string' },
          date: { type: 'string', format: 'date-time' },
          notes: { type: 'string' },
          attachmentUrl: { type: 'string' },
          createdBy: { type: 'string' },
          isDeleted: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'phone', 'password'],
                properties: {
                  name: { type: 'string', example: 'John Doe' },
                  email: { type: 'string', example: 'john@example.com' },
                  phone: { type: 'string', example: '+911234567890' },
                  password: { type: 'string', example: 'Password@123' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Registration successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          409: { description: 'Email or phone already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/auth/verify-otp': {
      post: {
        tags: ['Auth'],
        summary: 'Verify OTP',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['identifier', 'otp', 'purpose'],
                properties: {
                  identifier: { type: 'string', example: 'john@example.com' },
                  otp: { type: 'string', example: '123456' },
                  purpose: { type: 'string', enum: ['REGISTER', 'LOGIN', 'RESET'] },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'OTP verified successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                        accessToken: { type: 'string' },
                        refreshToken: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Invalid OTP', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login user',
        description: 'Authenticate user with email/phone and password. Sends OTP to email and phone for verification.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['identifier', 'password'],
                properties: {
                  identifier: { type: 'string', example: 'john@example.com', description: 'Email or phone number' },
                  password: { type: 'string', example: 'Password@123', description: 'User password' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'OTP sent successfully' },
          401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Forgot password',
        description: 'Request password reset OTP. Sends OTP to user email and phone.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['identifier'],
                properties: {
                  identifier: { type: 'string', example: 'john@example.com', description: 'Email or phone number' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password reset OTP sent successfully' },
          404: { description: 'User not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password',
        description: 'Reset password using OTP verification.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['identifier', 'otp', 'newPassword'],
                properties: {
                  identifier: { type: 'string', example: 'john@example.com', description: 'Email or phone number' },
                  otp: { type: 'string', example: '123456', description: '6-digit OTP code' },
                  newPassword: { type: 'string', example: 'NewPassword@123', description: 'New password (min 8 characters)' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password reset successfully' },
          400: { description: 'Invalid OTP or validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/auth/refresh-token': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        description: 'Exchange refresh token for new access token. Implements token rotation.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string', description: 'Valid refresh token' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Token refreshed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        accessToken: { type: 'string' },
                        refreshToken: { type: 'string', description: 'New refresh token (rotation)' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Invalid or expired refresh token', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout user',
        description: 'Invalidate refresh token and clear session.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Logged out successfully' },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/auth/resend-otp': {
      post: {
        tags: ['Auth'],
        summary: 'Resend OTP',
        description: 'Resend OTP code to email and phone. Rate limited to 5 requests per 15 minutes.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['identifier', 'purpose'],
                properties: {
                  identifier: { type: 'string', example: 'john@example.com', description: 'Email or phone number' },
                  purpose: { type: 'string', enum: ['REGISTER', 'LOGIN', 'RESET_PASSWORD'], description: 'OTP purpose' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'OTP resent successfully' },
          429: { description: 'Too many requests', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Get own profile',
        description: 'Retrieve authenticated user profile information.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Profile retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string' },
                    data: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update own profile',
        description: 'Update authenticated user name and phone number.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'John Doe', description: 'Full name' },
                  phone: { type: 'string', example: '+911234567890', description: 'Phone number in E.164 format' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Profile updated successfully' },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/users/me/avatar': {
      post: {
        tags: ['Users'],
        summary: 'Upload avatar',
        description: 'Upload profile picture. Max size 5MB. Supported formats: JPEG, PNG, WebP.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['avatar'],
                properties: {
                  avatar: { type: 'string', format: 'binary', description: 'Image file' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Avatar uploaded successfully' },
          400: { description: 'Invalid file type or size', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/users/me/change-password': {
      patch: {
        tags: ['Users'],
        summary: 'Change password',
        description: 'Change authenticated user password. Requires current password verification.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string', example: 'OldPassword@123', description: 'Current password' },
                  newPassword: { type: 'string', example: 'NewPassword@123', description: 'New password (min 8 characters)' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password changed successfully' },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Invalid current password', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/records': {
      get: {
        tags: ['Records'],
        summary: 'Get all financial records',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['INCOME', 'EXPENSE'] } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['date', 'amount', 'category'] } },
          { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
        ],
        responses: {
          200: {
            description: 'Records retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/FinancialRecord' } },
                    meta: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        totalCount: { type: 'integer' },
                        totalPages: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Records'],
        summary: 'Create financial record (ADMIN only)',
        description: 'Create new financial record. Only ADMIN users can create records.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'amount', 'type', 'category', 'date'],
                properties: {
                  title: { type: 'string', example: 'Monthly Salary', minLength: 2, maxLength: 100 },
                  amount: { type: 'number', example: 5000, minimum: 0.01 },
                  type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
                  category: { type: 'string', example: 'Salary', minLength: 2, maxLength: 50 },
                  date: { type: 'string', format: 'date-time' },
                  notes: { type: 'string', maxLength: 500 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Record created successfully' },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden - ADMIN role required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/records/{id}': {
      get: {
        tags: ['Records'],
        summary: 'Get record by ID',
        description: 'Retrieve single financial record by ID. ANALYST and ADMIN roles.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Record ID' },
        ],
        responses: {
          200: { description: 'Record retrieved successfully' },
          404: { description: 'Record not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      patch: {
        tags: ['Records'],
        summary: 'Update record (ADMIN only)',
        description: 'Update existing financial record. Updates lastModifiedBy field.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Record ID' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string', minLength: 2, maxLength: 100 },
                  amount: { type: 'number', minimum: 0.01 },
                  type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
                  category: { type: 'string', minLength: 2, maxLength: 50 },
                  date: { type: 'string', format: 'date-time' },
                  notes: { type: 'string', maxLength: 500 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Record updated successfully' },
          403: { description: 'Forbidden - ADMIN role required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Record not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        tags: ['Records'],
        summary: 'Delete record (ADMIN only)',
        description: 'Soft delete financial record. Sets isDeleted flag and updates lastModifiedBy.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Record ID' },
        ],
        responses: {
          200: { description: 'Record deleted successfully' },
          403: { description: 'Forbidden - ADMIN role required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Record not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/records/{id}/attachment': {
      post: {
        tags: ['Records'],
        summary: 'Upload attachment (ADMIN only)',
        description: 'Upload file attachment to record. Max size 5MB. Supported: JPEG, PNG, WebP, PDF.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Record ID' },
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['attachment'],
                properties: {
                  attachment: { type: 'string', format: 'binary', description: 'File to upload' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Attachment uploaded successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        attachmentUrl: { type: 'string', description: 'Cloudinary URL' },
                        attachmentPublicId: { type: 'string', description: 'Cloudinary public ID' },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Invalid file type or size', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Forbidden - ADMIN role required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Record not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/dashboard/summary': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get dashboard summary (ANALYST/ADMIN only)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Summary retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string' },
                    data: {
                      type: 'object',
                      properties: {
                        totalIncome: { type: 'number' },
                        totalExpense: { type: 'number' },
                        netBalance: { type: 'number' },
                        recordCount: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
