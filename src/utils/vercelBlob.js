// backend/src/utils/vercelBlob.js
import { put } from '@vercel/blob';
import fs from 'fs';

/**
 * Upload a file to Vercel Blob Storage and return the Blob URL.
 * @param {Buffer|string} fileOrPath - File buffer or local path to the file.
 * @param {string} blobName - Name to use in Blob Storage.
 * @returns {Promise<string>} - The Blob URL.
 */
export async function uploadToVercelBlob(fileOrPath, blobName) {
  let fileBuffer;
  if (typeof fileOrPath === 'string') {
    // If it's a path, read the file
    fileBuffer = fs.readFileSync(fileOrPath);
  } else {
    // If it's already a buffer, use it directly
    fileBuffer = fileOrPath;
  }
  const { url } = await put(blobName, fileBuffer, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  return url;
}
