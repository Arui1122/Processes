// src/middlewares/userMiddleware.ts
import { body } from 'express-validator';

export const updateUserProfileValidators = [
    body('userName')
        .optional()
        .isString()
        .withMessage('Name must be a string'),
    body('email')
        .optional()
        .isEmail()
        .withMessage('Email must be a valid email address'),
    body('isPublic')
        .optional()
        .isBoolean()
        .withMessage('isPublic must be a boolean'),
    body('bio')
        .optional()
        .isString()
        .withMessage('Bio must be a string')
        .isLength({ max: 160 })
        .withMessage('Bio must not exceed 160 characters'),
];
export const followUserValidators = [
    body('userId')
        .notEmpty()
        .withMessage('userId is required')
        .isString()
        .withMessage('Name must be a string')
        .isMongoId()
        .withMessage('userId 必須是有效的 MongoDB ID 格式'),
];
