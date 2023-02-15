import httpStatus from 'http-status';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import catchAsync from '../utils/catchAsync';
import ApiError from '../errors/ApiError';
import pick from '../utils/pick';
import { IOptions } from '../paginate/paginate';
import * as encryptService from './encrypt.service';

export const createEncrypt = catchAsync(async (req: Request, res: Response) => {
  const encrypt = await encryptService.createEncrypt(req.body);
  res.status(httpStatus.CREATED).send(encrypt);
});

export const getEncrypts = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['name', 'role']);
  const options: IOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
  const result = await encryptService.queryEncrypts(filter, options);
  res.send({
    message: 'getEncrypts-OKKDR',
    result,
  });
});

export const getEncrypt = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['encryptId'] === 'string') {
    const encrypt = await encryptService.getEncryptById(new mongoose.Types.ObjectId(req.params['encryptId']));
    if (!encrypt) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Encrypt not found');
    }
    res.send(encrypt);
  }
});

export const updateEncrypt = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['encryptId'] === 'string') {
    const encrypt = await encryptService.updateEncryptById(new mongoose.Types.ObjectId(req.params['encryptId']), req.body);
    res.send(encrypt);
  }
});

export const deleteEncrypt = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['encryptId'] === 'string') {
    await encryptService.deleteEncryptById(new mongoose.Types.ObjectId(req.params['encryptId']));
    res.status(httpStatus.NO_CONTENT).send();
  }
});

export const encryptBlowfish = catchAsync(async (req: Request, res: Response) => {
  req = req;
  const result = await encryptService.encryptBlowfish("key", "input.png", "output.png" );
  res.send(result);
});

export const decryptBlowfish = catchAsync(async (req: Request, res: Response) => {
  req = req;
  const result = await encryptService.decryptBlowfish("key", "output.png", "output2.png" );
  res.send(result);
});