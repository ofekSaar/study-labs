import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import StorageInterface from './StorageInterface.js';

class LocalStorageAdapter extends StorageInterface {
  constructor(baseDir) {
    super();
    this.baseDir = baseDir || process.env.UPLOAD_DIR || './uploads';
  }

  async _ensureDir(dir) {
    await fs.mkdir(dir, { recursive: true });
  }

  async upload(file, directory = '') {
    const dir = path.join(this.baseDir, directory);
    await this._ensureDir(dir);

    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    const storagePath = path.join(directory, filename);
    const fullPath = path.join(this.baseDir, storagePath);

    // Move file from multer temp to final location
    if (file.buffer) {
      await fs.writeFile(fullPath, file.buffer);
    } else if (file.path) {
      await fs.copyFile(file.path, fullPath);
      await fs.unlink(file.path); // Clean up temp file
    }

    return {
      filename,
      storagePath,
      url: this.getUrl(storagePath),
    };
  }

  async uploadContent(content, filename, directory = '') {
    const dir = path.join(this.baseDir, directory);
    await this._ensureDir(dir);

    const uniqueFilename = `${uuidv4()}-${filename}`;
    const storagePath = path.join(directory, uniqueFilename);
    const fullPath = path.join(this.baseDir, storagePath);

    await fs.writeFile(fullPath, content, 'utf-8');

    return {
      filename: uniqueFilename,
      storagePath,
      url: this.getUrl(storagePath),
    };
  }

  _safeResolve(storagePath) {
    const baseResolved = path.resolve(this.baseDir);
    const fullPath = path.resolve(path.join(this.baseDir, storagePath));
    if (!fullPath.startsWith(baseResolved + path.sep) && fullPath !== baseResolved) {
      throw new Error('Path traversal attempt blocked');
    }
    return fullPath;
  }

  async readContent(storagePath) {
    const fullPath = this._safeResolve(storagePath);
    return fs.readFile(fullPath, 'utf-8');
  }

  async delete(storagePath) {
    const fullPath = this._safeResolve(storagePath);
    try {
      await fs.unlink(fullPath);
    } catch (error) {
      // File might not exist, ignore
      if (error.code !== 'ENOENT') throw error;
    }
  }

  getUrl(storagePath) {
    // Return a relative URL that Express can serve
    return `/uploads/${storagePath.replace(/\\/g, '/')}`;
  }
}

export default LocalStorageAdapter;
