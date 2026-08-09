import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tseslint from "typescript-eslint";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Endurece regras que já são a causa raiz de bugs reais encontrados na
    // revisão de código (crash de Rules of Hooks, `any` escondendo bugs de
    // schema, promises de Server Action ignoradas silenciosamente).
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": ["warn", { allow: ["error", "warn"] }],
    },
  },
  {
    // `no-floating-promises` exige informação de tipos — habilitado só aqui
    // para não pagar o custo de type-aware linting no projeto inteiro.
    files: ["**/*.ts", "**/*.tsx"],
    plugins: { "@typescript-eslint": tseslint.plugin },
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
