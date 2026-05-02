import LocalStorageAdapter from './LocalStorageAdapter.js';

/**
 * Storage factory.
 * Returns the appropriate storage adapter based on STORAGE_TYPE env var.
 * 
 * To add a new storage provider:
 *   1. Create a new adapter class extending StorageInterface
 *   2. Add a case to this switch statement
 *   3. Update .env with STORAGE_TYPE=<new-type>
 */
const createStorage = () => {
  const type = process.env.STORAGE_TYPE || 'local';

  switch (type) {
    case 'local':
      return new LocalStorageAdapter(process.env.UPLOAD_DIR || './uploads');

    // case 's3':
    //   return new S3StorageAdapter({
    //     bucket: process.env.S3_BUCKET,
    //     region: process.env.S3_REGION,
    //   });

    // case 'cloudinary':
    //   return new CloudinaryStorageAdapter({
    //     cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    //     apiKey: process.env.CLOUDINARY_API_KEY,
    //     apiSecret: process.env.CLOUDINARY_API_SECRET,
    //   });

    default:
      console.warn(`Unknown storage type "${type}", falling back to local.`);
      return new LocalStorageAdapter(process.env.UPLOAD_DIR || './uploads');
  }
};

// Singleton instance
const storage = createStorage();

export default storage;
