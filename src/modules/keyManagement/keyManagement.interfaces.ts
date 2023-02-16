import mongoose, { Model, Document } from 'mongoose';
import { QueryResult } from '../paginate/paginate';
import { AccessAndRefreshTokens } from '../token/token.interfaces';

export interface IKeyManagement {
  name: string;
  email: string;
  password: string;
  role: string;
  isEmailVerified: boolean;
}

export interface IKeyManagementDoc extends IKeyManagement, Document {
  isPasswordMatch(password: string): Promise<boolean>;
}

export interface IKeyManagementModel extends Model<IKeyManagementDoc> {
  isEmailTaken(email: string, excludeKeyManagementId?: mongoose.Types.ObjectId): Promise<boolean>;
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
}

export type UpdateKeyManagementBody = Partial<IKeyManagement>;

export type NewRegisteredKeyManagement = Omit<IKeyManagement, 'role' | 'isEmailVerified'>;

export type NewCreatedKeyManagement = Omit<IKeyManagement, 'isEmailVerified'>;

export interface IKeyManagementWithTokens {
  encrypt: IKeyManagementDoc;
  tokens: AccessAndRefreshTokens;
}
