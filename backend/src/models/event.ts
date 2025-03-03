// src/models/event.ts
import { Schema, Types, model, HydratedDocument } from "mongoose";
import { IUserDocument } from "@src/models/user";

export interface IEvent {
    sender: Types.ObjectId | IUserDocument;
    receiver: Types.ObjectId | IUserDocument;
    eventType: "follow" | "comment" | "like";
    details: Record<string, unknown>;
    timestamp: Date;
}

export type IEventDocument = HydratedDocument<IEvent>;

const eventSchema: Schema = new Schema({
    sender: { type: Types.ObjectId, ref: "User", required: true },
    receiver: { type: Types.ObjectId, ref: "User", required: true },
    eventType: { type: String, enum: ["follow", "comment", "like"], required: true },
    details: {
        type: Schema.Types.Mixed,
        default: {}
    },
    timestamp: { type: Date, default: Date.now },
});

//可以自動刪除３個月過期的事件，需考慮是否需要
// eventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });  // 90天
eventSchema.index({ receiver: 1, timestamp: -1 });
export const Event = model<IEvent>("Event", eventSchema);
