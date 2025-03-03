// src/middlewares/authenticateJWT.ts
import { body } from 'express-validator';

export const loginValidators = [
    body('email')
        .notEmpty()
        .withMessage('Email 欄位必填')
        .isEmail()
        .withMessage('Email 格式不正確'),

    body('password')
        .notEmpty()
        .withMessage('密碼 欄位必填')
        .isLength({ min: 6 })
        .withMessage('密碼長度至少需要 6 位'),
];

export const registerValidators = [
    body('userName')
        .notEmpty()
        .withMessage('使用者名稱 必填')
        .isLength({ min: 3, max: 20 })
        .withMessage('使用者名稱長度需在 3 到 20 位之間'),

    body("accountName")
        .notEmpty()
        .withMessage("帳號名稱 必填")
        .isLength({ min: 3, max: 20 })
        .withMessage("帳號名稱長度需在 3 到 20 位之間"),

    body('email')
        .notEmpty()
        .withMessage('Email 欄位必填')
        .isEmail()
        .withMessage('Email 格式不正確'),

    body('password')
        .notEmpty()
        .withMessage('密碼 欄位必填')
        .isLength({ min: 6 })
        .withMessage('密碼長度至少需要 6 位'),
];