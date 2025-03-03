// src/routes/searchRoutes.ts
import { Router } from "express";
import { authenticateJWT, optionalAuthenticateJWT } from "@src/middlewares/authenticateJWT";
import { searchController } from "@src/controllers/searchController";
import { query } from "express-validator";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Search API endpoints
 */

/**
 * @swagger
 * /api/search/posts:
 *   get:
 *     summary: Search posts using cursor pagination
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query string
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Cursor for pagination (ID of the last item from previous page)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Successful response with posts and next cursor
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
 *                       author:
 *                         type: object
 *                         properties:
 *                           id: 
 *                             type: string
 *                           userName:
 *                             type: string
 *                           accountName:
 *                             type: string
 *                           avatarUrl:
 *                             type: string
 *                       content:
 *                         type: string
 *                       likesCount:
 *                         type: integer
 *                       commentCount:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 nextCursor:
 *                   type: string
 *                   nullable: true
 *                   description: Cursor for the next page, null if no more results
 */
router.get("/posts",
    optionalAuthenticateJWT,
    [
        query('q')
            .exists()
            .withMessage('Search query is required')
            .isString()
            .withMessage('Search query must be a string'),
        query('cursor')
            .optional()
            .isString()
            .withMessage('Cursor must be a string'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 50 })
            .withMessage('Limit must be between 1 and 50')
            .toInt(),
    ],
    searchController.searchPosts
);

/**
 * @swagger
 * /api/search/users:
 *   get:
 *     summary: Search users using cursor pagination
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query string
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Cursor for pagination (ID of the last item from previous page)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Successful response with users and next cursor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       userName:
 *                         type: string
 *                       accountName:
 *                         type: string
 *                       avatarUrl:
 *                         type: string
 *                       bio:
 *                         type: string
 *                       followersCount:
 *                         type: integer
 *                       followingCount:
 *                         type: integer
 *                 nextCursor:
 *                   type: string
 *                   nullable: true
 *                   description: Cursor for the next page, null if no more results
 */
router.get("/users",
    authenticateJWT,
    [
        query('q')
            .exists()
            .withMessage('Search query is required')
            .isString()
            .withMessage('Search query must be a string'),
        query('cursor')
            .optional()
            .isString()
            .withMessage('Cursor must be a string'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 50 })
            .withMessage('Limit must be between 1 and 50')
            .toInt(),
    ],
    searchController.searchUsers
);

/**
 * @swagger
 * /api/search/comments:
 *   get:
 *     summary: Search comments using cursor pagination
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query string
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Cursor for pagination (ID of the last item from previous page)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Successful response with comments and next cursor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       commentId:
 *                         type: string
 *                       author:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           userName:
 *                             type: string
 *                           accountName:
 *                             type: string
 *                           avatarUrl:
 *                             type: string
 *                       content:
 *                         type: string
 *                       likesCount:
 *                         type: integer
 *                       repliesCount:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 nextCursor:
 *                   type: string
 *                   nullable: true
 *                   description: Cursor for the next page, null if no more results
 */
// router.get("/comments",
//     authenticateJWT,
//     [
//         query('q')
//             .exists()
//             .withMessage('Search query is required')
//             .isString()
//             .withMessage('Search query must be a string'),
//         query('cursor')
//             .optional()
//             .isString()
//             .withMessage('Cursor must be a string'),
//         query('limit')
//             .optional()
//             .isInt({ min: 1, max: 50 })
//             .withMessage('Limit must be between 1 and 50')
//             .toInt(),
//     ],
//     searchController.searchComments
// );

export default router;