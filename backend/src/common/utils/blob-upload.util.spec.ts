import { put } from '@vercel/blob';
import { imageFileFilter, uploadToBlob } from './blob-upload.util';

jest.mock('@vercel/blob', () => ({
  put: jest.fn().mockResolvedValue({ url: 'https://blob.example/file' }),
}));

function makeFile(originalname: string, mimetype: string): Express.Multer.File {
  return {
    originalname,
    mimetype,
    buffer: Buffer.from('content'),
  } as Express.Multer.File;
}

function runImageFilter(file: Express.Multer.File) {
  const cb = jest.fn();
  imageFileFilter(undefined, file, cb);
  return cb.mock.calls[0] as [Error | null, boolean];
}

describe('imageFileFilter', () => {
  it.each(['logo.png', 'logo.JPG', 'logo.jpeg', 'favicon.ico', 'logo.webp'])(
    'accepts %s',
    (name) => {
      expect(runImageFilter(makeFile(name, 'image/png'))).toEqual([null, true]);
    },
  );

  it('rejects SVG files, which can carry scripts', () => {
    const [error, isAccepted] = runImageFilter(
      makeFile('logo.svg', 'image/svg+xml'),
    );

    expect(isAccepted).toBe(false);
    expect(error).toBeInstanceOf(Error);
  });
});

describe('uploadToBlob', () => {
  const putMock = put as jest.Mock;

  beforeEach(() => putMock.mockClear());

  it('sets the content type from the file extension, not the client header', async () => {
    await uploadToBlob('branding', makeFile('logo.png', 'text/html'));

    expect(putMock.mock.calls[0][2]).toMatchObject({
      contentType: 'image/png',
    });
  });

  it('stores PDFs as application/pdf', async () => {
    await uploadToBlob('actas', makeFile('acta.PDF', 'text/html'));

    expect(putMock.mock.calls[0][2]).toMatchObject({
      contentType: 'application/pdf',
    });
  });
});
