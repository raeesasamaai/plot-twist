import { defineConfig } from "vitest/config";
export default defineConfig({
  plugins: [
    {
      name: "test-static-assets",
      resolveId(id) {
        if (id === "virtual:assets") return "\0test-assets";
      },
      load(id) {
        if (id === "\0test-assets") return "export default {}";
      },
    },
  ],
  test: { include: ["src/**/*.test.ts", "server/**/*.test.ts"] },
});
