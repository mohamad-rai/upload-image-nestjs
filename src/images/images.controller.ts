import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Res,
  Req,
} from '@nestjs/common';
import { ImagesService } from './images.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './avatars',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${path.extname(file.originalname)}`);
        },
      }),
      fileFilter(
        req: any,
        file: {
          fieldname: string;
          originalname: string;
          encoding: string;
          mimetype: string;
          size: number;
          destination: string;
          filename: string;
          path: string;
          buffer: Buffer;
        },
        callback: (error: Error | null, acceptFile: boolean) => void,
      ) {
        req.imageValidation = null;
        const ext = path.extname(file.originalname);
        switch (ext) {
          case '.png':
          case '.jpg':
          case '.jpeg':
          case '.gif':
            return callback(null, true);
          default:
            req.imageValidation = 'Only images are allowed';
            return callback(null, false);
        }
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
    @Res() res,
  ) {
    if (req.imageValidation)
      return res.status(400).json({ message: req.imageValidation });
    this.imagesService
      .create(file)
      .then((result) => {
        res.status(result.status).json(result);
      })
      .catch((err) => {
        res.status(err.status).json(err);
      });
  }

  @Get()
  async findAll(@Res() res) {
    return res.json({ status: 200, data: await this.imagesService.findAll() });
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res) {
    const removePhoto = await this.imagesService.remove(id);
    return res.status(removePhoto.status).json(removePhoto);
  }
}
