import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import toJSON from '../toJSON/toJSON';
import paginate from '../paginate/paginate';
import { roles } from '../../config/roles';
import { IMetadataDoc, IMetadataModel } from './metadata.interfaces';

const metadataSchema = new mongoose.Schema<IMetadataDoc, IMetadataModel>(
  {
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    hashValue: {
      type: String,
      required: true,
      trim: true,
    },
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
      default: 'metadata',
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
metadataSchema.plugin(toJSON);
metadataSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The metadata's email
 * @param {ObjectId} [excludeMetadataId] - The id of the metadata to be excluded
 * @returns {Promise<boolean>}
 */
metadataSchema.static('isEmailTaken', async function (email: string, excludeMetadataId: mongoose.ObjectId): Promise<boolean> {
  const metadata = await this.findOne({ email, _id: { $ne: excludeMetadataId } });
  return !!metadata;
});

/**
 * Check if password matches the metadata's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
metadataSchema.method('isPasswordMatch', async function (password: string): Promise<boolean> {
  const metadata = this;
  return bcrypt.compare(password, metadata.password);
});

metadataSchema.pre('save', async function (next) {
  const metadata = this;
  if (metadata.isModified('password')) {
    metadata.password = await bcrypt.hash(metadata.password, 8);
  }
  next();
});

const Metadata = mongoose.model<IMetadataDoc, IMetadataModel>('Metadata', metadataSchema);

export default Metadata;
