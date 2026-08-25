import { extname } from 'path';
import { put } from '@vercel/blob';
import { BadRequestException } from '@nestjs/common';

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

export function fileFilter(
  _req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) {
  if (ALLOWED_EXTENSIONS.includes(extname(file.originalname).toLowerCase())) {
    cb(null, true);
  } else {
    cb(
      new BadRequestException(
        'Solo se permiten archivos PDF, JPG y PNG',
      ) as unknown as Error,
      false,
    );
  }
}

export async function uploadToBlob(
  folder: string,
  file: Express.Multer.File,
): Promise<string> {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1e9);
  const ext = extname(file.originalname);
  const pathname = `${folder}/${timestamp}-${random}${ext}`;

  const blob = await put(pathname, file.buffer, {
    access: 'public',
    addRandomSuffix: false,
    contentType: file.mimetype,
  });

  return blob.url;
}
