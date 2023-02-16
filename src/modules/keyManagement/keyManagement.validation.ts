import Joi from 'joi';
import { password, objectId } from '../validate/custom.validation';
import { NewCreatedKeyManagement } from './keyManagement.interfaces';

const createKeyManagementBody: Record<keyof NewCreatedKeyManagement, any> = {
  email: Joi.string().required().email(),
  password: Joi.string().required().custom(password),
  name: Joi.string().required(),
  role: Joi.string().required().valid('keyManagement', 'admin'),
};

export const createKeyManagement = {
  body: Joi.object().keys(createKeyManagementBody),
};

export const getKeyManagements = {
  query: Joi.object().keys({
    name: Joi.string(),
    role: Joi.string(),
    sortBy: Joi.string(),
    projectBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export const getKeyManagement = {
  params: Joi.object().keys({
    keyManagementId: Joi.string().custom(objectId),
  }),
};

export const updateKeyManagement = {
  params: Joi.object().keys({
    keyManagementId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      email: Joi.string().email(),
      password: Joi.string().custom(password),
      name: Joi.string(),
    })
    .min(1),
};

export const deleteKeyManagement = {
  params: Joi.object().keys({
    keyManagementId: Joi.string().custom(objectId),
  }),
};
