import httpStatus from 'http-status';
import mongoose from 'mongoose';
import Encrypt from './encrypt.model';
import ApiError from '../errors/ApiError';
import { IOptions, QueryResult } from '../paginate/paginate';
import { NewCreatedEncrypt, UpdateEncryptBody, IEncryptDoc, NewRegisteredEncrypt } from './encrypt.interfaces';
import { exec, execSync } from 'child_process';
import { execPromise } from '../utils';

/**
 * Create a encrypt
 * @param {NewCreatedEncrypt} encryptBody
 * @returns {Promise<IEncryptDoc>}
 */
export const createEncrypt = async (encryptBody: NewCreatedEncrypt): Promise<IEncryptDoc> => {
  if (await Encrypt.isEmailTaken(encryptBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  return Encrypt.create(encryptBody);
};

/**
 * Register a encrypt
 * @param {NewRegisteredEncrypt} encryptBody
 * @returns {Promise<IEncryptDoc>}
 */
export const registerEncrypt = async (encryptBody: NewRegisteredEncrypt): Promise<IEncryptDoc> => {
  if (await Encrypt.isEmailTaken(encryptBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  return Encrypt.create(encryptBody);
};

/**
 * Query for encrypts
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
export const queryEncrypts = async (filter: Record<string, any>, options: IOptions): Promise<QueryResult> => {
  const encrypts = await Encrypt.paginate(filter, options);
  return encrypts;
};

/**
 * Get encrypt by id
 * @param {mongoose.Types.ObjectId} id
 * @returns {Promise<IEncryptDoc | null>}
 */
export const getEncryptById = async (id: mongoose.Types.ObjectId): Promise<IEncryptDoc | null> => Encrypt.findById(id);

/**
 * Get encrypt by email
 * @param {string} email
 * @returns {Promise<IEncryptDoc | null>}
 */
export const getEncryptByEmail = async (email: string): Promise<IEncryptDoc | null> => Encrypt.findOne({ email });

/**
 * Update encrypt by id
 * @param {mongoose.Types.ObjectId} encryptId
 * @param {UpdateEncryptBody} updateBody
 * @returns {Promise<IEncryptDoc | null>}
 */
export const updateEncryptById = async (
  encryptId: mongoose.Types.ObjectId,
  updateBody: UpdateEncryptBody
): Promise<IEncryptDoc | null> => {
  const encrypt = await getEncryptById(encryptId);
  if (!encrypt) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Encrypt not found');
  }
  if (updateBody.email && (await Encrypt.isEmailTaken(updateBody.email, encryptId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  Object.assign(encrypt, updateBody);
  await encrypt.save();
  return encrypt;
};

/**
 * Delete encrypt by id
 * @param {mongoose.Types.ObjectId} encryptId
 * @returns {Promise<IEncryptDoc | null>}
 */
export const deleteEncryptById = async (encryptId: mongoose.Types.ObjectId): Promise<IEncryptDoc | null> => {
  const encrypt = await getEncryptById(encryptId);
  if (!encrypt) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Encrypt not found');
  }
  await encrypt.remove();
  return encrypt;
};

/**
 * Generate a new Blowfish key
 * @returns {Promise<string>}
 */
export const generateBlowfishKey = async (): Promise<string> => {
  const KEY_LENGTH = 128; // TODO: move to config
  let key = '';
  exec(`openssl rand -base64 ${KEY_LENGTH}`, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      key = stderr;
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
  return key;
};
/**
 * Use Blowfish encryption to encrypt a file with key from a file in openssl 3.0.0
 * @params {string} keyFile
 * @params {string} inputFile
 * @params {string} outputFile
 * @returns {Promise<string>}
 */
export const encryptBlowfish = async (keyFile: string, inputFile: string, outputFile: string): Promise<string> => {
  let result = '';
  await execPromise(`cat ${keyFile}`)
    .then((res) => {
      console.log("sharedSecretExists:Done");
      console.log("res",res);
    })
    .catch((err) => {
      console.log("sharedSecretExists:Failed");
      console.log(err);
    });

  // exec(
  //   `openssl enc -e -bf -in ${inputFile} -out ${outputFile} -k $(cat ${keyFile}) -provider legacy -provider default`,
  //   (error, stdout, stderr) => {
  //     if (error) {
  //       console.log(`error: ${error.message}`);
  //       return;
  //     }
  //     if (stderr) {
  //       console.log(`stderr: ${stderr}`);
  //       result = stderr;
  //       return;
  //     }
  //     console.log(`stdout: ${stdout}`);
  //   }
  // );
  await execPromise(`openssl enc -e -bf -in ${inputFile} -out ${outputFile} -k $(cat ${keyFile}) -provider legacy -provider default`)
    .then((res) => {
      console.log("encryptBlowfish:Done");
      console.log("res",res);
    })
    .catch((err) => {
      console.log("encryptBlowfish:Failed");
      console.log(err);
    });
  return result;
};

/**
 * Use Blowfish encryption to decrypt a file in openssl 3.0.0
 * @params {string} keyFile: key file of the encrypted file
 * @params {string} inputFile: file to be decrypted
 * @params {string} outputFile: file to be saved
 * @returns {Promise<string>}
 */
export const decryptBlowfish = async (keyFile: string, inputFile: string, outputFile: string): Promise<string> => {
  let result = '';
  // keyFile = 'private.pem';
  // exec(
  //   `openssl enc -d -bf -in ${inputFile} -out ${outputFile} -k $(cat ${keyFile}) -provider legacy -provider default`,
  //   (error, stdout, stderr) => {
  //     if (error) {
  //       console.log(`error: ${error.message}`);
  //       return;
  //     }
  //     if (stderr) {
  //       console.log(`stderr: ${stderr}`);
  //       result = stderr;
  //       return;
  //     }
  //     console.log(`stdout: ${stdout}`);
  //   }
  // );
  await execPromise(`openssl enc -d -bf -in ${inputFile} -out ${outputFile} -k $(cat ${keyFile}) -provider legacy -provider default`)
    .then((res) => {
      console.log("decryptBlowfish:Done");
      console.log("res",res);
    })
    .catch((err) => {
      console.log("decryptBlowfish:Failed");
      console.log(err);
    });
  return result;
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
export const signECDSA = async (string: string, keyFile: string): Promise<string> => {
  const signatureFolder = process.env['SIGNATURE_FOLDER'] || 'signatures';
  console.log(
    `echo ${string} | openssl dgst -sha256 -sign ${keyFile} -out ${signatureFolder}signature.bin -provider legacy -provider default`
  );
  let result = '';
  execPromise(`echo ${string} |
  openssl dgst -sha256 -sign ${keyFile} -out ${signatureFolder}signature.bin -provider legacy -provider default`)
  .then((res) => {
    console.log("signECDSA:Done");
    console.log("res",res);
    result = res;
  })
  .catch((err) => {
    console.log("signECDSA:Failed");
    console.log(err);
    result = err;
  });
  ;
  //    (error, stdout, stderr) => {
  //   if (error) {
  //     console.log(`error: ${error.message}`);
  //     return;
  //   }
  //   if (stderr) {
  //     console.log(`stderr: ${stderr}`);
  //     result = stderr;
  //     return;
  //   }
  //   console.log(`stdout signature: ${stdout}`);
  // }
  return result.toString();
};

/**
 * Use openSSL ecdsa to verify a signature
 * @params {string} string to be verified
 * @params {string} signatureFile: signature to be verified
 * @params {string} keyFile: key file of the public key
 * @returns {Promise<string>} signature
 * @returns {Promise<boolean>} true if verified, false otherwise
 * @returns {Promise<string>} error message if any
 * @returns {Promise<string>} stdout if any
 */
export const verifyECDSA = async (
  string: string,
  signatureFile: string,
  publicKeyFile: string
): Promise<[string, string, string]> => {
  try {
    let result = '';
    const signatureFolder = process.env['SIGNATURE_FOLDER'] || 'signatures';
    let verified;
    console.log(
      `echo ${string} | openssl dgst -sha256 -verify ${publicKeyFile} -signature ${signatureFolder}${signatureFile}`
    );
    verified = execSync(
      `echo ${string} |
    openssl dgst -sha256 -verify ${publicKeyFile} -signature ${signatureFolder}${signatureFile}`,
      {
        encoding: 'utf8',
      }
      // , (error, stdout, stderr) => {
      // if (error) {
      //   console.log(`error: ${error.message}`);
      //   result = error.message;
      //   return;
      // }
      // if (stderr) {
      //   console.log(`stderr: ${stderr}`);
      //   result = stderr;
      //   return;
      // }
      // console.log(`stdout verify: ${stdout}`);
      // verified = true;
      // result = stdout;
      // }
    );

    const verifyCheck = verified.toString();
    //@ts-ignore
    return [verifyCheck, result, ''];
  } catch (error: any) {
    console.log(error);
    return [error.stdout, '', "Can't verify signature"];
  }
};

/**
 * Use openSSL ecdsa to encrypt a file
  * @param {string} inputFile: file to be encrypted
  * @param {string} outputFile: file to be saved
  * @param {string} keyFile: key file of the public key
  * @returns {Promise<string>}
  * @returns {Promise<string>} stdout if any
  * @returns {Promise<string>} error message if any
 */
export const encryptECDSA = async (
  inputFile: string,
  outputFile: string,
  publicKeyFile: string
): Promise<{
  result: string;
  stdout: string;
  error: string;
}> => {
  try {
    let result = '';
    let stdout = '';
    let error = '';
    console.log(
      `openssl enc -e -aes-256-ofb -in ${inputFile} -out ${outputFile} -k $(cat ${publicKeyFile}) -provider legacy -provider default`
    );
    execPromise(
      `openssl enc -e -aes-256-ofb -in ${inputFile} -out ${outputFile} -k $(cat ${publicKeyFile}) -provider legacy -provider default`
    )
      .then((res) => {
        console.log("encryptECDSA:Done");
        console.log("res",res);
        stdout = res;
      }
      )
      .catch((err) => {
        console.log("encryptECDSA:Failed");
        console.log(err);
        error = err;
      }
      );
    return { result, stdout, error };
  }
  catch (error: any) {
    console.log(error);
    return { result: '', stdout: '', error: error };
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
  tempPrivateKeyFile: string,
  ): Promise<{
    result: any,
    publicFileKeyPath: any, 
    error: any, 
    stdout: any
  }> => {
  try {
    const signatureFolder = process.env['SIGNATURE_FOLDER'] || 'signatures';
    const symKeyFolder = process.env['SYM_KEY_FOLDER'] || 'keys/sym/';
    const asymKeyFolder = process.env['ASYM_KEY_FOLDER'] || 'keys/asym/';
    const tempPublicKeyFile = tempPrivateKeyFile + '.pub';
    const privateFileKeyPath = asymKeyFolder + tempPrivateKeyFile;
    const publicFileKeyPath = privateFileKeyPath + ".pub";
    const sharedSecretPath = symKeyFolder + tempPrivateKeyFile + ".secret";

    console.log("privateFileKeyPath",privateFileKeyPath);
    console.log("publicFileKeyPath",publicFileKeyPath);
    let result = '';
    let error = '';
    let stdout = '';


    console.log(`Generate File Private Emphamel Key: openssl ecparam -name secp256k1 -genkey -noout -out ${privateFileKeyPath}`);
    await execPromise(`openssl ecparam -name secp256k1 -genkey -noout -out ${privateFileKeyPath}`)

    console.log(`Generate File Public Key: openssl pkey -in ${privateFileKeyPath} -pubout -out ${publicFileKeyPath}`);
    await execPromise(`openssl pkey -in ${privateFileKeyPath} -pubout -out ${publicFileKeyPath}`)
      .then((res) => {
        console.log("ecdhKeyExchange:Done");
        console.log("res",res);
        stdout = res;
      }
      )
      .catch((err) => {
        console.log("ecdhKeyExchange:Failed");
        console.log(err);
        error = err;
      }
      );

    console.log(`Calculate shared secret: openssl pkeyutl -derive -inkey ${privateFileKeyPath} -peerkey ${systemPublicKeyFile} -out ${sharedSecretPath}`);
    await execPromise(`openssl pkeyutl -derive -inkey ${privateFileKeyPath} -peerkey ${systemPublicKeyFile} -out ${sharedSecretPath}`)
      .then((res) => {
        console.log("ecdhKeyExchange:Done");
        console.log("res",res);
        stdout = res;
      }
      )
      .catch((err) => {
        console.log("ecdhKeyExchange:Failed");
        console.log(err);
        error = err;
      }
      );  
    const data = {
      result,
      publicFileKeyPath, 
      error, 
      stdout
    };
    return data;
  }
  catch (error: any) {
    console.log(error);
    return { result: '', publicFileKeyPath: '', error: error, stdout: '' };
  }
};

