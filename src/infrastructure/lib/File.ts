import { BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync, unlink, writeFile } from 'fs';
import { join } from 'path';
import { env } from '../../config';
import 'multer';

export class File {
  static filePath = join(process.cwd(), env.FILE_PATH);

  static async create(file: Express.Multer.File): Promise<string> {
    try {
      const fileName = `${Date.now()}_${file.originalname}`;
      if (!existsSync(File.filePath)) {
        mkdirSync(File.filePath, { recursive: true });
      }
      await new Promise<void>((res, rej) => {
        writeFile(join(File.filePath, fileName), file.buffer, (err: any) => {
          if (err) rej(err);
          res();
        });
      });
      return `${env.BASE_URL}/${env.FILE_PATH}/${fileName}`;
    } catch (error) {
      throw new BadRequestException('Fayl yuklashda muammo');
    }
  }

  static async delete(fileName: string): Promise<void> {
    try {
      const prefix = `${env.BASE_URL}/${env.FILE_PATH}/`;
      const file = fileName.includes(prefix)
        ? fileName.split(prefix)[1]
        : fileName;
      const fileUrl = join(File.filePath, file);
      if (!existsSync(fileUrl)) {
        return;
      }
      await new Promise<void>((res, rej) => {
        unlink(fileUrl, (err: any) => {
          if (err) rej(err);
          res();
        });
      });
    } catch (error) {
      throw new BadRequestException("Faylni o'chirishda muammo");
    }
  }

  static async exist(fileName: string): Promise<boolean> {
    try {
      const prefix = `${env.BASE_URL}/${env.FILE_PATH}/`;
      const file = fileName.includes(prefix)
        ? fileName.split(prefix)[1]
        : fileName;
      const fileUrl = join(File.filePath, file);
      return existsSync(fileUrl);
    } catch (error) {
      return false;
    }
  }
}
