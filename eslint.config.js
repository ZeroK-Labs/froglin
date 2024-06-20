import importPlugin from "eslint-plugin-import";
import prettierPlugin from "eslint-plugin-prettier";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import typescriptESLintPlugin from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";

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
      "require-await": "error",
    },
  },
  {
    files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
    plugins: {
      "react-refresh": reactHooksPlugin,
      import: importPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      "no-constant-condition": ["error", { checkLoops: "allExceptWhileTrue" }],
      "import/no-unresolved": "error",
      "import/no-extraneous-dependencies": "error",
      "prettier/prettier": "warn",
      "require-await": "error",
      camelcase: "off",
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
    overrides: [
      {
        files: ["webpack.config.js"],
        rules: {
          "import/no-extraneous-dependencies": ["error", { devDependencies: true }],
        },
      },
    ],
  },
  {
    ignores: ["**/node_modules", "build"],
  },
];

export default config;
