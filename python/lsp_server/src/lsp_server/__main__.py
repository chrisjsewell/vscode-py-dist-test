from lsprotocol import types
from pygls.server import LanguageServer

from . import __version__

server = LanguageServer(name="test-server", version=__version__)


@server.feature(types.INITIALIZE)
def initialize(ls: LanguageServer, params: types.InitializeParams) -> None:
    ls.show_message("Initialized test server!")


@server.command("test-lsp.server.getDebugInformation")
def debug_information(ls: LanguageServer, params) -> dict[str, str]:
    return {
        "name": ls.name,
        "version": __version__,
    }


server.start_io()
