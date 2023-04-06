import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { S3 } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
const SPACES_KEY = process.env['SPACES_KEY'] || '';
const SPACES_SECRET = process.env['SPACES_SECRET'] || '';
const SPACES_BUCKET = process.env['SPACES_BUCKET'] || '';
const SPACES_ENDPOINT = process.env['SPACES_ENDPOINT'] || '';
const __dirname = path.resolve();

const s3Client = new S3({
  forcePathStyle: false, // Configures to use subdomain/virtual calling format.
  endpoint: 'https://sgp1.digitaloceanspaces.com',
  region: 'sgp1',
  credentials: {
    accessKeyId: SPACES_KEY,
    secretAccessKey: SPACES_SECRET,
  },
});

const bucketParams = {
  Bucket: SPACES_BUCKET,
  ACL: 'public-read',
};

export const uploadFile = async (fileName: any) => {
  // read content from the file
  const fileBuffer = fs.readFileSync(path.join(__dirname, fileName));
  const params = {
    ...bucketParams,
    Key: fileName, // file name
    Body: fileBuffer,
  };

  const command = new PutObjectCommand(params);
  const data = await s3Client.send(command);
  console.log('upload', data);
  return data;
};

// Function to turn the file's body into a string.
const streamToString = (stream: any) => {
  const chunks: any = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk: any) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err: any) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
};

export const downloadFile = async (fileName: any) => {
  const params = {
    ...bucketParams,
    Key: fileName,
  };

  const command = new GetObjectCommand(params);
  const response = await s3Client.send(command);
  const data = await streamToString(response.Body);
  //@ts-ignore
  fs.writeFileSync(path.join(__dirname, fileName), data);
  return data;
};
