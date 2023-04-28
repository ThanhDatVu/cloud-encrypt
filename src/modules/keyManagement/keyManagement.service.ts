import httpStatus from 'http-status';
import mongoose from 'mongoose';
import KeyManagement from './keyManagement.model';
import ApiError from '../errors/ApiError';
import { IOptions, QueryResult } from '../paginate/paginate';
import {
  NewCreatedKeyManagement,
  UpdateKeyManagementBody,
  IKeyManagementDoc,
  NewRegisteredKeyManagement,
} from './keyManagement.interfaces';
import { exec } from 'child_process';
import { execPromise } from '../utils';


/**
 * Generate a new Blowfish key and save it to a file
 * @param {String} fileName: name of the file to save the key
 * @param {number} keySize: size of the key in bits
 * @returns {Promise<string>}
 */
export const generateBlowfishKey = async (keySize?: number) => {
  let result = '';
  const DEFAULT_KEY_SIZE = 256;
  const symKeyFolder = process.env['SYM_KEY_FOLDER'];
  const keyPath = `${symKeyFolder}blowfish${keySize || ''}.key`;
  // implement emeral ecdh to generate a new Blowfish key

  await execPromise(`openssl rand -base64 ${(keySize || DEFAULT_KEY_SIZE) / 8} > ${keyPath}`)
    .then((stdout) => {
      console.log(`stdout: ${stdout}`);
      result = stdout;
    })
    .catch((error) => {
      console.log(`error: ${error.message}`);
      result = error.message;
    });
  return { keyPath };
};

/**
 * Generate a new ECDSA key pair and save it to 2 files
 * @returns {Promise<string>}
 */
export const generateECDSAKeyPair = async () => {
  let result = '';
  const asymKeyFolder = process.env['ASYM_KEY_FOLDER'];
  execPromise(`openssl ecparam -genkey -name secp256k1 -out ${asymKeyFolder}private.pem`)
    .then((stdout) => {
      console.log(`stdout: ${stdout}`);
      result = stdout;
    })
    .catch((error) => {
      console.log(`error: ${error.message}`);
      result = error.message;
    });
  execPromise(`openssl ec -in ${asymKeyFolder}private.pem -pubout -out ${asymKeyFolder}public.pem`)
    .then((stdout) => {
      console.log(`stdout: ${stdout}`);
      result = stdout;
    })
    .catch((error) => {
      console.log(`error: ${error.message}`);
      result = error.message;
    });

  return {
    privateKey: `${asymKeyFolder}private.pem`,
    publicKey: `${asymKeyFolder}public.pem`,
  };
};

/**
 * Generate a new RSA key pair and save it to 2 files
 * @returns {Promise<string>}
 */
export const generateRSAKeyPair = async (keySize: number) => {
  let result = '';
  const DEFAULT_KEY_SIZE = 2048;
  const asymKeyFolder = process.env['ASYM_KEY_FOLDER'];
  const privateKeyPath = `${asymKeyFolder}private-rsa${keySize || ''}.pem`;
  const publicKeyPath = `${asymKeyFolder}public-rsa${keySize || ''}.pem`;
  console.log(`Generating RSA key pair with size ${keySize || DEFAULT_KEY_SIZE}...`);
  console.log(`Command: openssl genrsa -out ${privateKeyPath} ${keySize || DEFAULT_KEY_SIZE}`);
  await execPromise(`openssl genrsa -out ${privateKeyPath} ${keySize || DEFAULT_KEY_SIZE}`)
    .then((stdout) => {
      console.log(`stdout: ${stdout}`);
      result = stdout;
    })
    .catch((error) => {
      console.log(`error: ${error.message}`);
      result = error.message;
    });
  console.log(`Command: openssl rsa -in ${privateKeyPath} -pubout -out ${publicKeyPath}`);
  await execPromise(`openssl rsa -in ${privateKeyPath} -pubout -out ${publicKeyPath}`)
    .then((stdout) => {
      console.log(`stdout: ${stdout}`);
      result = stdout;
    })
    .catch((error) => {
      console.log(`error: ${error.message}`);
      result = error.message;
    });

  return {
    privateKeyPath,
    publicKeyPath,
  };
};
