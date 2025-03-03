// src/middlewares/postMiddleware.ts
import { body, param } from 'express-validator';

export const postIdValidator = [
    param("postId")
        .isMongoId()
        .withMessage("Invalid postId format"),
];
export const postValidator = [
    body('post')
        .isString()
        .withMessage('post must be a string')
        .isLength({ min: 1, max: 280 })
        .withMessage('post must be between 1 and 280 characters'),
];
export const getPostValidator = [
    param("limit")
        .isInt({ min: 1, max: 10 })
        .withMessage("Invalid limit"),
    param("cursor")
        .isString()
        .withMessage("Invalid cursor"),
];
export const postId_postValidator = [...postIdValidator, ...postValidator];

export const updatePostValidator = [
    ...postIdValidator,
    body('content')
        .isString()
        .withMessage('updated content must be a string')
        .isLength({ min: 1, max: 280 })
        .withMessage('post must be between 1 and 280 characters'),
];