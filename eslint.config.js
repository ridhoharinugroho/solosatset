import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        __dirname: "readonly",
        __filename: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^(_|err|e$)"
      }],
      "no-undef": "warn",
      "no-prototype-builtins": "off",
      "no-empty": ["warn", { "allowEmptyCatch": true }],
      "no-useless-escape": "off",
      "no-useless-assignment": "off",
      "no-self-assign": "off",
      "no-constant-binary-expression": "off",
    },
  },
  {
    ignores: ["dist/", "node_modules/", "brain/", "coverage/", ".gemini/"],
  },
];
