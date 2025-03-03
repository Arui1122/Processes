// src/routes/authRoutes.ts
import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { userService } from "@src/services/userService";
import { Request, Response } from "express";
import { JWT_SECRET } from "@src/config/config";
import { validationResult } from "express-validator";
import { loginValidators, registerValidators } from "@src/middlewares/authMiddleware";
const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication and registration
 */

// 本地登錄
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The user's email address
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 description: The user's password, must be at least 6 characters long
 *                 example: "password123!"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token for authorization
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       404:
 *         description: User not found
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
 *                         example: "找不到使用者"
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
 *                         example: "密碼錯誤"
 *       500:
 *         description: Server error
 * 
 */
router.post("/login",
  loginValidators,
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
      const user = await userService.findUserByEmailWithPassword(email);
      if (!user) {
        res.status(404).json({ error: "找不到使用者" });
        return;
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(400).json({ error: "密碼錯誤" });
        return;
      }

      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });
      res.status(200).json({ token });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "伺服器發生錯誤" });
    }
  });

// 註冊新用戶
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: User registration
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: The user's chosen username, must be between 3 and 20 characters long
 *                 example: "john_doe"
 *               email:
 *                 type: string
 *                 description: The user's email address
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 description: The user's password
 *                 example: "password123!"
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "註冊成功"
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
 *                         example: "此信箱已被註冊"
 */
router.post("/register",
  registerValidators,
  async (req: Request, res: Response) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const { userName, accountName, email, password } = req.body;

    try {
      const existingUser = await userService.findUserByCondition({
        $or: [{ email }, { accountName }]
      });

      if (existingUser) {
        if (existingUser.email === email) {
          res.status(400).json({ error: "此信箱已被註冊" });
          return;
        }
        if (existingUser.accountName === accountName) {
          res.status(400).json({ error: "此帳號名稱已被註冊" });
          return;
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await userService.createUser({
        userName,
        accountName,
        email,
        password: hashedPassword,
      });

      res.status(201).json({ message: "註冊成功" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "伺服器發生錯誤" });
    }
  });

export default router;
