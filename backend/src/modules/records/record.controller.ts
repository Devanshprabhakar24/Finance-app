import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import * as recordService from './record.service';
import { CreateRecordInput, UpdateRecordInput, RecordFilterInput } from './record.schema';
import { ValidationError } from '../../middleware/errorHandler';

/**
 * POST /api/records
 */
export const createRecord = asyncHandler(async (req: Request, res: Response) => {
  const data: CreateRecordInput = req.body;
  const record = await recordService.createRecord(data, req.user!._id.toString());
  sendSuccess(res, 'Financial record created successfully', record, undefined, 201);
});

/**
 * GET /api/records
 */
export const getAllRecords = asyncHandler(async (req: Request, res: Response) => {
  const filters = req.query as unknown as RecordFilterInput;
  const result = await recordService.getAllRecords(filters);
  sendSuccess(res, 'Financial records retrieved successfully', result.data, result.meta);
});

/**
 * GET /api/records/:id
 */
export const getRecordById = asyncHandler(async (req: Request, res: Response) => {
  const record = await recordService.getRecordById(req.params.id);
  sendSuccess(res, 'Financial record retrieved successfully', record);
});

/**
 * PATCH /api/records/:id
 */
export const updateRecord = asyncHandler(async (req: Request, res: Response) => {
  const data: UpdateRecordInput = req.body;
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
export const deleteRecord = asyncHandler(async (req: Request, res: Response) => {
  await recordService.deleteRecord(req.params.id, req.user!._id.toString());
  sendSuccess(res, 'Financial record deleted successfully');
});

/**
 * POST /api/records/:id/attachment
 */
export const uploadAttachment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ValidationError('No file uploaded');
  }
  // Use 'raw' for PDFs so Cloudinary serves them correctly, 'image' for images
  const resourceType = req.file.mimetype === 'application/pdf' ? 'raw' : 'image';
  const record = await recordService.uploadAttachment(req.params.id, req.file.buffer, resourceType);
  sendSuccess(res, 'Attachment uploaded successfully', {
    attachmentUrl: record.attachmentUrl,
    attachmentPublicId: record.attachmentPublicId,
  });
});
