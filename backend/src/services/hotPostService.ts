// src/services/hotPostService.ts
import cron from 'node-cron';
import redisClient from '@src/config/redis';
import { Post, IPostDocument } from '@src/models/post';
import { ScheduledTask } from 'node-cron';

export class HotPostService {
    private cronJob?: ScheduledTask;

    constructor() {
        // 在非測試環境下才啟動 cron job
        if (process.env.NODE_ENV !== 'test') {
            // 每天凌晨 2 點更新熱門貼文
            this.cronJob = cron.schedule('0 0 * * *', this.updateHotPosts);
        }
    }

    stop(): void {
        if (this.cronJob) {
            this.cronJob.stop();
        }
    }

    getHotPosts = async (): Promise<IPostDocument[]> => {
        try {
            const hotPostsKey = 'hot:posts';
            // 嘗試從 Redis 獲取快取
            const hotPosts = await redisClient.get(hotPostsKey);
            if (hotPosts) {
                const posts: IPostDocument[] = JSON.parse(hotPosts);
                return posts;
            }
            this.updateHotPosts();
            return [];
        } catch (error) {
            console.error('獲取熱門貼文失敗:', error);
            return [];
        }
    }

    updateHotPosts = async () => {
        try {
            const hotPostsKey = 'hot:posts';
            // 根據點讚數和評論數排序，獲取前 100 條熱門貼文
            const hotPosts = await Post.find({})
                .sort({ likesCount: -1, comments: -1, createdAt: -1 })
                .limit(100)
                .populate('user', 'userName accountName avatarUrl')
                .lean();

            // 清空當前的熱門貼文有序集合
            await redisClient.del(hotPostsKey);

            await redisClient.setex(hotPostsKey, 600, JSON.stringify(hotPosts));

            console.log('熱門貼文已更新');
        } catch (error) {
            console.error('更新熱門貼文失敗:', error);
        }
    }
}

export const hotPostService = new HotPostService();