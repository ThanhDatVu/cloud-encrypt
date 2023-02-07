import httpStatus from 'http-status';
import mongoose from 'mongoose';
import Encrypt from './encrypt.model';
import ApiError from '../errors/ApiError';
import { IOptions, QueryResult } from '../paginate/paginate';
import { NewCreatedEncrypt, UpdateEncryptBody, IEncryptDoc, NewRegisteredEncrypt } from './encrypt.interfaces';

/**
 * Create a user
 * @param {NewCreatedEncrypt} userBody
 * @returns {Promise<IEncryptDoc>}
 */
export const createEncrypt = async (userBody: NewCreatedEncrypt): Promise<IEncryptDoc> => {
  if (await Encrypt.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  return Encrypt.create(userBody);
};

/**
 * Register a user
 * @param {NewRegisteredEncrypt} userBody
 * @returns {Promise<IEncryptDoc>}
 */
export const registerEncrypt = async (userBody: NewRegisteredEncrypt): Promise<IEncryptDoc> => {
  if (await Encrypt.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  return Encrypt.create(userBody);
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
export const queryEncrypts = async (filter: Record<string, any>, options: IOptions): Promise<QueryResult> => {
  const users = await Encrypt.paginate(filter, options);
  return users;
};

/**
 * Get user by id
 * @param {mongoose.Types.ObjectId} id
 * @returns {Promise<IEncryptDoc | null>}
 */
export const getEncryptById = async (id: mongoose.Types.ObjectId): Promise<IEncryptDoc | null> => Encrypt.findById(id);

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<IEncryptDoc | null>}
 */
export const getEncryptByEmail = async (email: string): Promise<IEncryptDoc | null> => Encrypt.findOne({ email });

/**
 * Update user by id
 * @param {mongoose.Types.ObjectId} userId
 * @param {UpdateEncryptBody} updateBody
 * @returns {Promise<IEncryptDoc | null>}
 */
export const updateEncryptById = async (
  userId: mongoose.Types.ObjectId,
  updateBody: UpdateEncryptBody
): Promise<IEncryptDoc | null> => {
  const user = await getEncryptById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Encrypt not found');
  }
  if (updateBody.email && (await Encrypt.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  Object.assign(user, updateBody);
  await user.save();
  return user;
};

/**
 * Delete user by id
 * @param {mongoose.Types.ObjectId} userId
 * @returns {Promise<IEncryptDoc | null>}
 */
export const deleteEncryptById = async (userId: mongoose.Types.ObjectId): Promise<IEncryptDoc | null> => {
  const user = await getEncryptById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Encrypt not found');
  }
  await user.remove();
  return user;
};
