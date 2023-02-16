import httpStatus from 'http-status';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import catchAsync from '../utils/catchAsync';
import ApiError from '../errors/ApiError';
import pick from '../utils/pick';
import { IOptions } from '../paginate/paginate';
import * as keyManagementService from './keyManagement.service';

export const createKeyManagement = catchAsync(async (req: Request, res: Response) => {
  const keyManagement = await keyManagementService.createKeyManagement(req.body);
  res.status(httpStatus.CREATED).send(keyManagement);
});

export const getKeyManagements = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['name', 'role']);
  const options: IOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
  const result = await keyManagementService.queryKeyManagements(filter, options);
  res.send({
    message: 'getKeyManagements-OKKDR',
    result,
  });
});

export const getKeyManagement = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['keyManagementId'] === 'string') {
    const keyManagement = await keyManagementService.getKeyManagementById(new mongoose.Types.ObjectId(req.params['keyManagementId']));
    if (!keyManagement) {
      throw new ApiError(httpStatus.NOT_FOUND, 'KeyManagement not found');
    }
    res.send(keyManagement);
  }
});

export const updateKeyManagement = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['keyManagementId'] === 'string') {
    const keyManagement = await keyManagementService.updateKeyManagementById(new mongoose.Types.ObjectId(req.params['keyManagementId']), req.body);
    res.send(keyManagement);
  }
});

export const deleteKeyManagement = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['keyManagementId'] === 'string') {
    await keyManagementService.deleteKeyManagementById(new mongoose.Types.ObjectId(req.params['keyManagementId']));
    res.status(httpStatus.NO_CONTENT).send();
  }
});

export const generateBlowfishKey = catchAsync(async (req: Request, res: Response) => {
  req = req;
  const result = await keyManagementService.generateBlowfishKey();
  res.send(result);
});

export const generateECDSAKey = catchAsync(async (req: Request, res: Response) => {
  req = req;
  const result = await keyManagementService.generateECDSAKeyPair();
  res.send(result);
});

