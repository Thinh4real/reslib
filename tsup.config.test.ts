import { defineConfig } from "tsup";
import createConfig from "./tsup";

export default defineConfig(
  createConfig("test", {
    outDir: "./dist",
  })
);
