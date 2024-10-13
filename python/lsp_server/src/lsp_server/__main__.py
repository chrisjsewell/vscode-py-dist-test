from lsprotocol import types
from pygls.server import LanguageServer

from . import __version__

server = LanguageServer(name="test-server", version=__version__)


@server.feature(types.INITIALIZE)
def initialize(ls: LanguageServer, params: types.InitializeParams) -> None:
    ls.show_message("Initialized test server!")


server.start_io()
