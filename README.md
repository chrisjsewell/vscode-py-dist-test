# vscode-py-dist-test

A repo to test how to package a vscode extension that uses a Python LSP.

The goal is to have a single `.vsix` file (per architecture) that can be installed in vscode and that will work without any additional setup.

## Usage

Install from: <https://marketplace.visualstudio.com/items?itemName=chrisjsewell.test-lsp>

Very simply, once the extension is installed, open a Markdown file and you should see the Python LSP start up with a pop-up message: "Initialized test server!".

You can also open the output panel and see the logs from the language server,
or use the "Test LSP: Restart language server" command to restart the language server.

## Development

The repository is setup as a monorepo using [rye](https://rye.astral.sh) to manage the Python side of the extension, and [npm](https://www.npmjs.com/) to manage the VSCode extension.
It has the following structure:

- `python/`: the Python server side of the extension, potentially containing multiple packages
- `vscode/`: the VSCode client side of the extension
- `.vscode/`: VSCode specific configuration files

To "setup" a development version of the extension:

1. clone the repository
2. run `cd vscode; npm ci` to install the dependencies for the VSCode extension
3. run `rye run bundle:dev` to create the bundled Python environment, with local packages installed in development mode, or `rye run bundle:prod` to install them in production mode
4. Press `F5` to start the extension in a new VSCode window

For developing the code:

- Run `rye sync` to create a virtual environment with the packages installed in development mode and `rye test -a` to run the tests
- Use [pre-commit](https://pre-commit.com/) to run the linters and formatters

To distribute the extension:

- Update the version with `rye run bumpver:patch` (or `minor`/`major`)
- Create a release on GitHub with the tag `vX.Y.Z`
- The GitHub action will run the CI (on new tags) and create/upload the `.vsix` files (per architecture) to the Marketplace

## Considerations

### Python Environment

A number of known VSCode extensions that use Python (like [mypy](https://github.com/microsoft/vscode-mypy/tree/v2023.6.0)), use the strategy:

- search for a Python interpreter, using the one set for the workspace, or one specified by the user
- inject packages bundled with the extension into that Python environment
- start a language server that uses that Python environment

This has a number of drawbacks:

- the user needs to have a Python interpreter installed and setup an environment
- the bundled packages may have compatibility issues with the Python interpreter,
  especially if any of the packages have C/C++/Rust extensions, then you need to bundle the packages for all possible python versions
- injecting packages into the Python environment may cause conflicts with other packages

The goal of this repo is to test an alternative strategy:

- bundle a Python interpreter with the extension, together with all the packages needed in a virtual environment
- start a language server that uses that Python environment

This will likely have a larger extension size, but should be more reliable and easier to use,
and it also means that we can focus on writing/testing the Python code only against a single Python version.

Similar to [rye](https://rye.astral.sh), we will look to source the Python interpreter from <https://github.com/indygreg/python-build-standalone>.

We will also use [rye](https://rye.astral.sh/guide/workspaces/) to setup the repository as a monorepo for the python side, with scripts to build/bundle the extension etc.
Note, eventually we may want to move to using [uv](https://docs.astral.sh/uv/concepts/workspaces/) directly instead of rye,
but for now rye has some feature that are not available with uv (like script execution).

### VSCode Extension

The VSCode extension will be a simple extension that is activates the language server when a Markdown file is opened.

### Other

Something to note is that the `.vsix` file must be smaller than 250MB to be uploaded to the marketplace,
so we have to be careful about the size of the Python interpreter and packages we bundle.

## TODOs

- checking licensing for the Python interpreter and packages.
  indygreg mentions [here](https://gregoryszorc.com/docs/python-build-standalone/main/running.html#licensing) that
  there should be no GPL (i.e. copy-left) licenses in the Python interpreter, but I'm not sure where the JSON he mentions is,
  also should check the licenses of the packages we bundle.
