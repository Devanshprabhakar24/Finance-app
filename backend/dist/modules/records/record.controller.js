const { Request, Response  } = require('express');
const { asyncHandler  } = require('../../utils/asyncHandler');
const { sendSuccess  } = require('../../utils/response');
const recordService = require('./record.service');
const { CreateRecordInput, UpdateRecordInput, RecordFilterInput  } = require('./record.schema');
const { ValidationError  } = require('../../middleware/errorHandler');

/**
 * POST /api/records
 */
const createRecord = asyncHandler(async (req, res) => {
  const data= req.body;
  const record = await recordService.createRecord(data, req.user!._id.toString());
  sendSuccess(res, 'Financial record created successfully', record, undefined, 201);
});

/**
 * GET /api/records
 */
const getAllRecords = asyncHandler(async (req, res) => {
  const filters = req.query;
  const result = await recordService.getAllRecords(filters);
  sendSuccess(res, 'Financial records retrieved successfully', result.data, result.meta);
});

/**
 * GET /api/records/:id
 */
const getRecordById = asyncHandler(async (req, res) => {
  const record = await recordService.getRecordById(req.params.id);
  sendSuccess(res, 'Financial record retrieved successfully', record);
});

/**
 * PATCH /api/records/:id
 */
const updateRecord = asyncHandler(async (req, res) => {
  const data= req.body;
  const record = await recordService.updateRecord(
    req.params.id,
    data,
    req.user!._id.toString()
  );
  sendSuccess(res, 'Financial record updated successfully', record);
});

/**
 * DELETE /api/records/:id
 */
const deleteRecord = asyncHandler(async (req, res) => {
  await recordService.deleteRecord(req.params.id, req.user!._id.toString());
  sendSuccess(res, 'Financial record deleted successfully');
});

/**
 * POST /api/records/:id/attachment
 */
const uploadAttachment = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ValidationError('No file uploaded');
  }
  const record = await recordService.uploadAttachment(req.params.id, req.file.buffer);
  sendSuccess(res, 'Attachment uploaded successfully', { attachmentUrl);
});
