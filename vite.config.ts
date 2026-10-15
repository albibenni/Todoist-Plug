import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    // Vitest v4 compatibility: preserve mock call history.
    // Remove after tests no longer rely on calls from setup or earlier tests.
    // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
    // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
    clearMocks: false,
    globals: true,
    environment: "jsdom",
    alias: {
      obsidian: "/src/__mocks__/obsidian.ts",
    },
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
  fmt: {
    printWidth: 80,
    tabWidth: 2,
    useTabs: false,
    endOfLine: "lf",
    singleQuote: false,
    semi: true,
    trailingComma: "all",
    quoteProps: "as-needed",
    arrowParens: "always",
    bracketSameLine: false,
    bracketSpacing: true,
    sortImports: true,
    ignorePatterns: ["coverage/**", ".github/**", "pnpm-lock.yaml", "**/*.md"],
  },
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
      "typescript/no-explicit-any": "error",
      "typescript/no-namespace": "error",
      "import/no-commonjs": "error",
      "no-debugger": "error",
      "no-async-promise-executor": "error",
      "prefer-const": "error",
      "no-var": "error",
      "no-unused-expressions": "off",
    },
    options: { typeAware: true, typeCheck: true },
  },
});
