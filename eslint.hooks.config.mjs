// Rules-of-Hooks check only. A hook called after a conditional return changes
// the hook count between renders, which React rejects at runtime with
// "Rendered more hooks than during the previous render" — a whole-page crash
// that typecheck and build both pass cleanly.
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default [
  { ignores: ["dist/**", "node_modules/**"] },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: { parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { "react-hooks": reactHooks },
    rules: { "react-hooks/rules-of-hooks": "error" },
  },
];
