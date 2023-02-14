import httpStatus from 'http-status';
import mongoose from 'mongoose';
import Encrypt from './encrypt.model';
import ApiError from '../errors/ApiError';
import { IOptions, QueryResult } from '../paginate/paginate';
import { NewCreatedEncrypt, UpdateEncryptBody, IEncryptDoc, NewRegisteredEncrypt } from './encrypt.interfaces';
// @ts-ignore
import openssl from 'openssl-nodejs';
import { exec } from 'child_process';

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

  // return key;
}


