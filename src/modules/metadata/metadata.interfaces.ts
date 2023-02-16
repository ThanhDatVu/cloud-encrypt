import mongoose, { Model, Document } from 'mongoose';
import { QueryResult } from '../paginate/paginate';
import { AccessAndRefreshTokens } from '../token/token.interfaces';

export interface IMetadata {
  name: string;
  email: string;
  password: string;
  role: string;
  isEmailVerified: boolean;
}

export interface IMetadataDoc extends IMetadata, Document {
  isPasswordMatch(password: string): Promise<boolean>;
}

export interface IMetadataModel extends Model<IMetadataDoc> {
  isEmailTaken(email: string, excludeMetadataId?: mongoose.Types.ObjectId): Promise<boolean>;
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
}

export type UpdateMetadataBody = Partial<IMetadata>;

export type NewRegisteredMetadata = Omit<IMetadata, 'role' | 'isEmailVerified'>;

export type NewCreatedMetadata = Omit<IMetadata, 'isEmailVerified'>;

export interface IMetadataWithTokens {
  metadata: IMetadataDoc;
  tokens: AccessAndRefreshTokens;
}
