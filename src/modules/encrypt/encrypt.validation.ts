import Joi from 'joi';
import { password, objectId } from '../validate/custom.validation';
import { NewCreatedEncrypt } from './encrypt.interfaces';

const createEncryptBody: Record<keyof NewCreatedEncrypt, any> = {
  email: Joi.string().required().email(),
  password: Joi.string().required().custom(password),
  name: Joi.string().required(),
  role: Joi.string().required().valid('user', 'admin'),
};

export const createEncrypt = {
  body: Joi.object().keys(createEncryptBody),
};

export const getEncrypts = {
  query: Joi.object().keys({
    name: Joi.string(),
    role: Joi.string(),
    sortBy: Joi.string(),
    projectBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

export const getEncrypt = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

export const updateEncrypt = {
  params: Joi.object().keys({
    userId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      email: Joi.string().email(),
      password: Joi.string().custom(password),
      name: Joi.string(),
    })
    .min(1),
};

export const deleteEncrypt = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};
