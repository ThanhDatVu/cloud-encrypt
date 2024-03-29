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
import { downloadFile, uploadFile } from '../utils/spaceService';
import { execPromise } from '../utils';
import { keyManagementService } from '../keyManagement';
const { v4 } = pkg;

const symKeyFolder: string = process.env['SYM_KEY_FOLDER'] || 'sym_key';
const asymKeyFolder: string = process.env['ASYM_KEY_FOLDER'] || 'asym_key';
const imagesFolder: string = process.env['IMAGES_FOLDER'] || 'images';
const imagesFolderTest: string = process.env['IMAGES_FOLDER_TEST'] || 'images_test/';
const systemPublicKey: string = `${asymKeyFolder}public-rsa.pem`;
const systemPrivateKey: string = `${asymKeyFolder}private-rsa.pem`;

const alicePublicKey: string = `${asymKeyFolder}alice-public-rsa.pem`;
const alicePrivateKey: string = `${asymKeyFolder}alice-private-rsa.pem`;

const bobPublicKey: string = `${asymKeyFolder}bob-public-rsa.pem`;
const bobPrivateKey: string = `${asymKeyFolder}bob-private-rsa.pem`;

const blowfishKey = `${symKeyFolder}blowfish.key`;
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
  const pathToOriginalFile = `${imagesFolder}${inputFile}`;
  const pathToEncryptedFile = `${imagesFolder}${fileName}-encrypted.${fileExtension}`;
  const fileID = v4();
  const fileSymKeyPath = `${symKeyFolder}${fileID}.secret`;

  const startTime = await unixTimer('start Encryption algorithm');

  // generate blowfish key
  const { blowfishKeyPath, generateBlowfishKeyResult } = await encryptService.generateBlowfishKey(`${fileSymKeyPath}`);

  // encrypt file with blowfish algorithm
  const { stdoutEncrypt, encryptedFilePath, encryptResult } = await encryptService.encryptBlowfish(
    `${blowfishKeyPath}`,
    `${pathToOriginalFile}`,
    pathToEncryptedFile
  );

  // encrypt blowfish key with system public key
  const { result, encryptedKeyPath } = await encryptService.encryptRSA(`${fileSymKeyPath}`, `${bobPublicKey}`);

  // hash the original file
  const { sha256 } = await encryptService.hashSHA256(`${imagesFolder}${inputFile}`);

  // sign the hash with system private key
  const { signResult, signaturePath } = await encryptService.signRSA(sha256, `${alicePrivateKey}`, fileID);

  const stopEncypt = await unixTimer('stop Encryption algorithm');

  // upload the encrypted file to spaces and delete it from the server
  const uploadFileToSpace = await uploadFile(pathToEncryptedFile);

  const uploadSigntureToSpace = await uploadFile(signaturePath);
  
  
  
  const metadata = await metadataService.createMetadata({
    fileName: inputFile,
    fileUuid: fileID,
    // hashValue: sha256,
    signaturePath,
    encryptedFileKey: `${encryptedKeyPath}`,
    encryptedFilePath,
  });
  
  const stopTime = await unixTimer('stop Encryption algorithm');

  const executionTime = parseInt(stopTime) - parseInt(startTime);

  const executionTimeEncrypt = parseInt(stopEncypt) - parseInt(startTime);
  
  const fileContents = await encryptService.getFilesContent({
    alicePrivateKeyContent: `${alicePrivateKey}`,
    bobPublicKeyContent: `${bobPublicKey}`,
    encryptedFileContent: `${encryptedFilePath}`,
  });

  const fileContentsHex = await encryptService.getFilesContentHex({
    signatureContent: `${signaturePath}`,
    filePrivateKeyContent: `${blowfishKeyPath}`,
    encryptedFilePrivateKeyContent: `${encryptedKeyPath}`,
  });

  const deleteFileFromServer = await execPromise(`rm ${pathToEncryptedFile}`);

  const deleteSignatureFromServer = await execPromise(`rm ${signaturePath}`);

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
    timeMeasurement: {
      executionTime,
      executionTimeEncrypt,
    },
  });
});

// revert the encryptRSA function
export const decryptRSA = catchAsync(async (req: Request, res: Response) => {
  const metadataId = req.query['metadataId'];
  if (!metadataId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'metadataId is required');
  }

  const startTime = await unixTimer('start Decryption algorithm');

  const metadata = await metadataService.getMetadataById(new mongoose.Types.ObjectId(metadataId.toString()));

  if (!metadata) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Metadata not found');
  }

  
  const decryptedFilePath = `${imagesFolder}${metadata.fileName}-decrypted.${metadata.fileName.split('.')[1]}`;
  
  // download the encrypted file from spaces and save it to the server
  const downloadFileFromSpace = await downloadFile(metadata.encryptedFilePath);
  //download the signature file from spaces and save it to the server
  const downloadSignatureFromSpace = await downloadFile(metadata.signaturePath);
  
  const startDecryptTime = await unixTimer('start Decryption algorithm (decrypt + hash + verify only)');

  // decrypt blowfish key with system private key
  const { result, decryptedKeyPath } = await encryptService.decryptRSA(
    `${metadata.encryptedFileKey}`,
    `${bobPrivateKey}`
  );

  // decrypt file with blowfish algorithm
  const decryptBlowfish = await encryptService.decryptBlowfish(
    `${decryptedKeyPath}`,
    `${metadata.encryptedFilePath}`,
    `${decryptedFilePath}`
  );

  // hash the decrypted file
  const { sha256 } = await encryptService.hashSHA256(decryptedFilePath);

  // verify the signature with system public key
  const verifyRSA = await encryptService.verifyRSA(sha256, metadata.signaturePath, `${alicePublicKey}`);

  const stopTime = await unixTimer('stop Decryption algorithm');

  const executionTime = parseInt(stopTime) - parseInt(startTime);
  const executionTimeDecrypt = parseInt(stopTime) - parseInt(startDecryptTime);

  console.log('Execution time: ' + executionTime);

  const fileContents = await encryptService.getFilesContent({
    bobPrivateKeyContent: `${bobPrivateKey}`,
    alicePublicKeyContent: `${alicePublicKey}`,
    encryptedFileContent: `${metadata.encryptedFilePath}`,
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
      // originalHash: metadata.hashValue,
      isHashEqual: sha256 == metadata.hashValue,
    },
    verifyRSA,
    metadata,
    fileContents: {
      ...fileContents,
      ...fileContentsHex,
    },
    timeMeasurement: {
      executionTime,
      executionTimeDecrypt,
    },
  });
});


// set up test to encrypt 50 files using only encryptRSA function
export const encryptRSA50 = catchAsync(async (req: Request, res: Response) => {
  const fileSize = req.body.fileSize > 4000 ? 4000 : req.body.fileSize || 4000;
  const fileNumber = req.body.fileNumber > 100 ? 100 : req.body.fileNumber || 50;
  const rsaKeySize = req.body.rsaKeySize > 4096 ? 4096 : req.body.rsaKeySize || 4096;
  const generatedRSAKey = await keyManagementService.generateRSAKeyPair(rsaKeySize);
  const rsaPrivateKeyPath = generatedRSAKey.privateKeyPath;
  const rsaPublicKeyPath = generatedRSAKey.publicKeyPath;
  const uniqueId = v4();
  const startCopy = await unixTimer('start copy file');
  // arrange
  const filePath = `${imagesFolderTest}input-file-${fileSize}bit-${uniqueId}`;
  console.log(`fallocate -l ${fileSize / 8} ${filePath}`);
  const generateFile = await execPromise(`fallocate -l ${fileSize / 8} ${filePath}`);
  // check file size
  const fileSizeCheck = await execPromise(`du -sh ${filePath}`).then((result) => {
    console.log('file size', result);
    return result;
  });
  const { fileNames } = await encryptService.copyFile(filePath, fileNumber);
  const endCopy = await unixTimer('stop copy file');

  // act
  // 1. encrypt the file with RSA algorithm

  const startEncrypt = await unixTimer('start encrypt file');

  const encryptPromises = fileNames.map(async (fileName: any) => {
    const encryptRSA = await encryptService.encryptRSATest(fileName, `${rsaPublicKeyPath}`);
    return encryptRSA;
  });

  const encryptResults = await Promise.all(encryptPromises);

  const endEncrypt = await unixTimer('stop encrypt file');

  const encryptTimes = encryptResults.map((encryptResult: any) => encryptResult.encryptTime);
  const avgEncryptTime = encryptTimes.reduce((a: any, b: any) => a + b, 0) / encryptResults.length;

  console.log('encryptResults', encryptTimes);
  console.log('encrypt average time', avgEncryptTime);

  // 2. decrypt the test files

  const startDecrypt = await unixTimer('start decrypt file');

  const decryptPromises = encryptResults.map(async (encryptResult: any) => {
    const decryptRSA = await encryptService.decryptRSATest(encryptResult.encryptedFilePath, `${rsaPrivateKeyPath}`);
    return decryptRSA;
  });

  const decryptResults = await Promise.all(decryptPromises);

  const endDecrypt = await unixTimer('stop decrypt file');

  const decryptTimes = decryptResults.map((decryptResult: any) => decryptResult.decryptTime);
  const avgDecryptTime = decryptTimes.reduce((a: any, b: any) => a + b, 0) / decryptResults.length;

  console.log('decryptResults', decryptTimes);
  console.log('decrypt average time', avgDecryptTime);

  const startRemove = await unixTimer('start remove file');

  // remove test files
  const remove = await encryptService.removeFiles([
    ...fileNames,
    ...encryptResults.map((encryptResult: any) => encryptResult.encryptedFilePath),
    ...decryptResults.map((decryptResult: any) => decryptResult.decryptedFilePath),
  ]);

  const stopTime = await unixTimer('stop remove file');

  // calculate throughput in MB/s round to 2 decimal places

  const encryptTime = parseInt(endEncrypt) - parseInt(startEncrypt);
  const decryptTime = parseInt(endDecrypt) - parseInt(startDecrypt);

  console.log('Encrypt Execution time: ' + encryptTime + 'ms');
  console.log('Decrypt Execution time: ' + decryptTime + 'ms');
  console.log('Copy Execution time: ' + (parseInt(endCopy) - parseInt(startCopy)) + 'ms');
  console.log('Remove Execution time: ' + (parseInt(stopTime) - parseInt(startRemove)) + 'ms');

  //calculate throughput in MB/s with fileSize in bit and time in ms
  const encryptThroughput = Math.round(((fileNumber * fileSize) / encryptTime / 1000) * 100) / 100;
  const decryptThroughput = Math.round(((fileNumber * fileSize) / decryptTime / 1000) * 100) / 100;

  res.send({
    message: 'success',
    avgEncryptTime,
    avgDecryptTime,
    encryptTimes,
    decryptTimes,
    throughPut: {
      encryptThroughput,
      decryptThroughput,
    },
  });
});

// set up test to encrypt 50 files using hybrid encryption
export const encryptHybrid50 = catchAsync(async (req: Request, res: Response) => {
  // 1. Arrange
  // 1.1. generate keys match "rsaKeySize" and "blowfishKeySize"
  const blowfishKeySize = req.body.blowfishKeySize > 256 ? 256 : req.body.blowfishKeySize || 256;
  const rsaKeySize = req.body.rsaKeySize > 4096 ? 4096 : req.body.rsaKeySize || 4096;

  const generatedBlowfishKey = await keyManagementService.generateBlowfishKey(blowfishKeySize);
  const blowfishKeyPath = generatedBlowfishKey.keyPath;

  const generatedRSAKey = await keyManagementService.generateRSAKeyPair(rsaKeySize);
  const rsaPublicKeyPath = generatedRSAKey.publicKeyPath;
  const rsaPrivateKeyPath = generatedRSAKey.privateKeyPath;
  // 1.2. generate file match "fileSize"
  const fileSize = req.body.fileSize > 80000000 ? 80000000 : req.body.fileSize || 80000000;
  const fileNumber = req.body.fileNumber > 100 ? 100 : req.body.fileNumber || 50;
  console.log('fileSize', fileSize);

  const startCopy = await unixTimer('start copy file');
  const uniqueId = v4();
  const filePath = `${imagesFolderTest}input-${fileSize}bit-${uniqueId}`;
  const generateFile = await execPromise(`fallocate -l ${fileSize / 8} ${filePath}`);
  const fileSizeCheck = await execPromise(`du -sh ${filePath}`).then((result) => {
    console.log('file size', result);
    return result;
  });
  // 1.3. copy file to match "fileNumber"
  const { fileNames } = await encryptService.copyFile(filePath, fileNumber);
  const endCopy = await unixTimer('stop copy file');

  // 2. Act
  // 2.1. encrypt the file with blowfish algorithm and the blowfish key with RSA algorithm
  const startEncrypt = await unixTimer('start encrypt file');

  const encryptPromises = fileNames.map(async (fileName: any) => {
    const encryptRSA = await encryptService.encryptHybridTest(fileName, `${rsaPublicKeyPath}`, `${blowfishKeyPath}`);
    return encryptRSA;
  });

  const encryptResults = await Promise.all(encryptPromises);
  const endEncrypt = await unixTimer('stop encrypt file');

  const encryptTimes = encryptResults.map((encryptResult: any) => encryptResult.encryptTime);
  const avgEncryptTime = encryptTimes.reduce((a: any, b: any) => a + b, 0) / encryptResults.length;

  const keyEncryptTimes = encryptResults.map((encryptResult: any) => encryptResult.encryptKeyTime);
  const avgKeyEncryptTime = keyEncryptTimes.reduce((a: any, b: any) => a + b, 0) / encryptResults.length;

  const fileEncryptTimes = encryptResults.map((encryptResult: any) => encryptResult.encryptFileTime);
  const avgFileEncryptTime = fileEncryptTimes.reduce((a: any, b: any) => a + b, 0) / encryptResults.length;

  console.log('encrypt times', encryptTimes);
  console.log('encrypt key times', keyEncryptTimes);
  console.log('encrypt file times', fileEncryptTimes);
  console.table({
    avgEncryptTime,
    avgKeyEncryptTime,
    avgFileEncryptTime,
  });

  // 3. decrypt the test files
  // 3.1. decrypt the key with RSA algorithm and decrypt the file with blowfish algorithm
  const startDecrypt = await unixTimer('start decrypt file');

  const decryptPromises = encryptResults.map(async (encryptResult: any) => {
    const decryptRSA = await encryptService.decryptHybridTest(
      encryptResult.encryptedFilePath,
      `${rsaPrivateKeyPath}`,
      encryptResult.encryptedBlowfishKeyPath
    );
    return decryptRSA;
  });

  const decryptResults = await Promise.all(decryptPromises);

  const endDecrypt = await unixTimer('stop decrypt file');

  const decryptTimes = decryptResults.map((decryptResult: any) => decryptResult.decryptTime);
  const avgDecryptTime = decryptTimes.reduce((a: any, b: any) => a + b, 0) / decryptResults.length;

  const keyDecryptTimes = decryptResults.map((decryptResult: any) => decryptResult.decryptKeyTime);
  const avgKeyDecryptTime = keyDecryptTimes.reduce((a: any, b: any) => a + b, 0) / decryptResults.length;

  const fileDecryptTimes = decryptResults.map((decryptResult: any) => decryptResult.decryptFileTime);
  const avgFileDecryptTime = fileDecryptTimes.reduce((a: any, b: any) => a + b, 0) / decryptResults.length;

  console.log('decryptResults', decryptTimes);
  console.log('decrypt key times', keyDecryptTimes);
  console.log('decrypt file times', fileDecryptTimes);
  console.table({
    avgDecryptTime,
    avgKeyDecryptTime,
    avgFileDecryptTime,
  });

  const startRemove = await unixTimer('start remove file');

  // 4. remove the test files
  const remove = await encryptService.removeFiles([
    ...fileNames,
    ...encryptResults.map((encryptResult: any) => encryptResult.encryptedFilePath),
    ...decryptResults.map((decryptResult: any) => decryptResult.decryptedFilePath),
    ...encryptResults.map((encryptResult: any) => encryptResult.encryptedBlowfishKeyPath),
    ...decryptResults.map((decryptResult: any) => decryptResult.decryptedBlowfishKeyPath),
    filePath,
  ]);

  const stopTime = await unixTimer('stop remove file');
  // 5. Assert

  const encryptTime = parseInt(endEncrypt) - parseInt(startEncrypt);
  const decryptTime = parseInt(endDecrypt) - parseInt(startDecrypt);

  //calculate throughput in MB/s with fileSize in bit and time in ms
  const encryptThroughput = Math.round(((fileNumber * fileSize) / encryptTime / 1000) * 100) / 100;
  const decryptThroughput = Math.round(((fileNumber * fileSize) / decryptTime / 1000) * 100) / 100;

  console.table({
    encryptThroughput,
    decryptThroughput,
  });

  console.log('Encrypt Execution time: ' + encryptTime + 'ms');
  console.log('Decrypt Execution time: ' + decryptTime + 'ms');
  console.log('Copy Execution time: ' + (parseInt(endCopy) - parseInt(startCopy)) + 'ms');
  console.log('Remove Execution time: ' + (parseInt(stopTime) - parseInt(startRemove)) + 'ms');

  res.send({
    message: 'success',
    avgEncryptTime,
    avgFileEncryptTime,
    avgKeyEncryptTime,
    avgDecryptTime,
    avgFileDecryptTime,
    avgKeyDecryptTime,
    encryptTimes,
    keyEncryptTimes,
    fileEncryptTimes,
    decryptTimes,
    keyDecryptTimes,
    fileDecryptTimes,
    throughPut: {
      encryptThroughput,
      decryptThroughput,
    },
  });
});

// set up test to encrypt 50 files using blowfish encryption
export const encryptBlowfish50 = catchAsync(async (req: Request, res: Response) => {
  // 1. Arrange
  // 1.1. generate blowfish key match "keySize"
  const { blowfishKeySize } = req.body || 128;
  const generatedBlowfishKey = await keyManagementService.generateBlowfishKey(blowfishKeySize);
  const blowfishKeyPath = generatedBlowfishKey.keyPath;

  const fileSize = req.body.fileSize > 80000000 ? 80000000 : req.body.fileSize || 80000000;
  const fileNumber = req.body.fileNumber > 100 ? 100 : req.body.fileNumber || 50;
  console.log('fileSize', fileSize);

  const startCopy = await unixTimer('start copy file');
  // 1.2. generate a file with "fileSize" and copy it to "fileNumber" files
  const uniqueId = v4();
  const filePath = `${imagesFolderTest}input-${fileSize}bit-${uniqueId}`;
  const generateFile = await execPromise(`fallocate -l ${fileSize / 8} ${filePath}`);
  const fileSizeCheck = await execPromise(`du -sh ${filePath}`).then((result) => {
    console.log('file size', result);
    return result;
  });
  const { fileNames } = await encryptService.copyFile(filePath, fileNumber);
  const endCopy = await unixTimer('stop copy file');

  // 2. encrypt the test files
  const startEncrypt = await unixTimer('start encrypt file');

  const encryptPromises = fileNames.map(async (fileName: any) => {
    const encryptBlowfish = await encryptService.encryptBlowfishTest(fileName, `${blowfishKeyPath}`);
    return encryptBlowfish;
  });

  const encryptResults = await Promise.all(encryptPromises);
  const endEncrypt = await unixTimer('stop encrypt file');

  const encryptTimes = encryptResults.map((encryptResult: any) => encryptResult.encryptTime);
  const avgEncryptTime = encryptTimes.reduce((a: any, b: any) => a + b, 0) / encryptResults.length;

  console.log('encrypt times', encryptTimes);

  // 3. decrypt the test files

  const startDecrypt = await unixTimer('start decrypt file');

  const decryptPromises = encryptResults.map(async (encryptResult: any) => {
    const decryptBlowfish = await encryptService.decryptBlowfishTest(encryptResult.encryptedFilePath, `${blowfishKeyPath}`);
    return decryptBlowfish;
  });

  const decryptResults = await Promise.all(decryptPromises);

  const endDecrypt = await unixTimer('stop decrypt file');

  const decryptTimes = decryptResults.map((decryptResult: any) => decryptResult.decryptTime);
  const avgDecryptTime = decryptTimes.reduce((a: any, b: any) => a + b, 0) / decryptResults.length;

  console.log('decryptResults', decryptTimes);
  console.table({
    avgEncryptTime,
    avgDecryptTime,
  });

  const startRemove = await unixTimer('start remove file');

  // 4. remove the test files
  const remove = await encryptService.removeFiles(
    [
      ...fileNames,
      ...encryptResults.map((encryptResult: any) => encryptResult.encryptedFilePath),
      ...decryptResults.map((decryptResult: any) => decryptResult.decryptedFilePath),
      filePath,
    ],
    imagesFolderTest
  );

  const stopTime = await unixTimer('stop remove file');

  // 5. Assert

  const encryptTime = parseInt(endEncrypt) - parseInt(startEncrypt);
  const decryptTime = parseInt(endDecrypt) - parseInt(startDecrypt);
  //calculate throughput in MB/s with fileSize in bit and time in ms
  const encryptThroughput = Math.round(((fileNumber * fileSize) / encryptTime / 1000) * 100) / 100;
  const decryptThroughput = Math.round(((fileNumber * fileSize) / decryptTime / 1000) * 100) / 100;

  console.table({
    encryptThroughput,
    decryptThroughput,
  });

  console.log('Encrypt Execution time: ' + encryptTime + 'ms');

  console.log('Decrypt Execution time: ' + decryptTime + 'ms');

  console.log('Copy Execution time: ' + (parseInt(endCopy) - parseInt(startCopy)) + 'ms');

  console.log('Remove Execution time: ' + (parseInt(stopTime) - parseInt(startRemove)) + 'ms');

  res.send({
    message: 'success',
    avgEncryptTime,
    avgDecryptTime,
    encryptTimes,
    decryptTimes,
    throughtput: {
      encryptThroughput,
      decryptThroughput,
    },
  });
});

//ecrypt 50 files using aes encryption
export const encryptAes50 = catchAsync(async (req: Request, res: Response) => {
  // 1. Arrange
  // 1.1. generate aes key match "keySize"
  const { aesKeySize } = req.body || 128;
  const generatedAesKey = await keyManagementService.generateAesKey(aesKeySize);
  const aesKeyPath = generatedAesKey.keyPath;

  const fileSize = req.body.fileSize > 80000000 ? 80000000 : req.body.fileSize || 80000000;
  const fileNumber = req.body.fileNumber > 100 ? 100 : req.body.fileNumber || 50;
  console.log('fileSize', fileSize);

  const startCopy = await unixTimer('start copy file');
  // 1.2. generate a file with "fileSize" and copy it to "fileNumber" files
  const uniqueId = v4();
  const filePath = `${imagesFolderTest}input-${fileSize}bit-${uniqueId}`;
  const generateFile = await execPromise(`fallocate -l ${fileSize / 8} ${filePath}`);
  const fileSizeCheck = await execPromise(`du -sh ${filePath}`).then((result) => {
    console.log('file size', result);
    return result;
  });
  const { fileNames } = await encryptService.copyFile(filePath, fileNumber);
  const endCopy = await unixTimer('stop copy file');

  // 2. encrypt the test files
  const startEncrypt = await unixTimer('start encrypt file');

  const encryptPromises = fileNames.map(async (fileName: any) => {
    const encryptAes = await encryptService.encryptAesTest(fileName, `${aesKeyPath}`);
    return encryptAes;
  });

  const encryptResults = await Promise.all(encryptPromises);
  const endEncrypt = await unixTimer('stop encrypt file');

  const encryptTimes = encryptResults.map((encryptResult: any) => encryptResult.encryptTime);
  const avgEncryptTime = encryptTimes.reduce((a: any, b: any) => a + b, 0) / encryptResults.length;

  console.log('encrypt times', encryptTimes);

  // 3. decrypt the test files

  const startDecrypt = await unixTimer('start decrypt file');

  const decryptPromises = encryptResults.map(async (encryptResult: any) => {
    const decryptAes = await encryptService.decryptAesTest(encryptResult.encryptedFilePath, `${aesKeyPath}`);
    return decryptAes;
  });

  const decryptResults = await Promise.all(decryptPromises);

  const endDecrypt = await unixTimer('stop decrypt file');

  const decryptTimes = decryptResults.map((decryptResult: any) => decryptResult.decryptTime);

  const avgDecryptTime = decryptTimes.reduce((a: any, b: any) => a + b, 0) / decryptResults.length;

  console.log('decryptResults', decryptTimes);

  const startRemove = await unixTimer('start remove file');

  // 4. remove the test files

  const remove = await encryptService.removeFiles(
    [
      ...fileNames,
      ...encryptResults.map((encryptResult: any) => encryptResult.encryptedFilePath),
      ...decryptResults.map((decryptResult: any) => decryptResult.decryptedFilePath),
      filePath,
    ],
    imagesFolderTest
  );

  const stopTime = await unixTimer('stop remove file');

  // 5. Assert

  const encryptTime = parseInt(endEncrypt) - parseInt(startEncrypt);
  const decryptTime = parseInt(endDecrypt) - parseInt(startDecrypt);
  //calculate throughput in MB/s with fileSize in bit and time in ms
  const encryptThroughput = Math.round(((fileNumber * fileSize) / encryptTime / 1000) * 100) / 100;
  const decryptThroughput = Math.round(((fileNumber * fileSize) / decryptTime / 1000) * 100) / 100;

  console.table({
    encryptThroughput,
    decryptThroughput,
  });

  console.log('Encrypt Execution time: ' + encryptTime + 'ms');

  console.log('Decrypt Execution time: ' + decryptTime + 'ms');

  console.log('Copy Execution time: ' + (parseInt(endCopy) - parseInt(startCopy)) + 'ms');

  console.log('Remove Execution time: ' + (parseInt(stopTime) - parseInt(startRemove)) + 'ms');

  res.send({
    message: 'success',
    avgEncryptTime,
    avgDecryptTime,
    encryptTimes,
    decryptTimes,
    throughtput: {
      encryptThroughput,
      decryptThroughput,
    },
  });
});
