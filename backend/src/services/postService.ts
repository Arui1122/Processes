// services/postService.ts
import { Types } from 'mongoose';
import { Post, IPost, IPostDocument } from '@src/models/post';
import { Comment } from '@src/models/comment';
import { Like } from '@src/models/like';
import { Event } from '@src/models/events';
import mongoose from 'mongoose';

export class PostService {
    /**
     * 獲取所有貼文，支援分頁
     * 
     * 實作重點：
     * 1. 使用 Promise.all 同時執行兩個查詢，提升效能
     * 2. 使用 populate 預先載入關聯資料，減少額外查詢
     * 3. 使用 lean() 將結果轉為純 JavaScript 物件，提升效能
     */
    async getAllPosts(page: number = 1, limit: number = 10): Promise<{ posts: IPost[]; total: number }> {
        try {
            const skip = (page - 1) * limit;

            // 同時執行兩個資料庫操作，提升效能
            const [total, posts] = await Promise.all([
                Post.countDocuments(),
                Post.find()
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    // 預先載入使用者資料，減少額外查詢
                    .populate('user', 'userName accountName avatarUrl bio followersCount followingCount')
                    // 預先載入評論資料及其相關使用者資料
                    .populate({
                        path: 'comments',
                        populate: {
                            path: 'user',
                            select: 'userName accountName avatarUrl'
                        }
                    })
                    // 使用 lean() 優化效能
                    .lean()
            ]);

            return { posts, total };
        } catch (error) {
            console.error('Error in getAllPosts:', error);
            throw error;
        }
    }

    /**
     * 建立新貼文
     * 
     * 特點：
     * 1. 檢查內容長度限制（280字）
     * 2. 初始化評論陣列和按讚計數
     */
    async createPost(userId: Types.ObjectId, content: string): Promise<IPostDocument> {
        try {
            if (content.length > 280) {
                throw new Error('貼文內容超過長度限制');
            }

            const post = new Post({
                user: userId,
                content,
                comments: [],  // 初始化空評論陣列
                likesCount: 0  // 初始化按讚計數
            });

            return await post.save();
        } catch (error) {
            console.error('Error in createPost:', error);
            throw error;
        }
    }

    /**
     * 更新貼文
     * 
     * 特點：
     * 1. 檢查內容長度限制
     * 2. 使用 findOneAndUpdate 確保只有貼文作者可以更新
     * 3. 使用 new: true 取得更新後的文件
     */
    async updatePost(
        postId: Types.ObjectId,
        userId: Types.ObjectId,
        content: string
    ): Promise<boolean> {
        try {
            if (content.length > 280) {
                throw new Error('貼文內容超過長度限制');
            }

            // 使用複合條件確保只有作者可以更新貼文
            const result = await Post.findOneAndUpdate(
                { _id: postId, user: userId },
                { content },
                { new: true }
            );

            return !!result;  // 轉換為布林值
        } catch (error) {
            console.error('Error in updatePost:', error);
            throw error;
        }
    }

    /**
     * 刪除貼文
     * 
     * 實作重點：
     * 1. 使用 MongoDB 事務確保資料一致性
     * 2. 同時刪除相關的評論、按讚和通知
     * 3. 使用 Promise.all 平行處理多個刪除操作
     */
    async deletePost(postId: Types.ObjectId, userId: Types.ObjectId): Promise<boolean> {
        // 開始一個新的資料庫事務
        const session = await mongoose.startSession();
        try {
            const result = await session.withTransaction(async () => {
                // 查找並刪除貼文，確保只有作者可以刪除
                const post = await Post.findOneAndDelete(
                    { _id: postId, user: userId },
                    { session }
                );

                if (!post) {
                    return false;
                }

                // 同時處理所有相關資料的刪除
                await Promise.all([
                    // 刪除該貼文的所有評論
                    Comment.deleteMany({ post: postId }).session(session),
                    // 刪除與該貼文相關的所有按讚記錄
                    Like.deleteMany({
                        target: postId,
                        targetModel: 'Post'
                    }).session(session),
                    // 刪除相關的事件通知
                    Event.deleteMany({
                        'details.postId': postId,
                        eventType: { $in: ['like', 'comment'] }
                    }).session(session)
                ]);

                return true;
            });

            return result;
        } catch (error) {
            console.error('Error in deletePost:', error);
            throw error;
        } finally {
            // 確保事務結束
            session.endSession();
        }
    }

    /**
     * 對貼文按讚
     * 
     * 實作重點：
     * 1. 使用事務確保資料一致性
     * 2. 檢查是否已經按過讚
     * 3. 同時更新按讚記錄和貼文的按讚計數
     * 4. 建立通知（如果不是自己的貼文）
     */
    async likePost(postId: Types.ObjectId, userId: Types.ObjectId): Promise<boolean> {
        const session = await mongoose.startSession();
        try {
            const result = await session.withTransaction(async () => {
                // 同時查詢貼文和現有的按讚記錄
                const [post, existingLike] = await Promise.all([
                    Post.findById(postId).session(session),
                    Like.findOne({
                        user: userId,
                        target: postId,
                        targetModel: 'Post'
                    }).session(session)
                ]);

                if (!post || existingLike) {
                    return false;
                }

                // 同時建立按讚記錄和更新按讚計數
                await Promise.all([
                    new Like({
                        user: userId,
                        target: postId,
                        targetModel: 'Post'
                    }).save({ session }),
                    Post.findByIdAndUpdate(
                        postId,
                        { $inc: { likesCount: 1 } },  // 使用 $inc 遞增按讚數
                        { session }
                    )
                ]);

                // 如果不是自己的貼文，建立通知
                if (!post.user.equals(userId)) {
                    await new Event({
                        sender: userId,
                        receiver: post.user,
                        eventType: 'like',
                        details: new Map([['postId', postId]])
                    }).save({ session });
                }

                return true;
            });

            return result;
        } catch (error) {
            console.error('Error in likePost:', error);
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * 取消貼文按讚
     * 
     * 實作重點：
     * 1. 使用事務確保資料一致性
     * 2. 同時處理按讚記錄的刪除、計數更新和通知刪除
     * 3. 確保所有相關操作都在同一個事務中完成
     */
    async unlikePost(postId: Types.ObjectId, userId: Types.ObjectId): Promise<boolean> {
        const session = await mongoose.startSession();
        try {
            const result = await session.withTransaction(async () => {
                // 同時查詢貼文和按讚記錄
                const [post, like] = await Promise.all([
                    Post.findById(postId).session(session),
                    Like.findOne({
                        user: userId,
                        target: postId,
                        targetModel: 'Post'
                    }).session(session)
                ]);

                if (!post || !like) {
                    return false;
                }

                // 同時處理所有相關操作
                await Promise.all([
                    // 刪除按讚記錄
                    Like.deleteOne({ _id: like._id }).session(session),
                    // 更新貼文的按讚計數
                    Post.findByIdAndUpdate(
                        postId,
                        { $inc: { likesCount: -1 } },
                        { session }
                    ),
                    // 刪除相關通知
                    Event.deleteOne({
                        sender: userId,
                        receiver: post.user,
                        eventType: 'like',
                        'details.postId': postId
                    }).session(session)
                ]);

                return true;
            });

            return result;
        } catch (error) {
            console.error('Error in unlikePost:', error);
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * 新增評論到貼文
     * 
     * 實作重點：
     * 1. 使用事務確保資料一致性
     * 2. 檢查評論內容長度限制
     * 3. 同時更新評論和貼文的評論列表
     * 4. 建立通知（如果不是自己的貼文）
     */
    async addComment(
        postId: Types.ObjectId,
        userId: Types.ObjectId,
        content: string
    ): Promise<boolean> {
        const session = await mongoose.startSession();
        try {
            const result = await session.withTransaction(async () => {
                if (content.length > 280) {
                    throw new Error('評論內容超過長度限制');
                }

                // 檢查貼文是否存在
                const post = await Post.findById(postId).session(session);
                if (!post) {
                    return false;
                }

                // 建立新評論
                const comment = await new Comment({
                    user: userId,
                    content,
                    post: postId,
                    comments: [],  // 支援巢狀評論
                    likesCount: 0
                }).save({ session });

                // 更新貼文的評論列表
                await Post.findByIdAndUpdate(
                    postId,
                    { $push: { comments: comment._id } },  // 使用 $push 添加新評論
                    { session }
                );

                // 如果不是自己的貼文，建立通知
                if (!post.user.equals(userId)) {
                    await new Event({
                        sender: userId,
                        receiver: post.user,
                        eventType: 'comment',
                        details: new Map([
                            ['postId', postId],
                            ['commentId', comment._id]
                        ])
                    }).save({ session });
                }

                return true;
            });

            return result;
        } catch (error) {
            console.error('Error in addComment:', error);
            throw error;
        } finally {
            session.endSession();
        }
    }
}

export const postService = new PostService();