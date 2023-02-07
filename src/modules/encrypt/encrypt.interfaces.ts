import mongoose, { Model, Document } from 'mongoose';
import { QueryResult } from '../paginate/paginate';
import { AccessAndRefreshTokens } from '../token/token.interfaces';

export interface IEncrypt {
  name: string;
  email: string;
  password: string;
  role: string;
  isEmailVerified: boolean;
}

export interface IEncryptDoc extends IEncrypt, Document {
  isPasswordMatch(password: string): Promise<boolean>;
}

export interface IEncryptModel extends Model<IEncryptDoc> {
  isEmailTaken(email: string, excludeEncryptId?: mongoose.Types.ObjectId): Promise<boolean>;
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
}

export type UpdateEncryptBody = Partial<IEncrypt>;

export type NewRegisteredEncrypt = Omit<IEncrypt, 'role' | 'isEmailVerified'>;

export type NewCreatedEncrypt = Omit<IEncrypt, 'isEmailVerified'>;

export interface IEncryptWithTokens {
  user: IEncryptDoc;
  tokens: AccessAndRefreshTokens;
}
