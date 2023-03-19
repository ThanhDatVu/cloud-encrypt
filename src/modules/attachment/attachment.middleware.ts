import multer from 'multer';
import * as path from 'path';
import { toSlug } from './attachment.interfaces';
import { NextFunction, Request, Response } from 'express';
import { ALL_FILE_TYPES } from './attachment.interfaces';
import ApiError from '../errors/ApiError';
import httpStatus from 'http-status';
import pkg from 'uuid';
const { v4: uuidv4 } = pkg;

export const maxUploadFileSize = 400 * 1024 * 1024;
const imagesFolder: string = process.env['IMAGES_FOLDER'] || 'images';
export const storageFile = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, imagesFolder)
  },
  filename: function (req, file, cb) {
    console.log("path.extname(req.files.logo.name)", path.extname(file.originalname))
    const extname = path.extname(file.originalname);
    const fileName = file.originalname.slice(0, file.originalname.lastIndexOf(extname))
    console.log("fileName", fileName)
    const slug = `${uuidv4().toString()}-${toSlug(fileName)}${extname}`;
    console.log("slug", slug)
    cb(null, slug)
  }
})

const uploadFile = multer({
  storage: storageFile,
  limits: { fileSize: maxUploadFileSize },
  fileFilter(req, file, callback) {
    const fileExtension = path.extname(file.originalname).toLowerCase().replace(".", "");
    const fileExtensionValid: boolean = Object.keys(ALL_FILE_TYPES).indexOf(fileExtension) >= 0;

    if (fileExtensionValid) {
      return callback(null, true);
    }
    callback(new Error(`Invalid file type. Only picture file on type ${Object.keys(ALL_FILE_TYPES).join(", ")} are allowed!`));
  },
}).array('files', 10);

export const handleSingleUploadFile = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  uploadFile(req, res, (error) => {
    if (error) {
      return next(new ApiError(httpStatus.BAD_GATEWAY, error.message))
    }
    next()
  });
};

