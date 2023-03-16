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

  const pathToEncryptedFile = `${imagesFolder}${inputFile}-encrypted.png`;
  const fileID = v4();
  // generate blowfish key
  // await keyManagementService.generateBlowfishKey(`${symKeyFile}`);
  const { publicFileKeyPath, sharedSecretPath } = await encryptService.ecdhKeyExchange(`${asymKeyFolder}public.pem`, `${fileID}`);

  // encrypt file with blowfish algorithm
  const { stdoutEncrypt, encryptedFilePath } = await encryptService.encryptBlowfish(
    `${sharedSecretPath}`,
    `${imagesFolder}${inputFile}`,
    pathToEncryptedFile
  );
  // hash the original file
  const md5 = await encryptService.hashMD5(`${imagesFolder}${inputFile}`);

  // sign the hash with system private key
  const { signResult, signaturePath } = await encryptService.signECDSA(md5 ,`${asymKeyFolder}private.pem`, fileID);

  const metadata = await metadataService.createMetadata({
    fileName: inputFile,
    hashValue: md5,
    signaturePath,
    publicFileKeyPath,
    encryptedFilePath,
  });
  res.send({ metadata, signResult, stdoutEncrypt, md5, signaturePath, publicFileKeyPath, encryptedFilePath });
});

export const decryptBlowfish = catchAsync(async (req: Request, res: Response) => {
  const metadataId = req.query['metadataId'];
  if (!metadataId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'metadataId is required');
  }
  const symKeyFolder: string = process.env['SYM_KEY_FOLDER'] || 'sym_key';
  const asymKeyFolder: string = process.env['ASYM_KEY_FOLDER'] || 'asym_key';

  const imagesFolder: string = process.env['IMAGES_FOLDER'] || 'images';

  const metadata = await metadataService.getMetadataById(new mongoose.Types.ObjectId(metadataId.toString()));

  // decrypt file with blowfish algorithm
  // const result = await encryptService.decryptBlowfish(
  //   `${symKeyFolder}${symKeyFile}`,
  //   `${imagesFolder}encrypted.png`,
  //   `${imagesFolder}decrypted.png`
  // );
  // // hash the decrypted file
  // const md5 = await encryptService.hashMD5(`${imagesFolder}decrypted.png`);
  // console.log(md5);
  // // verify the signature with system public key
  // const verifyECDSA = await encryptService.verifyECDSA(md5, `signature.bin`, `${asymKeyFolder}public.pem`);
  // res.send({ result, md5, verifyECDSA });
  res.send({ metadata });
});

