// src/middlewares/commentMiddleware.ts
import { body, param } from 'express-validator';

export const commentIdValidator = [
    param("commentId")
        .isMongoId()
        .withMessage("Invalid commentId format"),
];
const commentValidator = [
    body('comment')
        .isString()
        .withMessage('comment must be a string')
        .isLength({ min: 1, max: 280 })
        .withMessage('comment must be between 1 and 280 characters'),
];
export const commentId_commentValidator = [...commentIdValidator, ...commentValidator];