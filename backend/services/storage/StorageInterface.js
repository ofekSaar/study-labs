/**
 * Abstract storage interface.
 * All storage adapters must implement these methods.
 * 
 * To switch storage providers:
 *   1. Create a new class extending StorageInterface
 *   2. Implement all methods
 *   3. Update the factory in index.js
 */
class StorageInterface {
  /**
   * Upload a file to storage.
   * @param {object} file - Multer file object
   * @param {string} directory - Subdirectory to store in (e.g., 'materials', 'lessons')
   * @returns {Promise<{ filename: string, storagePath: string, url: string }>}
   */
  async upload(file, directory = '') {
    throw new Error('upload() must be implemented by storage adapter');
  }

  /**
   * Upload raw content (e.g., markdown string) as a file.
   * @param {string} content - File content
   * @param {string} filename - Desired filename
   * @param {string} directory - Subdirectory
   * @returns {Promise<{ filename: string, storagePath: string, url: string }>}
   */
  async uploadContent(content, filename, directory = '') {
    throw new Error('uploadContent() must be implemented by storage adapter');
  }

  /**
   * Read file content as string.
   * @param {string} storagePath - Path returned from upload
   * @returns {Promise<string>}
   */
  async readContent(storagePath) {
    throw new Error('readContent() must be implemented by storage adapter');
  }

  /**
   * Delete a file from storage.
   * @param {string} storagePath - Path returned from upload
   * @returns {Promise<void>}
   */
  async delete(storagePath) {
    throw new Error('delete() must be implemented by storage adapter');
  }

  /**
   * Get a public URL for a stored file.
   * @param {string} storagePath - Path returned from upload
   * @returns {string}
   */
  getUrl(storagePath) {
    throw new Error('getUrl() must be implemented by storage adapter');
  }
}

export default StorageInterface;
