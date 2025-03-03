// src/routes/eventRoutes.ts
import { Router } from "express";
import { authenticateJWT } from "@src/middlewares/authenticateJWT";
import { getEventsValidators } from "@src/middlewares/eventMiddleware";
import { eventController } from "@src/controllers/eventController";
const router = Router();
/**
 * @swagger
 * tags:
 *   name: Event
 *   description: User's events, only accessible to authenticated users
 */

// 獲取用戶的所有事件
/**
 * @swagger
 * /api/event:
 *   get:
 *     summary: Retrieve notifications with pagination
 *     description: Fetch notifications with details about sender, receiver, timestamp, and event information.
 *     tags: [Event]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *                 events:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       sender:
 *                         type: string
 *                         description: ID of the sender
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                         description: Time the notification was created
 *                       event:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             description: Type of the event
 *                           content:
 *                             type: string
 *                             description: Template or content of the event
 *             example:
 *               events:
 *                 - sender: "5f8f8c44b54764421b7156c9"
 *                   timestamp: "2024-10-30T10:15:30Z"
 *                   event:
 *                     type: "like"
 *                     content: "User xxx liked your post"
 *                 - sender: "5f8f8c44b54764421b7156c9"
 *                   timestamp: "2024-10-30T10:11:30Z"
 *                   event:
 *                     type: "follow"
 *                     content: "User xxx commented on your post"
 *       400:
 *         description: Invalid query parameters.
 *       500:
 *         description: Internal server error.
 */
router.get("/", authenticateJWT, getEventsValidators, eventController.getEvents);

export default router;