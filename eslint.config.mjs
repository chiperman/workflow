import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // 检查未使用的变量和导入
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',           // 忽略 _开头的参数
        varsIgnorePattern: '^_',           // 忽略 _开头的变量
        caughtErrorsIgnorePattern: '^_',   // 忽略 _开头的错误
        destructuredArrayIgnorePattern: '^_', // 忽略解构中的 _
        ignoreRestSiblings: true,          // 忽略 rest 属性的兄弟
      }],

      // 关闭基础规则,使用 TypeScript 版本
      'no-unused-vars': 'off',
    }
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Additional ignores:
    "node_modules/**",
    "coverage/**",
    ".husky/**",
  ]),
]);

export default eslintConfig;
