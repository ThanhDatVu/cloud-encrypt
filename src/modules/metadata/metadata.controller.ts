import httpStatus from 'http-status';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import catchAsync from '../utils/catchAsync';
import ApiError from '../errors/ApiError';
import pick from '../utils/pick';
import { IOptions } from '../paginate/paginate';
import * as metadataService from './metadata.service';

export const createMetadata = catchAsync(async (req: Request, res: Response) => {
  const metadata = await metadataService.createMetadata(req.body);
  res.status(httpStatus.CREATED).send(metadata);
});

export const getMetadatas = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['name', 'role']);
  const options: IOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
  const result = await metadataService.queryMetadatas(filter, options);
  res.send({
    message: 'getMetadatas-OKKDR',
    result,
  });
});

export const getMetadata = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['metadataId'] === 'string') {
    const metadata = await metadataService.getMetadataById(new mongoose.Types.ObjectId(req.params['metadataId']));
    if (!metadata) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Metadata not found');
    }
    res.send(metadata);
  }
});

export const updateMetadata = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['metadataId'] === 'string') {
    const metadata = await metadataService.updateMetadataById(new mongoose.Types.ObjectId(req.params['metadataId']), req.body);
    res.send(metadata);
  }
});

export const deleteMetadata = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['metadataId'] === 'string') {
    await metadataService.deleteMetadataById(new mongoose.Types.ObjectId(req.params['metadataId']));
    res.status(httpStatus.NO_CONTENT).send();
  }
});

export const metadataBlowfish = catchAsync(async (req: Request, res: Response) => {
  const symKeyFolder: string = process.env['SYM_KEY_FOLDER'] || 'sym_key';
  const imagesFolder: string = process.env['IMAGES_FOLDER'] || 'images';
  const symKeyFile = 'blowfish.key';

  const result = await metadataService.metadataBlowfish(
    `${symKeyFolder}${symKeyFile}`,
    `${imagesFolder}input.png`,
    `${imagesFolder}metadataed.png`
  );
  res.send(result);
});

export const decryptBlowfish = catchAsync(async (req: Request, res: Response) => {
  const symKeyFolder: string = process.env['SYM_KEY_FOLDER'] || 'sym_key';
  const imagesFolder: string = process.env['IMAGES_FOLDER'] || 'images';
  const symKeyFile = 'blowfish.key';

  const result = await metadataService.decryptBlowfish(
    `${symKeyFolder}${symKeyFile}`,
    `${imagesFolder}metadataed.png`,
    `${imagesFolder}decrypted.png`
  );
  res.send(result);
});
