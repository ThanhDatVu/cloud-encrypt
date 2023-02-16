import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import toJSON from '../toJSON/toJSON';
import paginate from '../paginate/paginate';
import { roles } from '../../config/roles';
import { IKeyManagementDoc, IKeyManagementModel } from './keyManagement.interfaces';

const keyManagementSchema = new mongoose.Schema<IKeyManagementDoc, IKeyManagementModel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value: string) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email');
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      validate(value: string) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error('Password must contain at least one letter and one number');
        }
      },
      private: true, // used by the toJSON plugin
    },
    role: {
      type: String,
      enum: roles,
      default: 'keyManagement',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
keyManagementSchema.plugin(toJSON);
keyManagementSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The keyManagement's email
 * @param {ObjectId} [excludeKeyManagementId] - The id of the keyManagement to be excluded
 * @returns {Promise<boolean>}
 */
keyManagementSchema.static('isEmailTaken', async function (email: string, excludeKeyManagementId: mongoose.ObjectId): Promise<boolean> {
  const keyManagement = await this.findOne({ email, _id: { $ne: excludeKeyManagementId } });
  return !!keyManagement;
});

/**
 * Check if password matches the keyManagement's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
keyManagementSchema.method('isPasswordMatch', async function (password: string): Promise<boolean> {
  const keyManagement = this;
  return bcrypt.compare(password, keyManagement.password);
});

keyManagementSchema.pre('save', async function (next) {
  const keyManagement = this;
  if (keyManagement.isModified('password')) {
    keyManagement.password = await bcrypt.hash(keyManagement.password, 8);
  }
  next();
});

const KeyManagement = mongoose.model<IKeyManagementDoc, IKeyManagementModel>('KeyManagement', keyManagementSchema);

export default KeyManagement;
