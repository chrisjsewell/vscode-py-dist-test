"""A test LSP server in Python."""

from lsprotocol import types
from pygls.server import LanguageServer

__version__ = "0.0.1"

if __name__ == "__main__":
    server = LanguageServer(name="my-lsp-server", version=__version__)

    @server.feature(types.INITIALIZE)
    def initialize(ls: LanguageServer, params: types.InitializeParams) -> None:
        ls.show_message("Initialized my server!")

    server.start_io()
