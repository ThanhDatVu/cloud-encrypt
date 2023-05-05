import httpStatus from 'http-status';
import mongoose from 'mongoose';
import Encrypt from './encrypt.model';
import ApiError from '../errors/ApiError';
import { IOptions, QueryResult } from '../paginate/paginate';
import { NewCreatedEncrypt, UpdateEncryptBody, IEncryptDoc, NewRegisteredEncrypt } from './encrypt.interfaces';
import { exec, execSync } from 'child_process';
import { execPromise } from '../utils';
import fs from 'fs';
import { object } from 'joi';
import unixTimer from '../utils/unixTimer';
import { performance, PerformanceObserver } from 'perf_hooks';

const observer = new PerformanceObserver((items) => items.getEntries().forEach((entry) => console.log(entry)));
observer.observe({ entryTypes: ['measure'] });

/**
 * Use Blowfish encryption to encrypt a file with key from a file in openssl 3.0.0
 * @params {string} keyFile
 * @params {string} inputFile
 * @params {string} outputFile
 * @returns {Promise<string>}
 */
export const encryptBlowfish = async (
  keyFile: string,
  inputFile: string,
  outputFile: string
): Promise<{
  stdoutEncrypt: string;
  encryptResult: string;
  encryptedFilePath: string;
}> => {
  let stdoutEncrypt = '';
  let encryptedFile = outputFile;
  let encryptResult = '';
  await execPromise(`cat ${keyFile}`)
    .then((res) => {
      console.log('sharedSecretExists:Done');
      console.log('Shared secret: ', res);
    })
    .catch((err) => {
      console.log('sharedSecretExists:Failed');
      console.log(err);
    });

  console.log(
    `Blowfish encrypt command: openssl enc -e -bf -in ${inputFile} -out ${outputFile} -k $(xxd -p ${keyFile} | tr -d '\n') -provider legacy -provider default`
  );
  await execPromise(
    `openssl enc -e -bf -in ${inputFile} -out ${outputFile} -k $(xxd -p ${keyFile} | tr -d '\n') -provider legacy -provider default`
  )
    .then((res) => {
      console.log('encryptBlowfish:Done');
      stdoutEncrypt = res;
      encryptResult = 'encryptBlowfish:Done';
    })
    .catch((err) => {
      console.log('encryptBlowfish:Failed');
      console.log(err);
    });
  return { stdoutEncrypt, encryptedFilePath: encryptedFile, encryptResult };
};

/**
 * Use Blowfish encryption to decrypt a file in openssl 3.0.0
 * @params {string} keyFile: key file of the encrypted file
 * @params {string} inputFile: file to be decrypted
 * @params {string} outputFile: file to be saved
 * @returns {Promise<string>}
 */
export const decryptBlowfish = async (
  keyFile: string,
  inputFile: string,
  outputFile: string
): Promise<{
  decryptBlowfishResult: string;
  decryptedFilePath: string;
  error?: string;
  decryptStdout?: string;
}> => {
  try {
    let decryptBlowfishResult = '';
    console.log(
      `Blowfish decrypt command: openssl enc -d -bf -in ${inputFile} -out ${outputFile} -k $(xxd -p ${keyFile} | tr -d '\n') -provider legacy -provider default`
    );
    await execPromise(
      `openssl enc -d -bf -in ${inputFile} -out ${outputFile} -k $(xxd -p ${keyFile} | tr -d '\n') -provider legacy -provider default`
    )
      .then((res) => {
        console.log('decryptBlowfish:Done');
        console.log('decryptBlowfish', res);
        decryptBlowfishResult = 'decryptBlowfish:Done';
      })
      .catch((err) => {
        console.log('decryptBlowfish:Failed');
        console.log(err);
        decryptBlowfishResult = 'decryptBlowfish:Failed';
      });
    return {
      decryptBlowfishResult,
      decryptedFilePath: outputFile,
    };
  } catch (error) {
    console.log(error);
    return {
      decryptBlowfishResult: 'decryptBlowfish:Failed',
      decryptedFilePath: outputFile,
    };
  }
};

/**
 * Use openSSL MD5 to calculate the hash of a file
 * @params {string} inputFile: file to be hashed
 * @returns {Promise<string>}
 */
export const hashMD5 = async (inputFile: string): Promise<string> => {
  try {
    let result = '';

    // openssl(['openssl', 'dgst', '-md5', `${inputFile}`], function (err: any, buffer: any) {
    //   console.log(err.toString(), buffer.toString());
    //   result = buffer.toString();
    // });
    console.log(`openssl dgst -md5 ${inputFile}`);
    const hash = await execPromise(`openssl dgst -md5 ${inputFile}`);
    //@ts-ignore
    result = hash.toString().split('=')[1].trim();
    return result;
  } catch (error) {
    console.log(error);
    return '';
  }
};

/**
 * Use openSSL ecdsa to sign a file
 * @params {string} string to be signed
 * @params {string} keyFile: key file of the private key
 * @returns {Promise<string>} signature
 */
export const signECDSA = async (
  string: string,
  systemPrivateKey: string,
  fileID: string
): Promise<{
  signaturePath: string;
  signResult: string;
  error?: string;
}> => {
  const signatureFolder = process.env['SIGNATURE_FOLDER'] || 'signatures';
  const signaturePath = `${signatureFolder}${fileID}.bin`;
  console.log(
    `echo ${string} |
    openssl dgst -sign ${systemPrivateKey} -out ${signaturePath} -provider legacy -provider default`
  );
  let signResult = '';
  let error = '';
  execPromise(`echo ${string} |
  openssl dgst -sign ${systemPrivateKey} -out ${signaturePath} -provider legacy -provider default`)
    .then((res) => {
      console.log('signECDSA:Done');
      signResult = 'signECDSA:Done';
    })
    .catch((err) => {
      console.log('signECDSA:Failed');
      console.log(err);
      signResult = 'signECDSA:Failed';
      error = err;
    });
  return { signaturePath, signResult, error };
};

/**
 * Use openSSL ecdsa to verify a signature
 * @param {string} string to be verified
 * @param {string} signatureFilePath: signature to be verified
 * @param {string} systemPublicKeyFile: key file of the public key
 * @returns {Promise<string>} signature
 * @returns {Promise<boolean>} true if verified, false otherwise
 * @returns {Promise<string>} error message if any
 * @returns {Promise<string>} stdout if any
 */
export const verifyECDSA = async (
  string: string,
  signatureFilePath: string,
  systemPublicKeyFile: string
): Promise<{
  isValid: boolean;
  stdout: string;
  error: string;
}> => {
  try {
    let result = '';
    let verified;
    console.log(`echo ${string} | openssl dgst -verify ${systemPublicKeyFile} -signature ${signatureFilePath}`);
    const signVerificationResult = await execPromise(
      `echo ${string} |
    openssl dgst -verify ${systemPublicKeyFile} -signature ${signatureFilePath}`
    );

    console.log('signVerificationResult', signVerificationResult);
    //@ts-ignore
    return {
      isValid: true,
      stdout: signVerificationResult,
      error: '',
    };
  } catch (error: any) {
    console.log(error);
    return {
      isValid: false,
      stdout: '',
      error: error.message,
    };
  }
};

/**
 * Use openSSL to generate a key pair of ec key and use it to implement
 * ecdh key exchange with output is a shared secret and a public key
 * @param  string systemPublicKeyFile
 * @param  string tempPrivateKeyFile uuid
 * @returns {Promise<string>} shared secret
 * @returns {Promise<string>} public key
 * @returns {Promise<string>} error message if any
 * @returns {Promise<string>} stdout if any
 */
export const ecdhKeyExchange = async (
  systemPublicKeyFile: string,
  tempPrivateKeyFile: string
): Promise<{
  ecdhKeyExchangeResult: any;
  publicFileKeyPath: any;
  sharedSecretPath: any;
  privateFileKeyPath: any;
  error: any;
  stdout: any;
}> => {
  try {
    const signatureFolder = process.env['SIGNATURE_FOLDER'] || 'signatures';
    const symKeyFolder = process.env['SYM_KEY_FOLDER'] || 'keys/sym/';
    const asymKeyFolder = process.env['ASYM_KEY_FOLDER'] || 'keys/asym/';
    const tempPublicKeyFile = tempPrivateKeyFile + '.pub';
    const privateFileKeyPath = asymKeyFolder + tempPrivateKeyFile;
    const publicFileKeyPath = privateFileKeyPath + '.pub';
    const sharedSecretPath = symKeyFolder + tempPrivateKeyFile + '.encrypt.secret';

    console.log('privateFileKeyPath', privateFileKeyPath);
    console.log('publicFileKeyPath', publicFileKeyPath);
    let ecdhKeyExchangeResult = '';
    let error = '';
    let stdout = '';

    console.log(
      `Generate File Private Emphamel Key: openssl ecparam -name secp256k1 -genkey -noout -out ${privateFileKeyPath}`
    );
    await execPromise(`openssl ecparam -name secp256k1 -genkey -noout -out ${privateFileKeyPath}`);

    console.log(`Generate File Public Key: openssl pkey -in ${privateFileKeyPath} -pubout -out ${publicFileKeyPath}`);
    await execPromise(`openssl pkey -in ${privateFileKeyPath} -pubout -out ${publicFileKeyPath}`)
      .then((res) => {
        console.log('ecdhKeyExchange:Done');
        stdout = res;
      })
      .catch((err) => {
        console.log('ecdhKeyExchange:Failed');
        console.error('Generate File Public Key', err);
        error = err;
        ecdhKeyExchangeResult = 'ECDH Key Exchange:Failed';
      });

    console.log(
      `Calculate shared secret: openssl pkeyutl -derive -inkey ${privateFileKeyPath} -peerkey ${systemPublicKeyFile} -out ${sharedSecretPath}`
    );
    await execPromise(
      `openssl pkeyutl -derive -inkey ${privateFileKeyPath} -peerkey ${systemPublicKeyFile} -out ${sharedSecretPath}`
    )
      .then((res) => {
        console.log('Calculate shared secret:Done');
        console.log('ECDH Key Exchange:Done');
        stdout = res;
        ecdhKeyExchangeResult = 'ECDH Key Exchange:Done';
      })
      .catch((err) => {
        console.log('Calculate shared secret:Failed');
        console.error('Error: Calculate shared secret: ', err);
        error = err;
        ecdhKeyExchangeResult = 'ECDH Key Exchange:Failed';
      });
    const data = {
      ecdhKeyExchangeResult,
      publicFileKeyPath,
      sharedSecretPath,
      privateFileKeyPath,
      error,
      stdout,
    };
    return data;
  } catch (error: any) {
    console.log(error);
    return {
      ecdhKeyExchangeResult: 'ECDH Key Exchange:Failed',
      publicFileKeyPath: '',
      sharedSecretPath: '',
      privateFileKeyPath: '',
      error: error.message,
      stdout: '',
    };
  }
};

/**
 * Use openSSL to perform ecdh key exchange with input is a system private key and a public key obtain from above
 * @param  string systemPrivateKeyFile
 * @param  string tempPublicKeyFile
 * @returns {Promise<string>} shared secret
 * @returns {Promise<string>} error message if any
 * @returns {Promise<string>} stdout if any
 */
export const ecdhKeyExchange2 = async (
  systemPrivateKeyFile: string,
  tempPublicKeyFile: string,
  fileName: string
): Promise<{
  result: any;
  error: any;
  stdout: any;
  sharedSecretPath: any;
}> => {
  try {
    let result = '';
    let error = '';
    let stdout = '';
    const symKeyFolder = process.env['SYM_KEY_FOLDER'] || 'keys/sym/';
    const sharedSecretPath = symKeyFolder + fileName + '.decrypt.secret';
    console.log(
      `Calculate shared secret: openssl pkeyutl -derive -inkey ${systemPrivateKeyFile} -peerkey ${tempPublicKeyFile} -out ${sharedSecretPath}`
    );
    await execPromise(
      `openssl pkeyutl -derive -inkey ${systemPrivateKeyFile} -peerkey ${tempPublicKeyFile} -out ${sharedSecretPath}`
    )
      .then((res) => {
        console.log('ecdhKeyExchange:Done');
        stdout = res;
      })
      .catch((err) => {
        console.log('ecdhKeyExchange:Failed');
        console.log(err);
        error = err;
      });
    return { result, error, stdout, sharedSecretPath };
  } catch (error: any) {
    return { result: '', error: error, stdout: '', sharedSecretPath: '' };
  }
};

/**
 * @param  {any} filePaths
 * @returns {Promise<string>} file contents
 */
export const getFilesContent = async (filePaths: any) => {
  try {
    let fileContents: any = {};
    const fileContentsHandler = await Promise.all(
      Object.keys(filePaths).map(async (filePath: any) => {
        fileContents[filePath] = await execPromise(`cat ${filePaths[filePath]} | head -c 1000`);
      })
    );
    return fileContents;
  } catch (error: any) {
    console.log(error);
    return { result: '', error: error, stdout: '' };
  }
};

//get file content in hex format with xxd
export const getFilesContentHex = async (filePaths: any) => {
  try {
    let fileContents: any = {};
    const fileContentsHandler = await Promise.all(
      Object.keys(filePaths).map(async (filePath: any) => {
        // get only the first 1000 characters
        fileContents[filePath] = await execPromise(`xxd -p ${filePaths[filePath]} | tr -d '\n'  | head -c 1000`);
      })
    );
    return fileContents;
  } catch (error: any) {
    console.log(error);
    return { result: '', error: error, stdout: '' };
  }
};

/**
 * encrypt file with RSA
 * @param  {any} filePaths
 * @param  {any} publicKeyPath
 */
export const encryptRSA = async (filePaths: any, publicKeyPath: any) => {
  try {
    let result = '';
    let error = '';
    let stdout = '';
    const [fileName, fileExtension] = filePaths.split('.');
    const encryptedKeyPath = `${fileName}-encrypted.${fileExtension}`;
    // using pkeyutl to encrypt file
    console.log(
      `Encrypt file: openssl pkeyutl -encrypt -pubin -inkey ${publicKeyPath} -in ${filePaths} -out ${encryptedKeyPath}`
    );

    await execPromise(`openssl pkeyutl -encrypt -pubin -inkey ${publicKeyPath} -in ${filePaths} -out ${encryptedKeyPath}`)
      .then((res) => {
        console.log('Encrypt file:Done');
        stdout = res;
        result = 'Encrypt file:Done';
      })
      .catch((err) => {
        console.log('Encrypt file:Failed');
        console.log(err);
        error = err;
      });
    return { encryptedKeyPath, result, error, stdout };
  } catch (error: any) {
    return { result: '', error: error, stdout: '' };
  }
};

/**
 * decrypt file with RSA
 * @param  {any} filePaths
 * @param  {any} privateKeyPath
 * @returns {Promise<string>} file contents
 * @returns {Promise<string>} error message if any
 * @returns {Promise<string>} stdout if any
 */

export const decryptRSA = async (filePaths: any, privateKeyPath: any) => {
  try {
    let result = '';
    let error = '';
    let stdout = '';
    const [fileName, fileExtension] = filePaths.split('.');
    const decryptedKeyPath = `${fileName}-decrypted.${fileExtension}`;
    // using pkeyutl to decrypt file
    console.log(
      `Decrypt file with RSA: openssl pkeyutl -decrypt -inkey ${privateKeyPath} -in ${filePaths} -out ${decryptedKeyPath}`
    );
    await execPromise(`openssl pkeyutl -decrypt -inkey ${privateKeyPath} -in ${filePaths} -out ${decryptedKeyPath}`)
      .then((res) => {
        console.log('Decrypt file:Done');
        stdout = res;
        result = 'Decrypt file:Done';
      })
      .catch((err) => {
        console.log('Decrypt file:Failed');
        console.log(err);
        error = err;
      });
    return { decryptedKeyPath, result, error, stdout };
  } catch (error: any) {
    return { result: '', error: error, stdout: '' };
  }
};

/**
 * Use openSSL RSA to sign a string
 * @params {string} string to be signed
 * @params {string} keyFile: key file of the private key
 * @returns {Promise<string>} signature
 */
export const signRSA = async (
  string: string,
  systemPrivateKey: string,
  fileID: string
): Promise<{
  signaturePath: string;
  signResult: string;
  error?: string;
}> => {
  const signatureFolder = process.env['SIGNATURE_FOLDER'] || 'signatures';
  const signaturePath = `${signatureFolder}${fileID}.bin`;
  console.log(
    `echo ${string} |
    openssl dgst -sign ${systemPrivateKey} -out ${signaturePath} -provider legacy -provider default`
  );
  let signResult = '';
  let error = '';
  execPromise(`echo ${string} |
  openssl dgst -sign ${systemPrivateKey} -out ${signaturePath} -provider legacy -provider default`)
    .then((res) => {
      console.log('signRSA:Done');
      signResult = 'signRSA:Done';
    })
    .catch((err) => {
      console.log('signRSA:Failed');
      console.log(err);
      signResult = 'signRSA:Failed';
      error = err;
    });
  return { signaturePath, signResult, error };
};

/**
 * Use openSSL RSA to verify a string
 * @params {string} string to be verified
 * @params {string} signaturePath: path to the signature file
 * @params {string} publicKeyPath: path to the public key file
 * @returns {Promise<string>} signature
 * @returns {Promise<string>} error message if any
 * @returns {Promise<string>} stdout if any
 */
export const verifyRSA = async (
  string: string,
  signaturePath: string,
  publicKeyPath: string
): Promise<{
  isValid: boolean;
  error?: string;
  stdout?: string;
}> => {
  try {
    console.log(
      `echo ${string} |
    openssl dgst -verify ${publicKeyPath} -signature ${signaturePath} -provider legacy -provider default`
    );
    let isValid = false;
    let error = '';
    let stdout = '';
    await execPromise(
      `echo ${string} |
    openssl dgst -verify ${publicKeyPath} -signature ${signaturePath} -provider legacy -provider default`
    )
      .then((res) => {
        console.log('verifyRSA:Done');
        isValid = true;
        stdout = res;
      })
      .catch((err) => {
        console.log('verifyRSA:Failed');
        console.log(err);
        isValid = false;
        error = err;
      });
    return { isValid, error, stdout };
  } catch (error: any) {
    return { isValid: false, error: error, stdout: '' };
  }
};

/**
 * generate Blowfish key with openssl and save to file
 * @param  {any} keyLength
 * @returns {Promise<string>} key
 * @returns {Promise<string>} error message if any
 * @returns {Promise<string>} stdout if any
 */
export const generateBlowfishKey = async (keyPath: string, keyLength: any = 64) => {
  try {
    let generateBlowfishKeyResult = '';
    let error = '';
    let stdout = '';
    console.log(`Generate Blowfish key: openssl rand -hex ${keyLength} > ${keyPath}`);
    await execPromise(`openssl rand -hex ${keyLength} > ${keyPath}`)
      .then((res) => {
        console.log('Generate Blowfish key:Done');
        stdout = res;
        generateBlowfishKeyResult = 'Generate Blowfish key:Done';
      })
      .catch((err) => {
        console.log('Generate Blowfish key:Failed');
        console.log(err);
        error = err;
      });
    return { blowfishKeyPath: keyPath, generateBlowfishKeyResult, error, stdout };
  } catch (error: any) {
    return { generateBlowfishKeyResult: 'Generate Blowfish key:Failed', error: error, stdout: '' };
  }
};

/**
 * hash file with SHA256
 * @param  {any} filePaths
 * @returns {Promise<string>} hash
 * @returns {Promise<string>} error message if any
 * @returns {Promise<string>} stdout if any
 */
export const hashSHA256 = async (filePaths: any) => {
  try {
    let result = '';
    let error = '';
    let stdout = '';
    console.log(`Hash file with SHA256: openssl dgst -sha256 ${filePaths}`);
    const hash = await execPromise(`openssl dgst -sha256 ${filePaths}`);
    console.log(hash);
    //@ts-ignore
    result = hash.toString().split('=')[1].trim();
    console.log('Hash file with SHA256:Done');
    return { sha256: result, error, stdout };
  } catch (error: any) {
    return { sha256: '', error: error, stdout: '' };
  }
};

/**
 * copy a file a number of times
 * @param  {any} filePaths
 * @param  {any} numberOfCopies
 * @returns {Promise<string>} error message if any
 * @returns {Promise<string>} stdout if any
 */
export const copyFile = async (filePaths: any, numberOfCopies: any) => {
  try {
    let result = '';
    let error = '';
    let stdout = '';
    //split the file path to get the file name and extension
    const fileName = filePaths.split('.')[0];
    //generate a array of number from 1 to numberOfCopies
    const fileNameToCopy = Array.from(Array(numberOfCopies).keys()).map((i) => `${fileName}_${i + 1}`);

    // promise all to copy the file
    const a = `i=1; while [ "$i" -le ${numberOfCopies} ]; do cp ${filePaths} ${fileName}_"$i";  i=$((i+1));  done`;
    await execPromise(a)
      .then((res) => {
        // console.log('Copy file:Done');
        console.log(res);
      })
      .catch((err) => {
        console.log('Copy file:Failed');
        console.log(err);
      });

    return { fileNames: fileNameToCopy, error, stdout };
  } catch (error: any) {
    console.log(error);
    return { fileNames: [], error: error, stdout: '' };
  }
};

/**
 * remove a number of files
 * @param  {any} filePaths array of file paths
 * @returns {Promise<string>} error message if any
 * @returns {Promise<string>} stdout if any
 */
export const removeFiles = async (filePaths: any, folderPath?: any) => {
  try {
    let result = '';
    let error = '';
    let stdout = '';
    //
    if (folderPath) {
      await execPromise(`find ${folderPath} -type f ! -name 'input.png' ! -name '.gitignore' -delete
      `)
        .then((res) => {
          // console.log('Copy file:Done');
          console.log(res);
        })
        .catch((err) => {
          console.log('Copy file:Failed');
          console.log(err);
        });
    } else {
      // promise all to remove the file
      await Promise.all(
        filePaths.map((filePath: any) => {
          // console.log(`Remove file: rm ${filePath}`);
          return execPromise(`rm ${filePath}`);
        })
      );
    }
    return { result, error, stdout };
  } catch (error: any) {
    return { result: '', error: error, stdout: '' };
  }
};

/**
 * encrypt file with RSA
 * @param  {any} filePaths
 * @param  {any} publicKeyPath
 */
export const encryptRSATest = async (filePaths: any, publicKeyPath: any) => {
  try {
    let result = '';
    let error = '';
    let stdout = '';
    let start;
    let stop;
    const [fileName, fileExtension] = filePaths.split('.');
    const encryptedFilePath = `${fileName}-encrypted.${fileExtension || ''}`;


    // await execPromise(`openssl pkeyutl -encrypt -pubin -inkey ${publicKeyPath} -in ${filePaths} -out ${encryptedFilePath}`)
    await execPromise(` date +%s%3N && openssl pkeyutl -encrypt -pubin -inkey ${publicKeyPath} -in ${filePaths} -out ${encryptedFilePath} && date +%s%3N`)
      .then((res) => {
        // console.log('Encrypt file:RSA', res);
        [start, stop] = res.split('\n');
        stdout = res;
        result = 'Encrypt file:Done';
      })
      .catch((err) => {
        console.log('Encrypt file:Failed');
        console.log(err);
        error = err;
      });

    //@ts-ignore
    const encryptTime = parseInt(stop) - parseInt(start);

    return { encryptedFilePath, result, error, stdout, encryptTime };
  } catch (error: any) {
    return { result: '', error: error, stdout: '' };
  }
};

/**
 * decrypt file with RSA
 * @param  {any} filePaths
 * @param  {any} privateKeyPath
 * @returns {Promise<string>} decrypted file path
 * @returns {Promise<string>} error message if any
 * @returns {Promise<string>} stdout if any
 */
export const decryptRSATest = async (filePaths: any, privateKeyPath: any) => {
  try {
    let result = '';
    let error = '';
    let stdout = '';
    let start;
    let stop;
    const [fileName, fileExtension] = filePaths.split('.');
    const decryptedFilePath = `${fileName}-decrypted.${fileExtension || ''}`;

    //timer start using unix time util

    // console.log(
    //   `Decrypt file: openssl pkeyutl -decrypt -inkey ${privateKeyPath} -in ${filePaths} -out ${decryptedKeyPath}`
    // );
    await execPromise(` date +%s%3N && openssl pkeyutl -decrypt -inkey ${privateKeyPath} -in ${filePaths} -out ${decryptedFilePath} && date +%s%3N`)
      .then((res) => {
        // console.log('Decrypt file:Done');
        [start, stop] = res.split('\n');
        stdout = res;
        result = 'Decrypt file:Done';
      })
      .catch((err) => {
        console.log('Decrypt file:Failed');
        console.log(err);
        error = err;
      });

    //@ts-ignore
    const decryptTime = parseInt(stop) - parseInt(start);

    return { decryptedFilePath, result, error, stdout, decryptTime };
  } catch (error: any) {
    return { result: '', error: error, stdout: '' };
  }
};

// ecrypt file with blowfish then encrypt the blowfish key with RSA
export const encryptHybridTest = async (filePaths: any, publicKeyPath: any, blowfishKeyPath: any) => {
  try {
    let result = '';
    let error = '';
    let stdout = '';
    let startKey;
    let stopKey;
    let startFile;
    let stopFile;
    const [fileName, fileExtension] = filePaths.split('.');
    const encryptedFilePath = `${fileName}-encrypted.${fileExtension || ''}`;
    const encryptedBlowfishKeyPath = `${fileName}-encrypted-blowfish-key.${fileExtension || ''}`;

    // ecrypt file with blowfish

    await execPromise(
      `date +%s%3N && openssl enc -bf-cbc -in ${filePaths} -out ${encryptedFilePath} -pass file:${blowfishKeyPath} -provider legacy -provider default && date +%s%3N`
    )
      .then((res) => {
        [startFile, stopFile] = res.split('\n');
        stdout = res;
        result = 'Encrypt file:Done';
      })
      .catch((err) => {
        console.log('Encrypt file:Failed');
        console.log(err);
        error = err;
      });

    await execPromise(
      ` date +%s%3N && openssl pkeyutl -encrypt -pubin -inkey ${publicKeyPath} -in ${blowfishKeyPath} -out ${encryptedBlowfishKeyPath} && date +%s%3N`
    )
      .then((res) => {
        // split the stdout to get the start and stop time split by new line
        [startKey, stopKey] = res.split('\n');

        stdout = res;
        result = 'Encrypt file:Done';
      })
      .catch((err) => {
        console.log('Encrypt key:Failed');
        console.log(err);
        error = err;
      });

    //@ts-ignore
    const encryptFileTime = parseInt(stopFile) - parseInt(startFile);
    //@ts-ignore
    const encryptKeyTime = parseInt(stopKey) - parseInt(startKey);

    const encryptTime = encryptFileTime + encryptKeyTime;

    const output = {
      encryptedFilePath,
      encryptedBlowfishKeyPath,
      result,
      error,
      stdout,
      encryptTime,
      encryptFileTime,
      encryptKeyTime,
    };
    return output;
  } catch (error: any) {
    return { result: '', error: error, stdout: '' };
  }
};

// decrypt the blowfish key with RSA then decrypt the file with blowfish
export const decryptHybridTest = async (filePaths: any, privateKeyPath: any, blowfishKeyPath: any) => {
  try {
    let result = '';
    let error = '';
    let stdout = '';
    let startKey;
    let stopKey;
    let startFile;
    let stopFile;
    const [fileName, fileExtension] = filePaths.split('.');
    const decryptedFilePath = `${fileName}-decrypted.${fileExtension || ''}`;
    const decryptedBlowfishKeyPath = `${fileName}-decrypted-blowfish-key.${fileExtension || ''}`;

    await execPromise(
      `date +%s%3N && openssl pkeyutl -decrypt -inkey ${privateKeyPath} -in ${blowfishKeyPath} -out ${decryptedBlowfishKeyPath} && date +%s%3N`
    )
      .then((res) => {
        [startKey, stopKey] = res.split('\n');

        stdout = res;
        result = 'Decrypt file:Done';
      })
      .catch((err) => {
        console.log('Decrypt file:Failed');
        console.log(err);
        error = err;
      });

    // decrypt file with blowfish

    await execPromise(
      `date +%s%3N && openssl enc -bf-cbc -d -in ${filePaths} -out ${decryptedFilePath} -pass file:${decryptedBlowfishKeyPath} -provider legacy -provider default && date +%s%3N`
    )
      .then((res) => {
        [startFile, stopFile] = res.split('\n');

        stdout = res;
        result = 'Decrypt file:Done';
      })
      .catch((err) => {
        console.log('Decrypt file:Failed');
        console.log(err);
        error = err;
      });

    //@ts-ignore
    const decryptFileTime = parseInt(stopFile) - parseInt(startFile);
    //@ts-ignore
    const decryptKeyTime = parseInt(stopKey) - parseInt(startKey);

    const decryptTime = decryptFileTime + decryptKeyTime;

    const output = {
      decryptedFilePath,
      decryptedBlowfishKeyPath,
      result,
      error,
      stdout,
      decryptTime,
      decryptFileTime,
      decryptKeyTime,
    };
    return output;
  } catch (error: any) {
    return { result: '', error: error, stdout: '' };
  }
};


// encrypt file with blowfish test
export const encryptBlowfishTest = async (filePaths: any, blowfishKeyPath: any) => {
  try {
    let result = '';
    let error = '';
    let stdout = '';
    let start;
    let stop;
    const [fileName, fileExtension] = filePaths.split('.');
    const encryptedFilePath = `${fileName}-encrypted.${fileExtension || ''}`;


    // console.log(
    //   `Encrypt file: openssl enc -bf-cbc -in ${filePaths} -out ${encryptedFilePath} -pass file:${blowfishKeyPath} -provider legacy -provider default`
    // );
    await execPromise(
      `date +%s%3N && openssl enc -bf-cbc -in ${filePaths} -out ${encryptedFilePath} -pass file:${blowfishKeyPath} -provider legacy -provider default && date +%s%3N`
    )
      .then((res) => {
        [start, stop] = res.split('\n');
        stdout = res;
        result = 'Encrypt file:Done';
      })
      .catch((err) => {
        console.log('Encrypt file:Failed');
        console.log(err);
        error = err;
      });

    //@ts-ignore
    const encryptTime = parseInt(stop) - parseInt(start);

    return { encryptedFilePath, result, error, stdout, encryptTime };
  } catch (error: any) {
    return { result: '', error: error, stdout: '' };
  }
};

// decrypt file with blowfish test
export const decryptBlowfishTest = async (filePaths: any, blowfishKeyPath: any) => {
  try {
    let result = '';
    let error = '';
    let stdout = '';
    let start;
    let stop;
    const [fileName, fileExtension] = filePaths.split('.');
    const decryptedFilePath = `${fileName}-decrypted.${fileExtension || ''}`;

    // console.log(
    //   `Decrypt file: openssl enc -bf-cbc -d -in ${filePaths} -out ${decryptedFilePath} -pass file:${blowfishKeyPath} -provider legacy -provider default`
    // );
    await execPromise(
      `date +%s%3N && openssl enc -bf-cbc -d -in ${filePaths} -out ${decryptedFilePath} -pass file:${blowfishKeyPath} -provider legacy -provider default && date +%s%3N`
    )
      .then((res) => {
        [start, stop] = res.split('\n');
        stdout = res;
        result = 'Decrypt file:Done';
      })
      .catch((err) => {
        console.log('Decrypt file:Failed');
        console.log(err);
        error = err;
      });

    //@ts-ignore
    const decryptTime = parseInt(stop) - parseInt(start);

    return { decryptedFilePath, result, error, stdout, decryptTime };
  } catch (error: any) {
    return { result: '', error: error, stdout: '' };
  }
};

//encrypt file with aes test
export const encryptAesTest = async (filePaths: any, aesKeyPath: any) => {
  try {
    let result = '';
    let error = '';
    let stdout = '';
    let start;
    let stop;
    const [fileName, fileExtension] = filePaths.split('.');
    const encryptedFilePath = `${fileName}-encrypted.${fileExtension || ''}`;

    // console.log(
    //   `Encrypt file: openssl enc -aes-256-cbc -in ${filePaths} -out ${encryptedFilePath} -pass file:${aesKeyPath} -provider legacy -provider default`
    // );
    await execPromise(
      `date +%s%3N && OPENSSL_ia32cap="~0x200000200000000" openssl enc -aes-256-cbc -in ${filePaths} -out ${encryptedFilePath} -pass file:${aesKeyPath} -provider legacy -provider default && date +%s%3N`
    )
      .then((res) => {
        [start, stop] = res.split('\n');
        stdout = res;
        result = 'Encrypt file:Done';
      })
      .catch((err) => {
        console.log('Encrypt file:Failed');
        console.log(err);
        error = err;
      });

    //@ts-ignore
    const encryptTime = parseInt(stop) - parseInt(start);

    return { encryptedFilePath, result, error, stdout, encryptTime };
  } catch (error: any) {
    return { result: '', error: error, stdout: '' };
  }
};

//decrypt file with aes test
export const decryptAesTest = async (filePaths: any, aesKeyPath: any) => {
  try {
    let result = '';
    let error = '';
    let stdout = '';
    let start;
    let stop;
    const [fileName, fileExtension] = filePaths.split('.');
    const decryptedFilePath = `${fileName}-decrypted.${fileExtension || ''}`;

    // console.log(
    //   `Decrypt file: openssl enc -aes-256-cbc -d -in ${filePaths} -out ${decryptedFilePath} -pass file:${aesKeyPath} -provider legacy -provider default`
    // );
    await execPromise(
      `date +%s%3N && OPENSSL_ia32cap="~0x200000200000000" openssl enc -aes-256-cbc -d -in ${filePaths} -out ${decryptedFilePath} -pass file:${aesKeyPath} -provider legacy -provider default && date +%s%3N`
    )
      .then((res) => {
        [start, stop] = res.split('\n');
        stdout = res;
        result = 'Decrypt file:Done';
      })
      .catch((err) => {
        console.log('Decrypt file:Failed');
        console.log(err);
        error = err;
      });

    //@ts-ignore
    const decryptTime = parseInt(stop) - parseInt(start);

    return { decryptedFilePath, result, error, stdout, decryptTime };
  } catch (error: any) {
    return { result: '', error: error, stdout: '' };
  }
};