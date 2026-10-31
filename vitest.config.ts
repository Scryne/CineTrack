import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
    resolve: { alias: { "@": path.resolve(__dirname, ".") } },
    test: {
        environment: "jsdom",
        include: ["tests/**/*.test.ts"],
        // Testler hiçbir zaman gerçek Supabase'e ya da TMDB'ye gitmez.
        env: { NEXT_PUBLIC_DATA_MODE: "local", NEXT_PUBLIC_TMDB_KEY: "test-key" },
    },
});
