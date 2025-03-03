// src/routes/postRoutes.ts
import { Router } from "express";
import { authenticateJWT, optionalAuthenticateJWT } from "@src/middlewares/authenticateJWT";
import { postIdValidator, postId_postValidator, postValidator, getPostValidator, updatePostValidator } from "@src/middlewares/postMiddleware";
import { postUpload } from "@src/config/multer";
import { postController } from "@src/controllers/postController";
import { hotPostService } from "@src/services/hotPostService";
const router = Router();

hotPostService.updateHotPosts();

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: API endpoints for managing posts
 */

router.get("/guest", optionalAuthenticateJWT, getPostValidator, postController.getAllPosts);
/**
 * @swagger
 * /api/post/{userId}:
 *   get:
 *      summary: Get personal posts
 *      escription: Retrieve posts created by a specific user
 *      tags: [貼文]
 *      security:
 *      - bearerAuth: []
 *      parameters:
 *      - in: path
 *      name: userId
 *      required: true
 * 
 */

router.get("/:postId/comments", optionalAuthenticateJWT, postIdValidator, postController.getPostComments);

router.get("/:userId", authenticateJWT, getPostValidator, postController.getPersonalPosts);

/**
 * @swagger
 * /api/post:
 *   get:
 *     summary: 獲取貼文列表
 *     description: |
 *       取得公開用戶的貼文和自己的貼文
 *       - 支援無限捲動分頁機制
 *       - 依照時間順序由新到舊排序
 *       - 回傳最佳化的資料結構
 *     tags: [貼文]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每頁返回的貼文數量
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: 分頁游標（上一頁最後一篇貼文的建立時間）
 *     responses:
 *       200:
 *         description: 成功獲取貼文列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       postId:
 *                         type: string
 *                         description: 貼文唯一識別碼
 *                       author:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             description: 作者 ID
 *                           userName:
 *                             type: string
 *                             description: 作者名稱
 *                           accountName:
 *                             type: string
 *                             description: 作者帳號名稱
 *                           avatarUrl:
 *                             type: string
 *                             description: 作者頭像網址
 *                       content:
 *                         type: string
 *                         description: 貼文內容
 *                       likesCount:
 *                         type: integer
 *                         description: 按讚數量
 *                       commentCount:
 *                         type: integer
 *                         description: 留言數量
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: 發文時間
 *                 nextCursor:
 *                   type: string
 *                   nullable: true
 *                   description: 下一頁的游標值（若為 null 則表示沒有下一頁）
 *                 hasMore:
 *                   type: boolean
 *                   description: 是否還有更多貼文可供載入
 *       400:
 *         description: 請求參數無效
 *       401:
 *         description: 未經授權的請求
 *       500:
 *         description: 伺服器內部錯誤
 */
router.get("/", authenticateJWT, getPostValidator, postController.getAllPosts);

/**
 * @swagger
 * /api/post:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Post created successfully
 */
router.post("/", authenticateJWT, postValidator, postUpload.array('images', 5), postController.createPost);

/**
 * @swagger
 * /api/post/{postId}:
 *   patch:
 *     summary: Update a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Post updated successfully
 */
router.patch("/:postId", authenticateJWT, postUpload.array('images', 5), updatePostValidator, postController.updatePost);

/**
 * @swagger
 * /api/post/{postId}:
 *   delete:
 *     summary: Delete a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post to delete
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 */
router.delete("/:postId", authenticateJWT, postIdValidator, postController.deletePost);

/**
 * @swagger
 * /api/post/{postId}/like:
 *   post:
 *     summary: Like a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post to like
 *     responses:
 *       200:
 *         description: Post liked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 */
router.post("/:postId/like", authenticateJWT, postIdValidator, postController.likePost);

/**
 * @swagger
 * /api/post/{postId}/like:
 *   delete:
 *     summary: Unlike a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post to unlike
 *     responses:
 *       200:
 *         description: Post unliked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 */
router.delete("/:postId/like", authenticateJWT, postIdValidator, postController.unlikePost);

/**
 * @swagger
 * /api/post/{postId}/comments:
 *   post:
 *     summary: Add a comment to a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post to comment on
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 */
router.post("/:postId/comments", authenticateJWT, postId_postValidator, postController.addComment);

export default router;