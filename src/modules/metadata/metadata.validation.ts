import Joi from 'joi';
import { password, objectId } from '../validate/custom.validation';
import { NewCreatedMetadata } from './metadata.interfaces';

const createMetadataBody: Record<keyof NewCreatedMetadata, any> = {
  email: Joi.string().required().email(),
  password: Joi.string().required().custom(password),
  name: Joi.string().required(),
  role: Joi.string().required().valid('metadata', 'admin'),
};

export const createMetadata = {
  body: Joi.object().keys(createMetadataBody),
};

export const getMetadatas = {
  query: Joi.object().keys({
    name: Joi.string(),
    role: Joi.string(),
    sortBy: Joi.string(),
    projectBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export const getMetadata = {
  params: Joi.object().keys({
    metadataId: Joi.string().custom(objectId),
  }),
};

export const updateMetadata = {
  params: Joi.object().keys({
    metadataId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      email: Joi.string().email(),
      password: Joi.string().custom(password),
      name: Joi.string(),
    })
    .min(1),
};

export const deleteMetadata = {
  params: Joi.object().keys({
    metadataId: Joi.string().custom(objectId),
  }),
};
