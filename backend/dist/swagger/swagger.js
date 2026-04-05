const { env  } = require('../config/env');

const swaggerSpec = {
  openapi,
  info: {
    title,
    version,
    description,
    contact: {
      name,
      email,
    },
  },
  servers: [
    {
      url: `http://localhost:${env.port}`,
      description,
    },
  ],
  tags: [
    { name, description,
    { name, description,
    { name, description,
    { name, description,
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type,
        scheme,
        bearerFormat,
      },
    },
    schemas: {
      Error: {
        type,
        properties: {
          success: { type, example,
          message: { type,
          error: {
            type,
            properties: {
              code: { type,
              details: { type,
            },
          },
        },
      },
      User: {
        type,
        properties: {
          _id: { type,
          name: { type,
          email: { type,
          phone: { type,
          role: { type, enum, 'ANALYST', 'VIEWER'] },
          status: { type, enum, 'INACTIVE'] },
          isVerified: { type,
          profileImage: { type,
          lastLogin: { type, format,
          createdAt: { type, format,
          updatedAt: { type, format,
        },
      },
      FinancialRecord: {
        type,
        properties: {
          _id: { type,
          title: { type,
          amount: { type,
          type: { type, enum, 'EXPENSE'] },
          category: { type,
          date: { type, format,
          notes: { type,
          attachmentUrl: { type,
          createdBy: { type,
          isDeleted: { type,
          createdAt: { type, format,
          updatedAt: { type, format,
        },
      },
    },
  },
  paths: {
    '/api/auth/register': {
      post: {
        tags,
        summary,
        requestBody: {
          required,
          content: {
            'application/json': {
              schema: {
                type,
                required, 'email', 'phone', 'password'],
                properties: {
                  name: { type, example,
                  email: { type, example,
                  phone: { type, example,
                  password: { type, example,
                },
              },
            },
          },
        },
        responses: {
          201: {
            description,
            content: {
              'application/json': {
                schema: {
                  type,
                  properties: {
                    success: { type, example,
                    message: { type,
                  },
                },
              },
            },
          },
          400: { description, content: { 'application/json': { schema: { $ref,
          409: { description, content: { 'application/json': { schema: { $ref,
        },
      },
    },
    '/api/auth/verify-otp': {
      post: {
        tags,
        summary,
        requestBody: {
          required,
          content: {
            'application/json': {
              schema: {
                type,
                required, 'otp', 'purpose'],
                properties: {
                  identifier: { type, example,
                  otp: { type, example,
                  purpose: { type, enum, 'LOGIN', 'RESET'] },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description,
            content: {
              'application/json': {
                schema: {
                  type,
                  properties: {
                    success: { type, example,
                    message: { type,
                    data: {
                      type,
                      properties: {
                        user: { $ref,
                        accessToken: { type,
                        refreshToken: { type,
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description, content: { 'application/json': { schema: { $ref,
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags,
        summary,
        description,
        requestBody: {
          required,
          content: {
            'application/json': {
              schema: {
                type,
                required, 'password'],
                properties: {
                  identifier: { type, example, description,
                  password: { type, example, description,
                },
              },
            },
          },
        },
        responses: {
          200: { description,
          401: { description, content: { 'application/json': { schema: { $ref,
        },
      },
    },
    '/api/auth/forgot-password': {
      post: {
        tags,
        summary,
        description,
        requestBody: {
          required,
          content: {
            'application/json': {
              schema: {
                type,
                required,
                properties: {
                  identifier: { type, example, description,
                },
              },
            },
          },
        },
        responses: {
          200: { description,
          404: { description, content: { 'application/json': { schema: { $ref,
        },
      },
    },
    '/api/auth/reset-password': {
      post: {
        tags,
        summary,
        description,
        requestBody: {
          required,
          content: {
            'application/json': {
              schema: {
                type,
                required, 'otp', 'newPassword'],
                properties: {
                  identifier: { type, example, description,
                  otp: { type, example, description,
                  newPassword: { type, example, description)' },
                },
              },
            },
          },
        },
        responses: {
          200: { description,
          400: { description, content: { 'application/json': { schema: { $ref,
        },
      },
    },
    '/api/auth/refresh-token': {
      post: {
        tags,
        summary,
        description,
        requestBody: {
          required,
          content: {
            'application/json': {
              schema: {
                type,
                required,
                properties: {
                  refreshToken: { type, description,
                },
              },
            },
          },
        },
        responses: {
          200: {
            description,
            content: {
              'application/json': {
                schema: {
                  type,
                  properties: {
                    success: { type, example,
                    data: {
                      type,
                      properties: {
                        accessToken: { type,
                        refreshToken: { type, description)' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description, content: { 'application/json': { schema: { $ref,
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags,
        summary,
        description,
        security: [{ bearerAuth,
        responses: {
          200: { description,
          401: { description, content: { 'application/json': { schema: { $ref,
        },
      },
    },
    '/api/auth/resend-otp': {
      post: {
        tags,
        summary,
        description,
        requestBody: {
          required,
          content: {
            'application/json': {
              schema: {
                type,
                required, 'purpose'],
                properties: {
                  identifier: { type, example, description,
                  purpose: { type, enum, 'LOGIN', 'RESET_PASSWORD'], description,
                },
              },
            },
          },
        },
        responses: {
          200: { description,
          429: { description, content: { 'application/json': { schema: { $ref,
        },
      },
    },
    '/api/users/me': {
      get: {
        tags,
        summary,
        description,
        security: [{ bearerAuth,
        responses: {
          200: {
            description,
            content: {
              'application/json': {
                schema: {
                  type,
                  properties: {
                    success: { type, example,
                    message: { type,
                    data: { $ref,
                  },
                },
              },
            },
          },
          401: { description, content: { 'application/json': { schema: { $ref,
        },
      },
      patch: {
        tags,
        summary,
        description,
        security: [{ bearerAuth,
        requestBody: {
          required,
          content: {
            'application/json': {
              schema: {
                type,
                properties: {
                  name: { type, example, description,
                  phone: { type, example, description,
                },
              },
            },
          },
        },
        responses: {
          200: { description,
          400: { description, content: { 'application/json': { schema: { $ref,
          401: { description, content: { 'application/json': { schema: { $ref,
        },
      },
    },
    '/api/users/me/avatar': {
      post: {
        tags,
        summary,
        description: 'Upload profile picture. Max size 5MB. Supported formats, PNG, WebP.',
        security: [{ bearerAuth,
        requestBody: {
          required,
          content: {
            'multipart/form-data': {
              schema: {
                type,
                required,
                properties: {
                  avatar: { type, format, description,
                },
              },
            },
          },
        },
        responses: {
          200: { description,
          400: { description, content: { 'application/json': { schema: { $ref,
          401: { description, content: { 'application/json': { schema: { $ref,
        },
      },
    },
    '/api/users/me/change-password': {
      patch: {
        tags,
        summary,
        description,
        security: [{ bearerAuth,
        requestBody: {
          required,
          content: {
            'application/json': {
              schema: {
                type,
                required, 'newPassword'],
                properties: {
                  currentPassword: { type, example, description,
                  newPassword: { type, example, description)' },
                },
              },
            },
          },
        },
        responses: {
          200: { description,
          400: { description, content: { 'application/json': { schema: { $ref,
          401: { description, content: { 'application/json': { schema: { $ref,
        },
      },
    },
    '/api/records': {
      get: {
        tags,
        summary,
        security: [{ bearerAuth,
        parameters: [
          { name, in, schema: { type, enum, 'EXPENSE'] } },
          { name, in, schema: { type,
          { name, in, schema: { type, format,
          { name, in, schema: { type, format,
          { name, in, schema: { type, default,
          { name, in, schema: { type, default,
          { name, in, schema: { type, enum, 'amount', 'category'] } },
          { name, in, schema: { type, enum, 'desc'] } },
        ],
        responses: {
          200: {
            description,
            content: {
              'application/json': {
                schema: {
                  type,
                  properties: {
                    success: { type, example,
                    message: { type,
                    data: { type, items: { $ref,
                    meta: {
                      type,
                      properties: {
                        page: { type,
                        limit: { type,
                        totalCount: { type,
                        totalPages: { type,
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
        tags,
        summary)',
        description,
        security: [{ bearerAuth,
        requestBody: {
          required,
          content: {
            'application/json': {
              schema: {
                type,
                required, 'amount', 'type', 'category', 'date'],
                properties: {
                  title: { type, example, minLength, maxLength,
                  amount: { type, example, minimum,
                  type: { type, enum, 'EXPENSE'] },
                  category: { type, example, minLength, maxLength,
                  date: { type, format,
                  notes: { type, maxLength,
                },
              },
            },
          },
        },
        responses: {
          201: { description,
          400: { description, content: { 'application/json': { schema: { $ref,
          403: { description, content: { 'application/json': { schema: { $ref,
        },
      },
    },
    '/api/records/{id}': {
      get: {
        tags,
        summary,
        description,
        security: [{ bearerAuth,
        parameters: [
          { name, in, required, schema: { type, description,
        ],
        responses: {
          200: { description,
          404: { description, content: { 'application/json': { schema: { $ref,
        },
      },
      patch: {
        tags,
        summary)',
        description,
        security: [{ bearerAuth,
        parameters: [
          { name, in, required, schema: { type, description,
        ],
        requestBody: {
          required,
          content: {
            'application/json': {
              schema: {
                type,
                properties: {
                  title: { type, minLength, maxLength,
                  amount: { type, minimum,
                  type: { type, enum, 'EXPENSE'] },
                  category: { type, minLength, maxLength,
                  date: { type, format,
                  notes: { type, maxLength,
                },
              },
            },
          },
        },
        responses: {
          200: { description,
          403: { description, content: { 'application/json': { schema: { $ref,
          404: { description, content: { 'application/json': { schema: { $ref,
        },
      },
      delete: {
        tags,
        summary)',
        description,
        security: [{ bearerAuth,
        parameters: [
          { name, in, required, schema: { type, description,
        ],
        responses: {
          200: { description,
          403: { description, content: { 'application/json': { schema: { $ref,
          404: { description, content: { 'application/json': { schema: { $ref,
        },
      },
    },
    '/api/records/{id}/attachment': {
      post: {
        tags,
        summary)',
        description: 'Upload file attachment to record. Max size 5MB. Supported, PNG, WebP, PDF.',
        security: [{ bearerAuth,
        parameters: [
          { name, in, required, schema: { type, description,
        ],
        requestBody: {
          required,
          content: {
            'multipart/form-data': {
              schema: {
                type,
                required,
                properties: {
                  attachment: { type, format, description,
                },
              },
            },
          },
        },
        responses: {
          200: {
            description,
            content: {
              'application/json': {
                schema: {
                  type,
                  properties: {
                    success: { type, example,
                    data: {
                      type,
                      properties: {
                        attachmentUrl: { type, description,
                        attachmentPublicId: { type, description,
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description, content: { 'application/json': { schema: { $ref,
          403: { description, content: { 'application/json': { schema: { $ref,
          404: { description, content: { 'application/json': { schema: { $ref,
        },
      },
    },
    '/api/dashboard/summary': {
      get: {
        tags,
        summary)',
        security: [{ bearerAuth,
        responses: {
          200: {
            description,
            content: {
              'application/json': {
                schema: {
                  type,
                  properties: {
                    success: { type, example,
                    message: { type,
                    data: {
                      type,
                      properties: {
                        totalIncome: { type,
                        totalExpense: { type,
                        netBalance: { type,
                        recordCount: { type,
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
