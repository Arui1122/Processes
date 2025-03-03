// src/swaggerOptions.ts
import swaggerJSDoc from "swagger-jsdoc";

// swaggerOptions.js
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "My API",
      version: "1.0.0",
      description: "API documentation for Processes",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./**/*.ts"], // 指向你的 TypeScript 文件
};

export default options;

const swaggerSpec = swaggerJSDoc(options);
// 將 JSON 文檔保存到本地
import fs from "fs";
fs.writeFileSync('./swagger.json', JSON.stringify(swaggerSpec, null, 2));