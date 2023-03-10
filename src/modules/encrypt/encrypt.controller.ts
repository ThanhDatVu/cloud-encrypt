import httpStatus from 'http-status';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import catchAsync from '../utils/catchAsync';
import ApiError from '../errors/ApiError';
import pick from '../utils/pick';
import { IOptions } from '../paginate/paginate';
import * as encryptService from './encrypt.service';
import * as metadataService from '../metadata/metadata.service';
// import uuid v4
import pkg from 'uuid';
const { v4 } = pkg;
import { keyManagementService } from '../keyManagement';
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
  const inputFile = req.body.inputFile || 'input.png';
  const symKeyFolder: string = process.env['SYM_KEY_FOLDER'] || 'sym_key';
  const asymKeyFolder: string = process.env['ASYM_KEY_FOLDER'] || 'asym_key';
  const imagesFolder: string = process.env['IMAGES_FOLDER'] || 'images';
  const symKeyFile = 'l' || v4();
  await keyManagementService.generateBlowfishKey(`${symKeyFile}`);

  const result = await encryptService.encryptBlowfish(
    `${symKeyFolder}${symKeyFile}`,
    `${imagesFolder}${inputFile}`,
    `${imagesFolder}encrypted.png`
  );
  console.log(`${symKeyFolder}${symKeyFile}`,`${symKeyFolder}${symKeyFile}-encrypted`, `${asymKeyFolder}public.pem`);
  await encryptService.encryptECDSA(`${symKeyFolder}${symKeyFile}`,`${symKeyFolder}${symKeyFile}-encrypted`, `${asymKeyFolder}public.pem`);
  const md5 = await encryptService.hashMD5(`${imagesFolder}${inputFile}`);
  const md5Signature = await encryptService.signECDSA(md5 ,`${asymKeyFolder}private.pem`);

  // const metadata = await metadataService.insertMetadata(`${imagesFolder}encrypted.png`, md5, md5Signature);
  res.send({ result, md5, md5Signature });
});

export const decryptBlowfish = catchAsync(async (req: Request, res: Response) => {
  const symKeyFolder: string = process.env['SYM_KEY_FOLDER'] || 'sym_key';
  const asymKeyFolder: string = process.env['ASYM_KEY_FOLDER'] || 'asym_key';

  const imagesFolder: string = process.env['IMAGES_FOLDER'] || 'images';
  const symKeyFile = 'blowfish.key';

  const result = await encryptService.decryptBlowfish(
    `${symKeyFolder}${symKeyFile}`,
    `${imagesFolder}encrypted.png`,
    `${imagesFolder}decrypted.png`
  );
  const md5 = await encryptService.hashMD5(`${imagesFolder}decrypted.png`);
  console.log(md5);
  const verifyECDSA = await encryptService.verifyECDSA(md5, `signature.bin`, `${asymKeyFolder}public.pem`);
  res.send({ result, md5, verifyECDSA });
});

