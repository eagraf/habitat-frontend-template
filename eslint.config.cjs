import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import { fixupConfigRules } from "@eslint/compat";
import tsParser from "@typescript-eslint/parser";
import reactRefresh from "eslint-plugin-react-refresh";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([
    ...fixupConfigRules(compat.extends(
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:react-hooks/recommended",
    )),
    {
        languageOptions: {
            globals: {
                ...globals.browser,
            },
            parser: tsParser,
        },

        plugins: {
            "react-refresh": reactRefresh,
        },

        rules: {
            "react-refresh/only-export-components": ["warn", {
                allowConstantExport: true,
            }],
        },
    },
    globalIgnores(["**/dist", "**/.eslintrc.cjs"])
]);
