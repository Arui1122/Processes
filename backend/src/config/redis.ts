// src/config/redis.ts
import Redis from "ioredis";
import RedisMock from "ioredis-mock";
let redisClient: Redis;

if (process.env.NODE_ENV === "test") {
    redisClient = new RedisMock();
    console.log("Using Redis mock client");
} else {
    redisClient = new Redis({
        host: "redis", // Redis 伺服器地址
        port: 6379,        // Redis 預設埠
        //password: process.env.REDIS_PASSWORD || undefined, // 如果需要密碼驗證
    });

    redisClient.on("connect", () => {
        console.log("Connected to Redis");
    });

    redisClient.on("error", (err) => {
        console.error("Redis connection error:", err);
    });
}
export default redisClient;