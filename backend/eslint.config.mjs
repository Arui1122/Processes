// backend/.eslintrc.mjs
import js from "@eslint/js";
import globals from "globals";
import ts from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  // 對 JavaScript 文件的配置
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.jest, // 加入 Jest 的全局變數支持
      },
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },

  // 對 TypeScript 文件的配置
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.node,
        ...globals.jest, // 加入 Jest 的全局變數支持
      },
    },
    plugins: {
      "@typescript-eslint": ts,
    },
    rules: {
      ...ts.configs.recommended.rules,
      // 您的自訂規則（可選）
      // 例如：
      // "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
