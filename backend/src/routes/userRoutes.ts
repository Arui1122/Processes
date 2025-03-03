// src/routes/userRoutes.ts
import { Router } from "express";
import { userController } from "@src/controllers/userController";
import { authenticateJWT } from "@src/middlewares/authenticateJWT"; // 這是一個身份驗證中間件
import { followUserValidators } from "@src/middlewares/userMiddleware"; // 這是一個驗證用戶請求的中間件
import { avatarUpload } from "@src/config/multer";
const router = Router();
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

// 獲得個人資訊
/**
 * @swagger
 * /api/user/{userId}:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve a user's profile information. If requesting one's own profile, full information is returned, otherwise limited public information is provided.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []  # JWT authentication
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to retrieve
 *         example: "60f7b4d9f42b5c0018c0b5a5"
 *     responses:
 *       200:
 *         description: Successfully retrieved user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: The user's ID
 *                   example: "60f7b4d9f42b5c0018c0b5a5"
 *                 accountName:
 *                   type: string
 *                   example: "johndoe123"
 *                 userName:
 *                   type: string
 *                   example: "John Doe"
 *                 email:
 *                   type: string
 *                   description: Only available if authenticated user is requesting their own profile
 *                   example: "john@example.com"
 *                 bio:
 *                   type: string
 *                   example: "Passionate about technology and open source."
 *                 avatarUrl:
 *                   type: string
 *                   example: "https://example.com/avatar.jpg"
 *                 followersCount:
 *                   type: integer
 *                   example: 120
 *                 followingCount:
 *                   type: integer
 *                   example: 80
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2021-07-21T17:32:28Z"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "使用者不存在"
 *       500:
 *         description: Server error
 */
router.get("/:userId", authenticateJWT, userController.getUserProfile);
// 更新用戶資料
/**
 * @swagger
 * /api/user:
 *   patch:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []  # JWT authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: New username for the user
 *                 example: "new_username"
 *               email:
 *                 type: string
 *                 description: New email for the user
 *                 example: "new_email@example.com"
 *               isPublic:
 *                 type: boolean
 *                 description: Whether the user's profile is public
 *                 example: true
 *               bio:
 *                 type: string
 *                 description: Short biography for the user, max 100 characters
 *                 example: "Enthusiastic developer and tech lover."
 *                 maxLength: 100
 *     responses:
 *       200:
 *         description: User profile successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "使用者資料已更新"
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60f7b4d9f42b5c0018c0b5a5"
 *                     username:
 *                       type: string
 *                       example: "new_username"
 *                     email:
 *                       type: string
 *                       example: "new_email@example.com"
 *                     isPublic:
 *                       type: boolean
 *                       example: true
 *                     bio:
 *                       type: string
 *                       example: "Enthusiastic developer and tech lover."
 *       400:
 *         description: Validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       msg:
 *                         type: string
 *                         example: "Bio must not exceed 100 characters"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "使用者不存在"
 *       500:
 *         description: Server error
 */
router.patch("/", authenticateJWT, avatarUpload.array('avatarUrl', 1), userController.updateUserProfile);
// 關注用戶
/**
 * @swagger
 * /api/user/follow:
 *   post:
 *     summary: Follow a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []  # JWT 驗證
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The ID of the user to follow
 *                 example: "5f8f8c44b54764421b7156c9"
 *     responses:
 *       200:
 *         description: Successfully followed the user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "成功追蹤使用者"
 *       400:
 *         description: Invalid request, such as trying to follow oneself or missing/invalid userId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example:
 *                     validationError:
 *                       value: "請求內容錯誤"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "找不到或已經追蹤該使用者"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "伺服器發生錯誤"
 */
router.post("/follow", authenticateJWT, followUserValidators, userController.followUser);
/**
 * @swagger
 * /api/user/unfollow:
 *   post:
 *     summary: Unfollow a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []  # JWT 驗證
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The mongo objectID of the user to unfollow
 *                 example: "5f8f8c44b54764421b7156c9"
 *     responses:
 *       200:
 *         description: Successfully unfollowed the user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "成功取消追蹤使用者"
 *       400:
 *         description: Invalid request, such as missing/invalid userId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "請求內容錯誤"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "找不到或尚未追蹤該使用者"
 *       500:
 *         description: Server error
 */
router.post("/unfollow", authenticateJWT, followUserValidators, userController.unfollowUser);

// 接受用戶追隨
router.post("/accept-follow", authenticateJWT, followUserValidators, userController.acceptFollowRequest);

// 拒絕用戶追隨
router.post("/reject-follow", authenticateJWT, followUserValidators, userController.rejectFollowRequest);
export default router;
