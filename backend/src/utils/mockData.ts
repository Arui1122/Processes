// src/utils/mockData.ts
import mongoose from "mongoose";
import { User } from "../models/user";
import { Post } from "../models/post";
import { Comment } from "../models/comment";
import { Like } from "../models/like";
import { Follow } from "../models/follow";
import { Event } from "../models/event";
import { faker } from "@faker-js/faker";
import { MONGO_URI } from "../config/config";
import OpenAI from "openai";
import dotenv from 'dotenv';

dotenv.config();
// 配置 OpenAI API
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// 连接到 MongoDB
const connectDB = async () => {
    await mongoose
        .connect(MONGO_URI)
        .then(() => console.log('MongoDB 已連結'))
        .catch((err) => console.log(err));
};

// 使用 ChatGPT 生成随机中文文本
const generateRandomChineseText = async (prompt: string): Promise<string> => {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: '你是一個會隨機生成中文内容的助手。' },
                { role: 'user', content: prompt },
            ],
            temperature: 1.0,
        });
        return response.choices[0].message?.content?.trim() || '';
    } catch (error) {
        console.error('生成文本时出错:', error);
        return '';
    }
};

// 創建假資料
const createMockData = async () => {
    try {
        // 建立用戶
        const users = [];
        for (let i = 0; i < 10; i++) {
            users.push(
                new User({
                    accountName: faker.internet.username(),
                    userName: faker.internet.displayName(),
                    email: faker.internet.email(),
                    password: faker.internet.password(),
                    followersCount: faker.number.int(1000),
                    followingCount: faker.number.int(1000),
                    isPublic: true,
                    bio: faker.lorem.sentence(),
                    avatarUrl: faker.image.avatar(),
                    hasNewNotifications: faker.datatype.boolean(),
                })
            );
        }
        const savedUsers = await User.insertMany(users);
        console.log("Users created!");

        // 建立貼文
        const posts = [];
        for (const user of savedUsers) {
            for (let i = 0; i < 3; i++) {
                const text = await generateRandomChineseText("請生成100字內的隨機繁體中文文本");
                posts.push(
                    new Post({
                        user: user._id,
                        content: text,
                        images: [faker.image.url()],
                        likesCount: faker.number.int(500),
                        comments: [],
                    })
                );
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        const savedPosts = await Post.insertMany(posts);
        console.log("Posts created!");

        const savedComments = []; // 保存留言以便後續使用

        // 建立留言
        for (let i = 0; i < 50; i++) {
            const user = faker.helpers.arrayElement(savedUsers);
            const post = faker.helpers.arrayElement(savedPosts);

            // 隨機生成子留言
            const childComments = [];
            if (faker.datatype.boolean()) {
                const childCommentCount = faker.number.int({ min: 1, max: 3 });
                for (let j = 0; j < childCommentCount; j++) {
                    const childUser = faker.helpers.arrayElement(savedUsers);
                    const childComment = new Comment({
                        user: childUser._id,
                        content: faker.lorem.sentences(3).slice(0, 280),
                        likesCount: faker.number.int(100),
                        comments: [],
                    });
                    const savedChildComment = await childComment.save(); // 保存子留言
                    childComments.push(savedChildComment._id);
                }
            }

            const comment = new Comment({
                user: user._id,
                content: faker.lorem.sentence(),
                likesCount: faker.number.int(200),
                comments: childComments, // 關聯子留言
            });
            const savedComment = await comment.save();
            savedComments.push(savedComment); // 保存留言以便後續使用

            // 將留言關聯到貼文
            post.comments.push(savedComment._id);
            await post.save(); // 更新貼文的留言
        }
        console.log("Comments created!");


        // 建立關注
        const follows = [];
        const followPairs = new Set<string>(); // 使用 Set 來快速檢查唯一性

        for (let i = 0; i < 20; i++) {
            const follower = faker.helpers.arrayElement(savedUsers);
            const following = faker.helpers.arrayElement(savedUsers);

            // 確保 follower 和 following 不相同
            if (follower._id.equals(following._id)) continue;

            // 確保沒有重複的 follower-following 配對
            const pairKey = `${follower._id.toString()}_${following._id.toString()}`;
            if (followPairs.has(pairKey)) continue;

            followPairs.add(pairKey); // 記錄已處理的配對
            follows.push(
                new Follow({
                    follower: follower._id,
                    following: following._id,
                })
            );
        }
        await Follow.insertMany(follows);
        console.log("Follows created!");


        // 建立點讚
        const likes = [];
        const likePairs = new Set<string>(); // 使用 Set 來檢查唯一性

        for (let i = 0; i < 50; i++) {
            const user = faker.helpers.arrayElement(savedUsers);
            const post = faker.helpers.arrayElement(savedPosts); // 針對貼文的點讚

            // 確保 user 和 target 不重複
            const pairKey = `${user._id.toString()}_${post._id.toString()}`;
            if (likePairs.has(pairKey)) continue;

            likePairs.add(pairKey); // 記錄已處理的配對
            likes.push(
                new Like({
                    user: user._id,
                    targetModel: "Post",
                    target: post._id,
                })
            );
        }

        await Like.insertMany(likes);
        console.log("Likes created!");


        // 建立事件
        const events = [];
        for (let i = 0; i < 20; i++) {
            const sender = faker.helpers.arrayElement(savedUsers);
            const receiver = faker.helpers.arrayElement(savedUsers);

            // 確保 sender 和 receiver 不相同
            if (sender._id.equals(receiver._id)) continue;

            const eventType = faker.helpers.arrayElement(["follow", "comment", "like"]);
            let details = {};

            // 根據 eventType 生成適當的 details
            switch (eventType) {
                case "follow":
                    // follow 不需要額外 details
                    details = {
                        friendRequestId: faker.database.mongodbObjectId(),
                        message: faker.lorem.sentence(10), // 隨機附加一條訊息
                    };
                    break;

                case "comment":
                    const comment = faker.helpers.arrayElement(savedComments); // 隨機選擇一個現有的 comment
                    const post = faker.helpers.arrayElement(savedPosts); // 隨機選擇一個現有的 post
                    details = {
                        commentText: faker.lorem.sentence(10), // 限制長度為 10 個單詞
                        postText: post.content.slice(0, 20), // 限制長度為 20 個字元
                        postId: post._id,
                        commentId: comment._id,
                    };
                    break;

                case "like":
                    const targetType = faker.helpers.arrayElement(["Post", "Comment"]);
                    const target =
                        targetType === "Post"
                            ? faker.helpers.arrayElement(savedPosts)
                            : faker.helpers.arrayElement(savedComments);
                    details = {
                        contentId: target._id,
                        contentType: targetType,
                        contentText: target.content.slice(0, 20),
                    };
                    break;

                default:
                    break;
            }

            events.push(
                new Event({
                    sender: sender._id,
                    receiver: receiver._id,
                    eventType,
                    details,
                    timestamp: faker.date.recent(),
                })
            );
        }

        await Event.insertMany(events);
        console.log("Events created!");

    } catch (error) {
        console.error("Error creating mock data:", error);
    }
};

// 主函數
const main = async () => {
    await connectDB();
    await createMockData();
    mongoose.connection.close();
    console.log("Mock data created and connection closed.");
};

main();
