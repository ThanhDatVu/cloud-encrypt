import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import ApiError from '../errors/ApiError';

export const createAttachment = catchAsync(async (req: Request, res: Response) => {
  res.status(httpStatus.CREATED).send(req.files);
});

