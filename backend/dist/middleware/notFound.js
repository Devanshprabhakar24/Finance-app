const { Request, Response  } = require('express');
const { sendError  } = require('../utils/response');

/**
 * 404 Not Found handler
 */
const notFound = (req, res)=> {
  return sendError(
    res,
    `Route ${req.originalUrl} not found`,
    'NOT_FOUND',
    undefined,
    404
  );
};
