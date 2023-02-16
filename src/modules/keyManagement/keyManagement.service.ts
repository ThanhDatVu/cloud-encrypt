import httpStatus from 'http-status';
import mongoose from 'mongoose';
import KeyManagement from './keyManagement.model';
import ApiError from '../errors/ApiError';
import { IOptions, QueryResult } from '../paginate/paginate';
import { NewCreatedKeyManagement, UpdateKeyManagementBody, IKeyManagementDoc, NewRegisteredKeyManagement } from './keyManagement.interfaces';
import { exec } from 'child_process';

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
 * @returns {Promise<string>}
 */
export const generateBlowfishKey = async (): Promise<string> => {
  let result = '';
  exec('openssl rand -base64 32 > blowfish.key', (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      result = stderr;
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
  return result;
};


/**
 * Generate a new ECDSA key pair and save it to 2 files
 * @returns {Promise<string>}
 */
export const generateECDSAKeyPair = async (): Promise<string> => {
  let result = '';
  exec('openssl ecparam -genkey -name secp256k1 -out private.pem', (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      result = stderr;
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
  exec('openssl ec -in private.pem -pubout -out public.pem', (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      result = stderr;
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
  return result;
}

