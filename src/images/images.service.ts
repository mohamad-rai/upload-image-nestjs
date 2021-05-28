import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Image } from './images.model';
import { Model } from 'mongoose';
import * as path from 'path';
import * as fs from 'fs';
import * as sharp from 'sharp';
import imageSize from 'image-size';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ImagesService {
  constructor(
    @InjectModel('Image') private readonly imageModel: Model<Image>,
    private configService: ConfigService,
  ) {}
  create(file): Promise<any> {
    const originalFilePath = path.join(__dirname, '..', '..', file.path);
    return new Promise((resolve, reject) => {
      fs.readFile(originalFilePath, (err, image) => {
        if (err) {
          console.log(err.message);
          reject({ status: 500, message: 'original file could not find' });
        }
        sharp(image)
          .resize(200, 200)
          .toBuffer()
          .then((data) => {
            const splitName = file.filename.split('.');
            const ext = splitName.pop();
            const thumbFilePath = path.join(
              __dirname,
              '..',
              '..',
              'avatars',
              splitName.join() + '_thumb.' + ext,
            );
            fs.writeFile(thumbFilePath, data, (writeError) => {
              if (writeError) {
                console.log(writeError.message);
                fs.unlinkSync(originalFilePath);
                reject({
                  status: 500,
                  message: 'could not make thumbnail image',
                });
              }
              const imageDimension = imageSize(originalFilePath);
              // return res.sendFile(file.filename, { root: 'avatars' });
              const image = new this.imageModel({
                title: file.filename,
                originalName: file.originalname,
                type: ext,
                width: imageDimension.width,
                height: imageDimension.height,
                size: file.size,
              });
              image
                .save()
                .then((r) => {
                  resolve({
                    status: 200,
                    message: 'image successfully uploaded',
                    data: r,
                  });
                })
                .catch((e) => {
                  console.log(e);
                  fs.unlinkSync(originalFilePath);
                  fs.unlinkSync(thumbFilePath);
                  reject({
                    status: 500,
                    message: 'could not save image data in db',
                  });
                });
            });
          })
          .catch((err) => {
            console.log(err.message);
            fs.unlinkSync(originalFilePath);
            reject({ status: 500, message: 'could not make thumbnail image' });
          });
      });
    });
  }

  async findAll() {
    const images = await this.imageModel.find().lean();
    return images.map((image) => {
      const address = this.configService.get('APP_URI') + '/' + image.title;
      const thumbName = this.thumbName(image.title, image.type);
      const thumbAddress = this.configService.get('APP_URI') + '/' + thumbName;
      delete image.__v;
      return {
        ...image,
        address,
        thumbAddress,
      };
    });
  }

  remove(id: string) {
    return this.imageModel.findOneAndDelete({ _id: id }).then((r) => {
      const filePath = path.join(__dirname, '..', '..', 'avatars');
      try {
        fs.unlinkSync(path.join(filePath, r.title));
        fs.unlinkSync(path.join(filePath, this.thumbName(r.title, r.type)));
        return { status: 200, message: 'image deleted' };
      } catch (e) {
        console.log(e);
        return { status: 500, message: 'could not remove photo' };
      }
    });
  }

  private thumbName = (title, type) => {
    return (
      title.substring(0, title.indexOf('.', title.length - 5)) +
      '_thumb.' +
      type
    );
  };
}
