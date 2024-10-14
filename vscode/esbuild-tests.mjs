/* eslint-disable no-undef */
/**
  see: https://code.visualstudio.com/api/working-with-extensions/bundling-extension#run-esbuild
 *
  The build script builds the tests with esbuild.
 */
import * as esbuild from "esbuild";

async function main() {
  const ctx = await esbuild.context({
    entryPoints: ["src/tests/*.ts"],
    bundle: false,
    format: "cjs",
    minify: false,
    sourcemap: false,
    sourcesContent: false,
    platform: "node",
    outdir: "out/tests/",
    logLevel: "silent",
  });
  await ctx.rebuild();
  await ctx.dispose();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
