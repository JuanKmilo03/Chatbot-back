import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import stream from 'stream';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  size: number;
}

export class CloudinaryService {
  static async uploadFile(file: Express.Multer.File, folder: string = 'Cronogramas'): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: folder,
          allowed_formats: ['pdf', 'doc', 'docx', 'xls', 'xlsx'],
          format: 'auto'
        },
        (error, result) => {
          if (error) {
            reject(new Error(`Error subiendo archivo: ${error.message}`));
          } else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              format: result.format,
              size: result.bytes
            });
          } else {
            reject(new Error('Error desconocido al subir archivo'));
          }
        }
      );

      const stream = Readable.from(file.buffer);
      stream.pipe(uploadStream);
    });
  }

  static async deleteFile(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      console.error('Error eliminando archivo de Cloudinary:', error);
      return false;
    }
  }
}

export const uploadToCloudinary = (fileBuffer: Buffer, options: any = {}): Promise<any> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        ...options
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileBuffer);
    bufferStream.pipe(uploadStream);
  });
};

export const deleteFromCloudinary = async (url: string): Promise<void> => {
  try {
    // Extraer public_id de la URL
    const publicId = url.split('/').pop()?.split('.')[0];
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    console.error('Error al eliminar archivo de Cloudinary:', error);
    throw error;
  }
};

export default cloudinary;
