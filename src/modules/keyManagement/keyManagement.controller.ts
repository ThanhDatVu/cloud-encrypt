import httpStatus from 'http-status';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import catchAsync from '../utils/catchAsync';
import ApiError from '../errors/ApiError';
import pick from '../utils/pick';
import { IOptions } from '../paginate/paginate';
import * as keyManagementService from './keyManagement.service';

export const generateBlowfishKey = catchAsync(async (req: Request, res: Response) => {
  const { keySize } = req.body;
  const result = await keyManagementService.generateBlowfishKey(keySize);
  res.send(result);
});

export const generateECDSAKey = catchAsync(async (req: Request, res: Response) => {
  req = req;
  const result = await keyManagementService.generateECDSAKeyPair();
  res.send(result);
});

export const generateRSAKey = catchAsync(async (req: Request, res: Response) => {
  const { keySize } = req.body;
  const result = await keyManagementService.generateRSAKeyPair(keySize);
  res.send(result);
});

