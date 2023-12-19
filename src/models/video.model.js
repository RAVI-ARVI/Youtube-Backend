import { Schema, models } from "mongoose";

const videoSchema = new Schema(
  {
    videoFile: {
      type: String, // here you will get cloudinary url
      required: true,
    },
    thumbnail: {
      type: String, // here you will get cloudinary url
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, // duration you will get from cloudinary
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const Video = models("Video", videoSchema);
