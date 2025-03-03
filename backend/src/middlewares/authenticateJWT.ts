// src/middlewares/authenticateJWT.ts
import passport from "passport";
import { Request, Response, NextFunction } from "express";
import { userService } from "../services/userService"; // 假設你有此 userService

export const authenticateJWT = passport.authenticate('jwt', { session: false });

// optionalAuthenticateJWT: 若有合法 JWT，則設定 req.user；若無或無效，則不擋下請求，直接進入下一步
export const optionalAuthenticateJWT = (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("jwt", { session: false }, async (err: Error | null, userPayload: { id: string; }) => {
        if (err) {
            return next(err);
        }

        if (userPayload) {
            try {
                // 根據解析出的 ID 查找使用者
                const user = await userService.findUserById(userPayload.id);
                if (user) {
                    req.user = user; // 驗證成功，設置 req.user
                } else {
                    req.user = undefined; // JWT 有效但找不到使用者
                }
            } catch (error) {
                console.error("Error finding user:", error);
                req.user = undefined;
            }
        } else {
            // 沒有提供 JWT 或 JWT 驗證失敗時，req.user = undefined
            req.user = undefined;
        }

        // 不論有無驗證成功，都繼續往下
        return next();
    })(req, res, next);
};
