import storage from './storage/index.js';

/**
 * Upload an array of multer files, skipping duplicates.
 *
 * @param {Express.Multer.File[]} files           - Incoming multer file objects
 * @param {object[]}              existingMaterials - Already-persisted material objects
 *                                                   with `originalName` and `size` fields.
 *                                                   Used to deduplicate against existing uploads.
 * @returns {Promise<object[]>} Uploaded material metadata objects ready to store in DB
 */
export const deduplicateAndUpload = async (files, existingMaterials = []) => {
  const seenFiles = new Set(
    existingMaterials.map(m => `${m.originalName}_${m.size}`)
  );

  const results = [];
  for (const file of files) {
    const signature = `${file.originalname}_${file.size}`;
    if (seenFiles.has(signature)) {
      console.log(`[File Upload] Skipping duplicate: ${file.originalname}`);
      continue;
    }
    seenFiles.add(signature);
    const result = await storage.upload(file, 'materials');
    results.push({
      filename: result.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      storagePath: result.storagePath,
      size: file.size,
    });
  }

  return results;
};
