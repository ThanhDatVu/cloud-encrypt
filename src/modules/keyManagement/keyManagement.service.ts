import httpStatus from 'http-status';
import mongoose from 'mongoose';
import KeyManagement from './keyManagement.model';
import ApiError from '../errors/ApiError';
import { IOptions, QueryResult } from '../paginate/paginate';
import { NewCreatedKeyManagement, UpdateKeyManagementBody, IKeyManagementDoc, NewRegisteredKeyManagement } from './keyManagement.interfaces';
import { exec } from 'child_process';
import { execPromise } from '../utils';

/**
 * Create a keyManagement
 * @param {NewCreatedKeyManagement} keyManagementBody
 * @returns {Promise<IKeyManagementDoc>}
 */
export const createKeyManagement = async (keyManagementBody: NewCreatedKeyManagement): Promise<IKeyManagementDoc> => {
  if (await KeyManagement.isEmailTaken(keyManagementBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  return KeyManagement.create(keyManagementBody);
};

/**
 * Register a keyManagement
 * @param {NewRegisteredKeyManagement} keyManagementBody
 * @returns {Promise<IKeyManagementDoc>}
 */
export const registerKeyManagement = async (keyManagementBody: NewRegisteredKeyManagement): Promise<IKeyManagementDoc> => {
  if (await KeyManagement.isEmailTaken(keyManagementBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  return KeyManagement.create(keyManagementBody);
};

/**
 * Query for keyManagements
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
export const queryKeyManagements = async (filter: Record<string, any>, options: IOptions): Promise<QueryResult> => {
  const keyManagements = await KeyManagement.paginate(filter, options);
  return keyManagements;
};

/**
 * Get keyManagement by id
 * @param {mongoose.Types.ObjectId} id
 * @returns {Promise<IKeyManagementDoc | null>}
 */
export const getKeyManagementById = async (id: mongoose.Types.ObjectId): Promise<IKeyManagementDoc | null> => KeyManagement.findById(id);

/**
 * Get keyManagement by email
 * @param {string} email
 * @returns {Promise<IKeyManagementDoc | null>}
 */
export const getKeyManagementByEmail = async (email: string): Promise<IKeyManagementDoc | null> => KeyManagement.findOne({ email });

/**
 * Update keyManagement by id
 * @param {mongoose.Types.ObjectId} keyManagementId
 * @param {UpdateKeyManagementBody} updateBody
 * @returns {Promise<IKeyManagementDoc | null>}
 */
export const updateKeyManagementById = async (
  keyManagementId: mongoose.Types.ObjectId,
  updateBody: UpdateKeyManagementBody
): Promise<IKeyManagementDoc | null> => {
  const keyManagement = await getKeyManagementById(keyManagementId);
  if (!keyManagement) {
    throw new ApiError(httpStatus.NOT_FOUND, 'KeyManagement not found');
  }
  if (updateBody.email && (await KeyManagement.isEmailTaken(updateBody.email, keyManagementId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  Object.assign(keyManagement, updateBody);
  await keyManagement.save();
  return keyManagement;
};

/**
 * Delete keyManagement by id
 * @param {mongoose.Types.ObjectId} keyManagementId
 * @returns {Promise<IKeyManagementDoc | null>}
 */
export const deleteKeyManagementById = async (keyManagementId: mongoose.Types.ObjectId): Promise<IKeyManagementDoc | null> => {
  const keyManagement = await getKeyManagementById(keyManagementId);
  if (!keyManagement) {
    throw new ApiError(httpStatus.NOT_FOUND, 'KeyManagement not found');
  }
  await keyManagement.remove();
  return keyManagement;
};

/**
 * Generate a new Blowfish key and save it to a file
 * @param {String} fileName: name of the file to save the key
 * @returns {Promise<string>}
 */
export const generateBlowfishKey = async (fileName: String = 'blowfish.keyy'): Promise<string> => {
  let result = '';
  const symKeyFolder = process.env['SYM_KEY_FOLDER']; 
  // implement emeral ecdh to generate a new Blowfish key
  
  await execPromise(`openssl rand -base64 32 > ${symKeyFolder}${fileName}`).then((stdout) => {
    console.log(`stdout: ${stdout}`);
    result = stdout;
  }).catch((error) => {
    console.log(`error: ${error.message}`);
    result = error.message;
  });
  return result;
};


/**
 * Generate a new ECDSA key pair and save it to 2 files
 * @returns {Promise<string>}
 */
export const generateECDSAKeyPair = async (): Promise<string> => {
  let result = '';
  const asymKeyFolder = process.env['ASYM_KEY_FOLDER']; 
  execPromise(`openssl ecparam -genkey -name secp256k1 -out ${asymKeyFolder}private.pem`)
  .then((stdout) => {
    console.log(`stdout: ${stdout}`);
    result = stdout;
  }).catch((error) => {
    console.log(`error: ${error.message}`);
    result = error.message;
  });
  execPromise(`openssl ec -in ${asymKeyFolder}private.pem -pubout -out ${asymKeyFolder}public.pem`)
  .then((stdout) => {
    console.log(`stdout: ${stdout}`);
    result = stdout;
  }).catch((error) => {
    console.log(`error: ${error.message}`);
    result = error.message;
  });
  
  return result;
}

/**
 * Generate a new RSA key pair and save it to 2 files
 * @returns {Promise<string>}
 */
export const generateRSAKeyPair = async (keySize: number = 2048): Promise<string> => {
  let result = '';
  const asymKeyFolder = process.env['ASYM_KEY_FOLDER']; 
  const privateKeyPath = `${asymKeyFolder}private-rsa.pem`;
  const publicKeyPath = `${asymKeyFolder}public-rsa.pem`;
  console.log(`Generating RSA key pair with size ${keySize}...`)
  console.log(`Command: openssl genrsa -out ${privateKeyPath} ${keySize}`)
  await execPromise(`openssl genrsa -out ${privateKeyPath} ${keySize}`)
  .then((stdout) => {
    console.log(`stdout: ${stdout}`);
    result = stdout;
  }).catch((error) => {
    console.log(`error: ${error.message}`);
    result = error.message;
  });
  console.log(`Command: openssl rsa -in ${privateKeyPath} -pubout -out ${publicKeyPath}`)
  await execPromise(`openssl rsa -in ${privateKeyPath} -pubout -out ${publicKeyPath}`)
  .then((stdout) => {
    console.log(`stdout: ${stdout}`);
    result = stdout;
  }).catch((error) => {
    console.log(`error: ${error.message}`);
    result = error.message;
  });
  
  return result;
}

