import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import toJSON from '../toJSON/toJSON';
import paginate from '../paginate/paginate';
import { roles } from '../../config/roles';
import { IEncryptDoc, IEncryptModel } from './encrypt.interfaces';

const encryptSchema = new mongoose.Schema<IEncryptDoc, IEncryptModel>(
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
      default: 'encrypt',
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
encryptSchema.plugin(toJSON);
encryptSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The encrypt's email
 * @param {ObjectId} [excludeEncryptId] - The id of the encrypt to be excluded
 * @returns {Promise<boolean>}
 */
encryptSchema.static('isEmailTaken', async function (email: string, excludeEncryptId: mongoose.ObjectId): Promise<boolean> {
  const encrypt = await this.findOne({ email, _id: { $ne: excludeEncryptId } });
  return !!encrypt;
});

/**
 * Check if password matches the encrypt's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
encryptSchema.method('isPasswordMatch', async function (password: string): Promise<boolean> {
  const encrypt = this;
  return bcrypt.compare(password, encrypt.password);
});

encryptSchema.pre('save', async function (next) {
  const encrypt = this;
  if (encrypt.isModified('password')) {
    encrypt.password = await bcrypt.hash(encrypt.password, 8);
  }
  next();
});

const Encrypt = mongoose.model<IEncryptDoc, IEncryptModel>('Encrypt', encryptSchema);

export default Encrypt;
