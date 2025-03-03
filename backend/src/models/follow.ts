// src/models/follow.ts
import { Schema, Types, model, HydratedDocument } from "mongoose";

export interface IFollow extends Document {
  follower: Types.ObjectId;
  following: Types.ObjectId;
  createdAt: Date;
  status: "pending" | "accepted";
}

export type IFollowDocument = HydratedDocument<IFollow>

const followSchema: Schema = new Schema({
  follower: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  following: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["pending", "accepted"],
    default: "accepted",
  },
});

// 防止重複關注，同一組合唯一
followSchema.index({ follower: 1, following: 1 }, { unique: true });
followSchema.index({ follower: 1 });
followSchema.index({ following: 1 });

export const Follow = model<IFollow>("Follow", followSchema);
