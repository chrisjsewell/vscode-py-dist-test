import * as vscode from "vscode";
import {
  LanguageClient,
  RevealOutputChannelOn,
  State,
} from "vscode-languageclient/node";

const serverId = "test-lsp";
const serverName = "Test LSP";

let serverManager: ServerManager;

/** This method is called when the extension is activated */
export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  const logger = vscode.window.createOutputChannel(serverName, {
    log: true,
  });
  logger.info("Activating extension");
  serverManager = new ServerManager(context, logger);

  context.subscriptions.push(
    // TODO restart on configuration change (only if affects server)
    vscode.commands.registerCommand(`${serverId}.server.restart`, async () => {
      await serverManager.restart();
    }),
  );

  // Start the server
  setImmediate(async () => {
    await serverManager.restart();
  });
}

/** This method is called when the extension is deactivated */
export function deactivate(): Promise<void> | undefined {
  return serverManager.stop();
}

/** Manages the lifecycle of the language server */
class ServerManager {
  private client?: LanguageClient;
  private restartInProgress = false;
  private restartQueued = true;

  constructor(
    private context: vscode.ExtensionContext,
    private logger: vscode.LogOutputChannel,
  ) {}

  /** Stop the language server */
  public async stop() {
    if (this.client && this.client.state === State.Running) {
      await this.client.stop();
    }
    return;
  }

  /** (re)start the server */
  public async restart() {
    // Prevent multiple concurrent restarts
    if (this.restartInProgress) {
      this.restartQueued = true;
      return;
    }
    this.restartInProgress = true;

    if (this.client) {
      this.logger.info("Restarting server");
      await this.client.stop();
      // TODO dispose of disposables
    } else {
      this.logger.info("Starting server");
    }

    this.client = new LanguageClient(
      serverId,
      serverName,
      {
        command: this.context.asAbsolutePath("server/python/bin/python"),
        args: ["-m", "lsp_server"],
        // TODO options (cwd, env),
      },
      {
        documentSelector: [{ scheme: "file", language: "markdown" }],
        outputChannel: this.logger,
        traceOutputChannel: this.logger,
        revealOutputChannelOn: RevealOutputChannelOn.Never,
        // TODO initializationOptions
      },
    );
    try {
      await this.client.start();
    } catch (ex) {
      this.logger.error(`Server: Start failed: ${ex}`);
      return undefined;
    }

    this.restartInProgress = false;
    if (this.restartQueued) {
      this.restartQueued = false;
      await this.restart();
    }
  }
}
