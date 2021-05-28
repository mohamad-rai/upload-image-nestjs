import * as mongoose from 'mongoose';

export const ImageSchema = new mongoose.Schema({
  title: String,
  originalName: String,
  type: String,
  size: Number,
  width: Number,
  height: Number,
  createdAt: { type: Date, default: Date.now() },
});

ImageSchema.set('toJSON', {
  transform: function (doc, ret) {
    const { __v, ...safeObj } = ret;
    return safeObj;
  },
});

export interface Image extends mongoose.Document {
  id: mongoose.Schema.Types.ObjectId;
  title: string;
  originalName: string;
  type: string;
  size: number;
  width: number;
  height: number;
}
