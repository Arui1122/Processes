// src/middlewares/eventMiddleware.ts
import { query } from 'express-validator';

export const getEventsValidators = [
    query('cursor')
        .optional()
        .isInt({ min: 0 })
        .withMessage("Invalid event ID format."),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be an integer between 1 and 100.')
];