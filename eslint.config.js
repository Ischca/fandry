import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // React hooks - use legacy recommended rules (less strict)
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      // TSX files: max 500 lines
      "max-lines": [
        "error",
        {
          max: 500,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      // Unused vars - allow underscore prefix
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Allow any for now (gradual migration)
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    // Server files: slightly relaxed (600 lines)
    files: ["server/**/*.ts"],
    rules: {
      "max-lines": [
        "error",
        {
          max: 600,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
    },
  },
  {
    // shadcn/ui components are auto-generated, exempt from max-lines
    files: ["client/src/components/ui/**/*.tsx"],
    rules: {
      "max-lines": "off",
    },
  },
  {
    // Node.js scripts - allow globals
    files: ["*.mjs", "scripts/**/*.mjs"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
      },
    },
  },
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "*.config.js",
      "*.config.ts",
      "drizzle/**",
      "scripts/**",
      "*.mjs",
    ],
  }
);
