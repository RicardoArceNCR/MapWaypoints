// eslint.config.mjs
import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["dist/**", "build/**", "node_modules/**"] },

  // Regla general para src
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      // 👇 Hace que window, document, console, Image, CustomEvent, etc. NO salgan como no-undef
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      // (opcional) permite console en dev
      "no-console": "off",
      // (opcional) permite bloques vacíos en sitios donde usas try/catch placeholders
      "no-empty": ["warn", { "allowEmptyCatch": true }],
      // (opcional) permite hasOwn sin quejarse
      "no-prototype-builtins": "off",
    },
  },

  // Ejemplo: si tu editor tiene cosas muy experimentales, puedes relajar solo ahí:
  {
    files: ["src/editor.js"],
    rules: {
      "no-unused-vars": "off",
      "no-empty": "off",
    },
  },
];
