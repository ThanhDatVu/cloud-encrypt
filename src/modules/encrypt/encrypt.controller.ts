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
import { is } from '@babel/types';
const { v4 } = pkg;

const symKeyFolder: string = process.env['SYM_KEY_FOLDER'] || 'sym_key';
const asymKeyFolder: string = process.env['ASYM_KEY_FOLDER'] || 'asym_key';
const imagesFolder: string = process.env['IMAGES_FOLDER'] || 'images';
const systemPublicKey: string = `${asymKeyFolder}public.pem`;
const systemPrivateKey: string = `${asymKeyFolder}private.pem`;

export const encryptBlowfish = catchAsync(async (req: Request, res: Response) => {
  const inputFile = req.body.inputFile || 'input.png';
  // const symKeyFolder: string = process.env['SYM_KEY_FOLDER'] || 'sym_key';
  // const asymKeyFolder: string = process.env['ASYM_KEY_FOLDER'] || 'asym_key';

  const pathToEncryptedFile = `${imagesFolder}${inputFile}-encrypted.png`;
  const fileID = v4();
  // generate blowfish key
  // await keyManagementService.generateBlowfishKey(`${symKeyFile}`);
  const { publicFileKeyPath, sharedSecretPath } = await encryptService.ecdhKeyExchange(`${systemPublicKey}`, `${fileID}`);

  // encrypt file with blowfish algorithm
  const { stdoutEncrypt, encryptedFilePath } = await encryptService.encryptBlowfish(
    `${sharedSecretPath}`,
    `${imagesFolder}${inputFile}`,
    pathToEncryptedFile
  );
  // hash the original file
  const md5 = await encryptService.hashMD5(`${imagesFolder}${inputFile}`);

  // sign the hash with system private key
  const { signResult, signaturePath } = await encryptService.signECDSA(md5 ,`${systemPrivateKey}`, fileID);

  const metadata = await metadataService.createMetadata({
    fileName: inputFile,
    fileUuid: fileID,
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

  const metadata = await metadataService.getMetadataById(new mongoose.Types.ObjectId(metadataId.toString()));

  if (!metadata) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Metadata not found');
  }

  const { sharedSecretPath } = await encryptService.ecdhKeyExchange2(`${systemPrivateKey}`, metadata.publicFileKeyPath, metadata.fileUuid);

  const decryptedFilePath = `${imagesFolder}${metadata.fileName}-decrypted.png`

  // decrypt file with blowfish algorithm 
  const decryptResult = await encryptService.decryptBlowfish(
    `${sharedSecretPath}`,
    `${metadata.encryptedFilePath}`,
    `${decryptedFilePath}`
  );
  // hash the decrypted file
  const md5 = await encryptService.hashMD5(decryptedFilePath);
  // verify the signature with system public key
  const verifyECDSA = await encryptService.verifyECDSA(md5, metadata.signaturePath, `${systemPublicKey}`);
  res.send({ 
    dercypt:{
      result: decryptResult,
    }, 
    hash: {
      decryptedFilehash: md5,
      originalHash: metadata.hashValue,
      isHashEqual: md5 == metadata.hashValue,
    }, 
    verifyECDSA, 
    metadata 
  });
});

