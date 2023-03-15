import httpStatus from 'http-status';
import mongoose from 'mongoose';
import Metadata from './metadata.model';
import ApiError from '../errors/ApiError';
import { IOptions, QueryResult } from '../paginate/paginate';
import { NewCreatedMetadata, UpdateMetadataBody, IMetadataDoc, NewRegisteredMetadata } from './metadata.interfaces';
// @ts-ignore
import openssl from 'openssl-nodejs';
import { exec } from 'child_process';

/**
 * Create a metadata
 * @param {NewCreatedMetadata} metadataBody
 * @returns {Promise<IMetadataDoc>}
 */
export const createMetadata = async (metadataBody: NewCreatedMetadata): Promise<IMetadataDoc> => {
  return Metadata.create(metadataBody);
};

/**
 * Register a metadata
 * @param {NewRegisteredMetadata} metadataBody
 * @returns {Promise<IMetadataDoc>}
 */
export const registerMetadata = async (metadataBody: NewRegisteredMetadata): Promise<IMetadataDoc> => {
  return Metadata.create(metadataBody);
};

/**
 * Query for metadatas
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
export const queryMetadatas = async (filter: Record<string, any>, options: IOptions): Promise<QueryResult> => {
  const metadatas = await Metadata.paginate(filter, options);
  return metadatas;
};

/**
 * Get metadata by id
 * @param {mongoose.Types.ObjectId} id
 * @returns {Promise<IMetadataDoc | null>}
 */
export const getMetadataById = async (id: mongoose.Types.ObjectId): Promise<IMetadataDoc | null> => Metadata.findById(id);

/**
 * Get metadata by email
 * @param {string} email
 * @returns {Promise<IMetadataDoc | null>}
 */
export const getMetadataByEmail = async (email: string): Promise<IMetadataDoc | null> => Metadata.findOne({ email });

/**
 * Update metadata by id
 * @param {mongoose.Types.ObjectId} metadataId
 * @param {UpdateMetadataBody} updateBody
 * @returns {Promise<IMetadataDoc | null>}
 */
export const updateMetadataById = async (
  metadataId: mongoose.Types.ObjectId,
  updateBody: UpdateMetadataBody
): Promise<IMetadataDoc | null> => {
  const metadata = await getMetadataById(metadataId);
  if (!metadata) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Metadata not found');
  }
  Object.assign(metadata, updateBody);
  await metadata.save();
  return metadata;
};

/**
 * Delete metadata by id
 * @param {mongoose.Types.ObjectId} metadataId
 * @returns {Promise<IMetadataDoc | null>}
 */
export const deleteMetadataById = async (metadataId: mongoose.Types.ObjectId): Promise<IMetadataDoc | null> => {
  const metadata = await getMetadataById(metadataId);
  if (!metadata) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Metadata not found');
  }
  await metadata.remove();
  return metadata;
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
}
/**
 * Use Blowfish metadataion to metadata a file with key from a file
 * @params {string} keyFile
 * @params {string} inputFile
 * @params {string} outputFile
 * @returns {Promise<string>}
 */
export const metadataBlowfish = async (keyFile: string, inputFile: string, outputFile: string): Promise<string> => {
  let result = '';
  exec(`cat ${keyFile}`, (error, stdout, stderr) => {
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
  
  exec(`openssl enc -e -bf -in ${inputFile} -out ${outputFile} -k $(cat ${keyFile})`, (error, stdout, stderr) => {
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

/**
 * Use Blowfish metadataion to decrypt a file
 * @params {string} keyFile: key file of the metadataed file
 * @params {string} inputFile: file to be decrypted
 * @params {string} outputFile: file to be saved
 * @returns {Promise<string>}
 * 
  */
  export const decryptBlowfish = async (keyFile: string, inputFile: string, outputFile: string): Promise<string> => {
    let result = '';
    // keyFile = 'private.pem';
    console.log(`openssl enc -d -bf -in ${inputFile} -out ${outputFile} -k $(cat ${keyFile})`)
    exec(`openssl enc -d -bf -in ${inputFile} -out ${outputFile} -k $(cat ${keyFile})`, (error, stdout, stderr) => {
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


