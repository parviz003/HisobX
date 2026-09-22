import { BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { unlink, writeFile } from 'fs/promises';
import { basename, join } from 'path';
import { randomUUID } from 'crypto';
import { env } from '../../config';
import 'multer';

export class File {
  static filePath = join(process.cwd(), env.FILE_PATH);

  // Statik fayllar app.service.ts da `/api/v1/uploads` manzilida beriladi
  static get baseUrl(): string {
    return `${env.BASE_URL}/api/v1/${env.FILE_PATH}`;
  }

  /** URL yoki fayl nomidan diskdagi haqiqiy fayl nomini ajratib oladi */
  private static resolveName(fileNameOrUrl: string): string {
    const clean = fileNameOrUrl.split('?')[0];
    return basename(clean);
  }

  static async create(file: Express.Multer.File): Promise<string> {
    try {
      const fileName = `${Date.now()}_${randomUUID()}_${basename(
        file.originalname,
      )}`;
      if (!existsSync(File.filePath)) {
        mkdirSync(File.filePath, { recursive: true });
      }
      await writeFile(join(File.filePath, fileName), file.buffer);
      return `${File.baseUrl}/${fileName}`;
    } catch (error) {
      throw new BadRequestException('Fayl yuklashda muammo');
    }
  }

  static async delete(fileNameOrUrl: string): Promise<void> {
    if (!fileNameOrUrl) return;
    try {
      const fileUrl = join(File.filePath, File.resolveName(fileNameOrUrl));
      if (!existsSync(fileUrl)) {
        return;
      }
      await unlink(fileUrl);
    } catch (error) {
      throw new BadRequestException("Faylni o'chirishda muammo");
    }
  }

  static async exist(fileNameOrUrl: string): Promise<boolean> {
    try {
      if (!fileNameOrUrl) return false;
      return existsSync(join(File.filePath, File.resolveName(fileNameOrUrl)));
    } catch (error) {
      return false;
    }
  }
}
