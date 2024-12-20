// routes/feedRoutes.ts
import { Router } from "express";
import { Request, Response } from "express";
import { authenticateJWT } from "@src/middlewares/authenticateJWT";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Search
 */

// 搜索動態
/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Search feed based on keywords
 *     description: Search posts in the user's feed by keywords with pagination
 *     tags: [Feed]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Search query for finding posts
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Successful response.
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
 *                         description: Unique identifier for the post
 *                       author:
 *                         type: string
 *                         description: ID of the post author
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                         description: Time the post was created
 *                       content:
 *                         type: string
 *                         description: Content of the post
 *                       likesCount:
 *                         type: integer
 *                         description: Number of likes on the post
 *                       commentCount:
 *                         type: integer
 *                         description: Number of comments on the post
 *             example:
 *               posts:
 *                 - postId: "posf8c44b5476442122156c9"
 *                   author: "5f8f8c44b54764421b7156c9"
 *                   timestamp: "2024-10-30T08:15:30Z"
 *                   content: "Exploring the city today!"
 *                   likesCount: 20
 *                   commentCount: 5
 *                 - postId: "posf8c44b54764421b7156c9"
 *                   author: "5f8f8c44b54764421b7156c9"
 *                   timestamp: "2024-10-29T14:20:30Z"
 *                   content: "A day well spent with friends."
 *                   likesCount: 30
 *                   commentCount: 7
 *       400:
 *         description: Invalid query parameters.
 *       500:
 *         description: Internal server error.
 */
router.get("/", authenticateJWT, async (req: Request, res: Response): Promise<void> => {
    const { query } = req.query;
    if (!query) {
        res.status(400).json({ message: "Query parameter is required." });
        return;
    }

    const mockSearchResults = [
        {
            postId: "posf8c44b54764421b7156c9",
            author: "5f8f8c44b54764421b7156c9",
            timestamp: "2024-10-30T08:15:30Z",
            content: "Exploring the city today!",
            likesCount: 20,
            commentCount: 5,
        },
        {
            postId: "posf8c44b54764421b7156e1",
            author: "5f8f8c44b54764421b7156c9",
            timestamp: "2024-10-29T14:20:30Z",
            content: "A day well spent with friends.",
            likesCount: 30,
            commentCount: 7,
        },
    ];

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (page < 1) {
        res.status(400).json({ message: "Invalid page number." });
        return;
    }

    res.status(200).json({
        posts: mockSearchResults.slice((page - 1) * limit, page * limit),
    });
});

export default router;
