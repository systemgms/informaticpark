import { extname } from 'path';
import { put } from '@vercel/blob';
import { BadRequestException } from '@nestjs/common';

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];
// SVG is excluded on purpose: it can embed scripts that run when the file is opened directly.
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.ico', '.webp'];

// The stored content type comes from the validated extension, never from the client-supplied mimetype.
const CONTENT_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
};

export function fileFilter(
  _req: unknown,
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

export function imageFileFilter(
  _req: unknown,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) {
  if (IMAGE_EXTENSIONS.includes(extname(file.originalname).toLowerCase())) {
    cb(null, true);
  } else {
    cb(
      new BadRequestException(
        'Solo se permiten imágenes JPG, PNG, ICO o WEBP',
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
  const ext = extname(file.originalname).toLowerCase();
  const pathname = `${folder}/${timestamp}-${random}${ext}`;

  const blob = await put(pathname, file.buffer, {
    access: 'public',
    addRandomSuffix: false,
    contentType: CONTENT_TYPES[ext] ?? 'application/octet-stream',
  });

  return blob.url;
}
