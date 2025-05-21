import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { v4 } from 'uuid';
import { rename as fsPromisesRename } from 'fs/promises'; //파일시스템의 프로미스라는 곳에서 리네임 기능을 가져옴
import { join } from 'path';

@Injectable()
export class MovieFilePipe
  implements PipeTransform<Express.Multer.File, Promise<Express.Multer.File>>
{
  constructor(
    private readonly options: { maxSizeInMB: number; mimetype: string },
  ) {}

  async transform(file: Express.Multer.File, metadata: ArgumentMetadata) {
    this.assertFileExists(file);
    this.assertFileSize(file);
    this.assertMimeType(file);
    return await this.rename(file);
  }

  private assertFileExists(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('movie 필드는 필수 입니다.');
    }
  }

  private assertFileSize(file: Express.Multer.File) {
    const maxSizeInByte = this.options.maxSizeInMB * 1000000;
    const fileByteSize = file.size;

    if (fileByteSize > maxSizeInByte) {
      throw new BadRequestException(
        `${this.options.maxSizeInMB}MB 이하의 사이즈만 업로드 가능합니다.`,
      );
    }
  }

  private assertMimeType(file: Express.Multer.File) {
    if (file.mimetype !== this.options.mimetype) {
      throw new BadRequestException(
        `${this.options.mimetype} 형식만 업로드 가능합니다.`,
      );
    }
  }

  private async rename(file: Express.Multer.File) {
    const split = file.originalname.split('.');
    let extension = 'mp4';

    if (split.length > 1) {
      extension = split[split.length - 1];
    }

    const filename = `${v4()}_${Date.now()}.${extension}`;
    const newPath = join(file.destination, filename);

    await fsPromisesRename(file.path, newPath);

    return {
      ...file,
      filename,
      path: newPath,
    };
  }
}
