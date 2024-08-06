import importPlugin from "eslint-plugin-import";
import prettierPlugin from "eslint-plugin-prettier";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import typescriptESLintPlugin from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";

const commonRules = {
  camelcase: "off",
  "jsx-quotes": ["error", "prefer-double"],
  "require-await": "error",
  "no-constant-condition": ["error", { checkLoops: "allExceptWhileTrue" }],
};

const config = [
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: "tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": typescriptESLintPlugin,
      import: importPlugin,
    },
    rules: {
      ...typescriptESLintPlugin.configs.recommended.rules,
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      ...commonRules,
    },
  },
  {
    files: ["**/*.cjs", "**/*.js", "**/*.jsx", "**/*.mjs"],
    plugins: {
      "react-refresh": reactHooksPlugin,
      import: importPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      "prettier/prettier": "warn",
      "import/no-unresolved": "error",
      "import/no-extraneous-dependencies": "error",
      ...commonRules,
    },
    settings: {
      "import/resolver": {
        typescript: true,
        node: true,
        webpack: {
          config: "webpack.config.js",
        },
      },
    },
  },
  {
    files: ["webpack.config.js"],
    rules: {
      "import/no-extraneous-dependencies": ["error", { devDependencies: true }],
    },
  },
  {
    ignores: ["**/node_modules", "build"],
  },
];

export default config;
