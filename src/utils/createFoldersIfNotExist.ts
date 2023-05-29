import { InternalServerErrorException } from '@nestjs/common';
import { promises as fsPromises } from 'fs';

export const createFoldersIfNotExist = async (folderPath) => {
  try {
    await fsPromises.stat(folderPath);
  } catch (err) {
    if (err.code === 'ENOENT') {
      try {
        await fsPromises.mkdir(folderPath, { recursive: true });
      } catch (error) {
        throw new InternalServerErrorException();
      }
    } else {
      return;
    }
  }
};
