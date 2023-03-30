import { decryptBlowfish } from './../metadata/metadata.service';
import { exec } from 'child_process';
import { unixTimer } from './../utils/unixTimer';
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
const systemPublicKey: string = `${asymKeyFolder}public-rsa.pem`;
const systemPrivateKey: string = `${asymKeyFolder}private-rsa.pem`;

// export const encrypt = catchAsync(async (req: Request, res: Response) => {
//   const inputFile = req.body.inputFile || 'input.png';
//   // const symKeyFolder: string = process.env['SYM_KEY_FOLDER'] || 'sym_key';
//   // const asymKeyFolder: string = process.env['ASYM_KEY_FOLDER'] || 'asym_key';

//   // format d473b1c9-16f9-49b8-b98b-812b9983a0dd-kekw.png to d473b1c9-16f9-49b8-b98b-812b9983a0dd-kekw-encrypted.png
//   const [fileName, fileExtension] = inputFile.split('.');
//   const pathToEncryptedFile = `${imagesFolder}${fileName}-encrypted.${fileExtension}`;
//   const fileID = v4();
//   // generate blowfish key
//   // await keyManagementService.generateBlowfishKey(`${symKeyFile}`);
//   const { publicFileKeyPath, sharedSecretPath, privateFileKeyPath, ecdhKeyExchangeResult } =
//     await encryptService.ecdhKeyExchange(`${systemPublicKey}`, `${fileID}`);

//   // encrypt file with blowfish algorithm
//   const { stdoutEncrypt, encryptedFilePath, encryptResult } = await encryptService.encryptBlowfish(
//     `${sharedSecretPath}`,
//     `${imagesFolder}${inputFile}`,
//     pathToEncryptedFile
//   );
//   // hash the original file
//   const md5 = await encryptService.hashMD5(`${imagesFolder}${inputFile}`);

//   // sign the hash with system private key
//   const { signResult, signaturePath } = await encryptService.signECDSA(md5, `${systemPrivateKey}`, fileID);

//   const metadata = await metadataService.createMetadata({
//     fileName: inputFile,
//     fileUuid: fileID,
//     hashValue: md5,
//     signaturePath,
//     publicFileKeyPath,
//     encryptedFilePath,
//   });

//   const fileContents = await encryptService.getFilesContent({
//     systemPrivateKeyContent: `${systemPrivateKey}`,
//     systemPublicKeyContent: `${systemPublicKey}`,
//     filePublicKeyContent: `${publicFileKeyPath}`,
//     filePrivateKeyContent: `${privateFileKeyPath}`,
//   });

//   const fileContentsHex = await encryptService.getFilesContentHex({
//     signatureContent: `${signaturePath}`,
//     sharedSecretContent: `${sharedSecretPath}`
//   });

//   res.send({
//     metadata,
//     encrypt: {
//       encryptResult,
//       stdoutEncrypt,
//     },
//     hash: {
//       originalHash: md5,
//     },
//     signECDSA: {
//       signResult,
//       signaturePath,
//     },
//     ecdhKeyExchange: {
//       ecdhKeyExchangeResult,
//       publicFileKeyPath,
//       encryptedFilePath,
//     },
//     fileContents: {
//       ...fileContents,
//       ...fileContentsHex
//     },
//   });
// });

// export const decrypt = catchAsync(async (req: Request, res: Response) => {
//   const metadataId = req.query['metadataId'];
//   if (!metadataId) {
//     throw new ApiError(httpStatus.BAD_REQUEST, 'metadataId is required');
//   }

//   const metadata = await metadataService.getMetadataById(new mongoose.Types.ObjectId(metadataId.toString()));

//   if (!metadata) {
//     throw new ApiError(httpStatus.NOT_FOUND, 'Metadata not found');
//   }

//   const { sharedSecretPath } = await encryptService.ecdhKeyExchange2(
//     `${systemPrivateKey}`,
//     metadata.publicFileKeyPath,
//     metadata.fileUuid
//   );

//   const [fileName, fileExtension] = metadata.fileName.split('.');
//   const decryptedFilePath = `${imagesFolder}${fileName}-decrypted.${fileExtension}`;

//   // decrypt file with blowfish algorithm
//   const decryptResult = await encryptService.decryptBlowfish(
//     `${sharedSecretPath}`,
//     `${metadata.encryptedFilePath}`,
//     `${decryptedFilePath}`
//   );
//   // hash the decrypted file
//   const md5 = await encryptService.hashMD5(decryptedFilePath);
//   // verify the signature with system public key
//   const verifyECDSA = await encryptService.verifyECDSA(md5, metadata.signaturePath, `${systemPublicKey}`);

//   const fileContents = await encryptService.getFilesContent({
//     publicFileKeyContent: `${metadata.publicFileKeyPath}`,
//     systemPrivateKeyContent: `${systemPrivateKey}`,
//     systemPublicKeyContent: `${systemPublicKey}`,
//   });

//   const fileContentsHex = await encryptService.getFilesContentHex({
//     signatureContent: `${metadata.signaturePath}`,
//     sharedSecretContent: `${sharedSecretPath}`
//   });
//   res.send({
//     decrypt: {
//       result: decryptResult,
//       decryptedFilePath,
//     },
//     hash: {
//       decryptedFilehash: md5,
//       originalHash: metadata.hashValue,
//       isHashEqual: md5 == metadata.hashValue,
//     },
//     verifyECDSA,
//     metadata,
//     fileContents: {
//       ...fileContents,
//       ...fileContentsHex
//     },
//   });
// });

// just like the encrypt function, but using rsa instead of ecdh, and using rsa to sign the hash
export const encryptRSA = catchAsync(async (req: Request, res: Response) => {
  const inputFile = req.body.inputFile || 'input.png';

  // format d473b1c9-16f9-49b8-b98b-812b9983a0dd-kekw.png to d473b1c9-16f9-49b8-b98b-812b9983a0dd-kekw-encrypted.png
  const [fileName, fileExtension] = inputFile.split('.');
  const pathToEncryptedFile = `${imagesFolder}${fileName}-encrypted.${fileExtension}`;
  const fileID = v4();
  const fileSymKeyPath = `${symKeyFolder}${fileID}.secret`;

  const startTime = await unixTimer("start Encryption algorithm");

  // generate blowfish key
  const { blowfishKeyPath, generateBlowfishKeyResult } = await encryptService.generateBlowfishKey(`${fileSymKeyPath}`);

  // encrypt file with blowfish algorithm
  const { stdoutEncrypt, encryptedFilePath, encryptResult } = await encryptService.encryptBlowfish(
    `${blowfishKeyPath}`,
    `${imagesFolder}${inputFile}`,
    pathToEncryptedFile
  );

  // encrypt blowfish key with system public key
  const { result, encryptedKeyPath } = await encryptService.encryptRSA(`${fileSymKeyPath}`, `${systemPublicKey}`);

  // hash the original file
  const { sha256 } = await encryptService.hashSHA256(`${imagesFolder}${inputFile}`);

  // sign the hash with system private key
  const { signResult, signaturePath } = await encryptService.signRSA(sha256, `${systemPrivateKey}`, fileID);

  const stopTime = await unixTimer("stop Encryption algorithm");

  console.log("Execution time: " + ( parseInt(stopTime) - parseInt(startTime) ) + "ms");

  const metadata = await metadataService.createMetadata({
    fileName: inputFile,
    fileUuid: fileID,
    hashValue: sha256,
    signaturePath,
    encryptedFileKey: `${encryptedKeyPath}`,
    encryptedFilePath,
  });

  const fileContents = await encryptService.getFilesContent({
    systemPrivateKeyContent: `${systemPrivateKey}`,
    systemPublicKeyContent: `${systemPublicKey}`,
    encryptedFileContent: `${encryptedFilePath}`,
  });
  
  const fileContentsHex = await encryptService.getFilesContentHex({
    signatureContent: `${signaturePath}`,
    filePrivateKeyContent: `${blowfishKeyPath}`,
    encryptedFilePrivateKeyContent: `${encryptedKeyPath}`,
  });

  res.send({
    metadata,
    encrypt: {
      encryptResult,
      stdoutEncrypt,
    },
    hash: {
      originalHash: sha256,
    },
    signRSA: {
      signResult,
      signaturePath,
    },
    encryptBlowfishKey: {
      encryptResult,
      encryptedFileKey: `${encryptedKeyPath}`,
    },
    fileContents: {
      ...fileContents,
      ...fileContentsHex,
    },
  });
});

// revert the encryptRSA function
export const decryptRSA = catchAsync(async (req: Request, res: Response) => {
  const metadataId = req.query['metadataId'];
  if (!metadataId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'metadataId is required');
  }

  const metadata = await metadataService.getMetadataById(new mongoose.Types.ObjectId(metadataId.toString()));

  if (!metadata) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Metadata not found');
  }

  const decryptedFilePath = `${imagesFolder}${metadata.fileName}-decrypted.${metadata.fileName.split('.')[1]}`;
  console.log('decryptedFilePath', decryptedFilePath);

  const startTime = await unixTimer("start Decryption algorithm");

  // decrypt blowfish key with system private key
  const { result, decryptedKeyPath } = await encryptService.decryptRSA(`${metadata.encryptedFileKey}`, `${systemPrivateKey}`);

  // decrypt file with blowfish algorithm
  const decryptBlowfish = await encryptService.decryptBlowfish(
    `${decryptedKeyPath}`,
    `${metadata.encryptedFilePath}`,
    `${decryptedFilePath}`
  );

  // hash the decrypted file
  const { sha256 } = await encryptService.hashSHA256(decryptedFilePath);
  // verify the signature with system public key
  const verifyRSA = await encryptService.verifyRSA(sha256, metadata.signaturePath, `${systemPublicKey}`);

  const stopTime = await unixTimer("stop Decryption algorithm");

  console.log("Execution time: " + ( parseInt(stopTime) - parseInt(startTime) ) + "ms");
  
  const fileContents = await encryptService.getFilesContent({
    systemPrivateKeyContent: `${systemPrivateKey}`,
    systemPublicKeyContent: `${systemPublicKey}`,
  });
  
  const fileContentsHex = await encryptService.getFilesContentHex({
    signatureContent: `${metadata.signaturePath}`,
    filePrivateKeyContent: `${decryptedKeyPath}`,
    encryptedFilePrivateKeyContent: `${metadata.encryptedFileKey}`,
  });

  res.send({
    decrypt: {
      result: decryptBlowfish.decryptBlowfishResult,
      decryptedFilePath,
    },
    hash: {
      decryptedFilehash: sha256,
      originalHash: metadata.hashValue,
      isHashEqual: sha256 == metadata.hashValue,
    },
    verifyRSA,
    metadata,
    fileContents: {
      ...fileContents,
      ...fileContentsHex,
    },
  });
});
