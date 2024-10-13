/* eslint-disable no-undef */
/**
  see: https://code.visualstudio.com/api/working-with-extensions/bundling-extension#run-esbuild
 *
  The build script does the following:

  - It creates a build context with esbuild. The context is configured to:
    - Bundle the code in src/extension.ts into a single file dist/extension.js.
    - Minify the code if the --production flag was passed.
    - Generate source maps unless the --production flag was passed.
    - Exclude the 'vscode' module from the bundle (since it's provided by the VS Code runtime).
  - Use the esbuildProblemMatcherPlugin plugin to report errors that prevented the bundler to complete. This plugin emits the errors in a format that is detected by the esbuild problem matcher with also needs to be installed as an extension.
  - If the --watch flag was passed, it starts watching the source files for changes and rebuilds the bundle whenever a change is detected.
 */
import * as esbuild from "esbuild";

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

async function main() {
  const ctx = await esbuild.context({
    entryPoints: ["src/extension.ts"],
    bundle: true,
    format: "cjs",
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: "node",
    outfile: "dist/extension.js",
    external: ["vscode"],
    logLevel: "silent",
    plugins: [
      /* add to the end of plugins array */
      esbuildProblemMatcherPlugin,
    ],
  });
  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
  name: "esbuild-problem-matcher",

  setup(build) {
    build.onStart(() => {
      console.log("[watch] build started");
    });
    build.onEnd((result) => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        console.error(
          `    ${location.file}:${location.line}:${location.column}:`,
        );
      });
      console.log("[watch] build finished");
    });
  },
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
