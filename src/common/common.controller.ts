import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MovieFilePipe } from 'src/movies/pipe/movie-file.pipe';

@Controller('common')
export class CommonController {
  @Post('video')
  @UseInterceptors(
    FileInterceptor('video', {
      limits: {
        fileSize: 200000000, // 200mb
      },
      fileFilter(req, file, callback) {
        const canUploadFile = true;

        if (file.mimetype !== 'video/mp4') {
          return callback(
            new BadRequestException('.mp4 타입의 파일만 가능합니다.'),
            !canUploadFile,
          );
        }

        return callback(null, canUploadFile);
      },
    }),
  )
  postVideo(
    @UploadedFile(
      new MovieFilePipe({
        maxSizeInMB: 200,
        mimetype: 'video/mp4',
      }),
    )
    movieFile: Express.Multer.File,
  ) {
    return {
      fileName: movieFile.filename,
    };
  }
}
