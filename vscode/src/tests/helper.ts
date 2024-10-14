import * as vscode from "vscode";

/** Activates the extension */
export async function activate() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const ext = vscode.extensions.getExtension("chrisjsewell.test-lsp")!;
  await ext.activate();
  try {
    await sleep(1500); // Wait for server activation
  } catch (e) {
    console.error(e);
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
