// src/services/userService.ts
import { User, IUserDocument } from "@src/models/user";
import { Follow } from "@src/models/follow";
import mongoose, { Types, FilterQuery } from "mongoose";
import { Event } from "@src/models/event"; // Add this line to import the correct Event model
import { MongoServerError } from "mongodb";
import { eventService, EventService } from "@src/services/eventService";
export class UserService {
  constructor(private eventService: EventService) { }
  // 查找用戶
  async findUserById(userId: string): Promise<IUserDocument | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return null;
      }
      return await User.findById(userId).select("-password");
    } catch (err) {
      console.error(err);
      throw new Error("伺服器錯誤");
    }
  }

  async findUserByEmail(email: string): Promise<IUserDocument | null> {
    try {
      return await User.findOne({ email }).select("-password").lean();
    } catch (err) {
      console.error(err);
      throw new Error("伺服器錯誤");
    }
  }

  async findUserByEmailWithPassword(email: string): Promise<IUserDocument | null> {
    try {
      return await User.findOne({ email }).select("+password").lean();
    } catch (err) {
      console.error(err);
      throw new Error("伺服器錯誤");
    }
  }

  async findUserByCondition(condition: FilterQuery<IUserDocument>): Promise<IUserDocument | null> {
    try {
      return await User.findOne(condition
      ).select("-password").lean();
    } catch (err) {
      console.error(err);
      throw new Error("伺服器錯誤");
    }
  }

  async isFollowing(userId: Types.ObjectId, followedUserId: Types.ObjectId): Promise<boolean> {
    try {
      const follow = await Follow.findOne({
        follower: userId,
        following: followedUserId,
        status: "accepted",
      });
      return !!follow;
    } catch (err) {
      console.error(err);
      throw new Error("伺服器錯誤");
    }
  }

  async hasRequestedFollow(userId: Types.ObjectId, followedUserId: Types.ObjectId): Promise<boolean> {
    try {
      // 尋找是否存在 pending 狀態的追蹤記錄
      const followRequest = await Follow.findOne({
        follower: userId,
        following: followedUserId,
        status: "pending"
      });

      return !!followRequest;
    } catch (err) {
      console.error(err);
      throw new Error("伺服器錯誤");
    }
  }

  // 創建用戶
  async createUser(data: {
    userName: string;
    accountName: string;
    email: string;
    password: string;
  }): Promise<IUserDocument> {
    try {
      return await User.create(data);
    } catch (err) {
      console.error(err);
      throw new Error("伺服器錯誤");
    }
  }

  // 更新用戶資料
  async updateUserProfile(
    user: IUserDocument,
    data: { userName?: string; email?: string; isPublic?: boolean; bio?: string, avatarUrl?: string }
  ): Promise<IUserDocument> {
    try {
      // 更新資料
      if (data.userName) user.userName = data.userName;
      if (data.email) user.email = data.email;
      if (data.isPublic !== undefined) user.isPublic = data.isPublic;
      if (data.bio) user.bio = data.bio;
      if (data.avatarUrl) user.avatarUrl = data.avatarUrl

      return await user.save();
    } catch (err) {
      console.error(err);
      throw new Error("伺服器錯誤");
    }
  }

  // 關注用戶
  async followUser(user: IUserDocument, followedUserId: Types.ObjectId): Promise<boolean> {
    // 防止用戶追蹤自己
    if (user._id.equals(followedUserId)) {
      return false;
    }

    // 查找執行追蹤的用戶
    const followeduser = await User.findById(followedUserId);
    if (!followeduser) {
      return false;
    }

    try {
      // 嘗試創建 Follow 記錄，捕獲重複關注的錯誤
      const follow = await Follow.create({
        follower: user,
        following: followedUserId,
        status: followeduser.isPublic ? "accepted" : "pending",
      });
      if (followeduser.isPublic) {
        // 更新關注者和被關注者的計數器
        const [updateFollower, updateFollowing] = await Promise.all([
          User.updateOne({ _id: user }, { $inc: { followingCount: 1 } }),
          User.updateOne({ _id: followedUserId }, { $inc: { followersCount: 1 } }),
        ]);

        // 檢查是否所有更新都成功
        if (updateFollower.modifiedCount === 0 || updateFollowing.modifiedCount === 0) {
          // 若其中一個更新失敗，進行補償性操作，刪除剛剛建立的 Follow 記錄
          await Follow.deleteOne({ _id: follow._id });
          return false;
        }
        await this.eventService.createEvent(user._id, followedUserId, "follow", { status: "accepted" });
      }
      else {
        await this.eventService.createEvent(user._id, followedUserId, "follow", { status: "pending" });
      }

      return true;
    } catch (error: unknown) {
      if (error instanceof MongoServerError && error.code === 11000) {
        // 重複關注，返回 false
        return false;
      }
      console.error('Error in followUser:', error);
      throw new Error("伺服器錯誤");
    }
  }



  // 取消關注
  async unfollowUser(userId: Types.ObjectId, followedUserId: Types.ObjectId): Promise<boolean> {
    // 防止用戶取消關注自己
    if (userId.equals(followedUserId)) {
      return false;
    }

    try {
      // 查找並刪除關注記錄
      const deletedFollow = await Follow.findOneAndDelete({
        follower: userId,
        following: followedUserId,
      });

      // 如果沒有找到關注關係，返回 false
      if (!deletedFollow) {
        return false;
      }

      if (deletedFollow.status === "accepted") {
        // 更新關注者和被關注者的計數器
        const [updateFollower, updateFollowing] = await Promise.all([
          User.updateOne(
            { _id: userId },
            { $inc: { followingCount: -1 } }
          ),
          User.updateOne(
            { _id: followedUserId },
            { $inc: { followersCount: -1 } }
          ),
        ]);

        // 檢查是否所有更新都成功
        if (updateFollower.modifiedCount === 0 || updateFollowing.modifiedCount === 0) {
          // 若其中一個更新失敗，進行補償性操作，重新建立刪除的 Follow 記錄
          await Follow.create({
            follower: userId,
            following: followedUserId,
            status: deletedFollow.status,
          });
          return false;
        }
      }

      // 當我取消追隨他，他給我的事件需要被刪除
      await Event.find({ sender: followedUserId, receiver: userId }).deleteMany();
      await Event.find({ sender: userId, receiver: followedUserId, eventType: "follow" }).deleteMany();

      return true;
    } catch (error: unknown) {
      console.error('Error in unfollowUser:', error);
      throw new Error("伺服器錯誤");
    }
  }

  // 接受追蹤請求
  async acceptFollowRequest(userId: Types.ObjectId, followerId: Types.ObjectId): Promise<boolean> {
    // 防止用戶接受自己的追蹤請求
    if (userId.equals(followerId)) {
      return false;
    }

    try {
      // 查找並更新 Follow 記錄
      const updatedFollow = await Follow.findOneAndUpdate(
        {
          follower: followerId,
          following: userId,
          status: "pending",
        },
        { status: "accepted" }
      );

      // 如果沒有找到記錄，返回 false
      if (!updatedFollow) {
        return false;
      }

      await Event.findOneAndUpdate({ sender: followerId, receiver: userId, eventType: "follow" }, { details: { status: "accepted" } });

      // 更新被追蹤者和追蹤者的計數器
      const [updateReceiver, updateFollower] = await Promise.all([
        User.updateOne(
          { _id: userId },
          { $inc: { followersCount: 1 } }
        ),
        User.updateOne(
          { _id: followerId },
          { $inc: { followingCount: 1 } }
        ),
      ]);

      // 檢查是否所有更新都成功
      if (updateReceiver.modifiedCount === 0 || updateFollower.modifiedCount === 0) {
        // 若其中一個更新失敗，進行補償性操作，將 Follow 記錄重新設為 "pending"
        await Follow.findOneAndUpdate(
          {
            follower: followerId,
            following: userId,
          },
          { status: "pending" }
        );
        return false;
      }

      return true;
    } catch (error: unknown) {
      console.error('Error in acceptFollowRequest:', error);
      throw new Error("伺服器錯誤");
    }
  }

  // 取消追蹤請求
  async rejectFollowRequest(userId: Types.ObjectId, followerId: Types.ObjectId): Promise<boolean> {
    // 防止用戶取消自己的追蹤請求
    if (userId.equals(followerId)) {
      return false;
    }

    try {
      // 查找並刪除 Follow 記錄
      const deletedFollow = await Follow.findOneAndDelete({
        follower: followerId,
        following: userId,
        status: "pending",
      });
      // 如果沒有找到記錄，返回 false
      if (!deletedFollow) {
        return false;
      }
      await Event.findOneAndDelete({ sender: followerId, receiver: userId, eventType: "follow" });

      return true;
    } catch (error: unknown) {
      console.error('Error in rejectFollowRequest:', error);
      throw new Error("伺服器錯誤");
    }
  }

  async getPublicUserIds(): Promise<Types.ObjectId[]> {
    const now = Date.now();
    const CACHE_DURATION = 60 * 1000; // 1 分鐘
    let cacheTimestamp = 0;
    let cachedPublicUserIds: Types.ObjectId[] = [];

    if (now - cacheTimestamp > CACHE_DURATION) {
      const publicUsers = await User.find({ isPublic: true }).select('_id').lean();
      cachedPublicUserIds = publicUsers.map(user => user._id);
      cacheTimestamp = now;
    }
    return cachedPublicUserIds;
  }
}
export const userService = new UserService(eventService);