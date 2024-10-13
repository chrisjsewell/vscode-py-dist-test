"""Download a python distribution.

See also:
- https://gregoryszorc.com/docs/python-build-standalone/main/running.html
- https://github.com/astral-sh/rye/blob/3eb590c4df798cb2c3ab56db82720c26ac5f83f7/rye/src/bootstrap.rs#L378
"""

import argparse
import hashlib
from pathlib import Path, PurePosixPath
import platform
import shutil
import tarfile
import tempfile

import requests

DEFAULT_PYTHON_VERSION = "3.12.7"
_base_url = "https://github.com/indygreg/python-build-standalone/releases/download/"
_release = "20241008"
_dist_type = "install_only_stripped"


def decide_platform() -> str:
    system = platform.system()
    arch = platform.machine()

    if system == "Darwin":
        if arch in ("x64", "x86_64"):
            return "x86_64-apple-darwin"
        elif arch in ("aarch64", "arm64"):
            return "aarch64-apple-darwin"
    elif system == "Linux":
        if arch in ("x64", "x86_64"):
            return "x86_64-unknown-linux-gnu"
        elif arch in ("aarch64", "arm64"):
            return "aarch64-unknown-linux-gnu"
    elif system == "Windows":  # noqa: SIM102
        if arch.lower() in ("x64", "x86_64", "amd64"):
            return "x86_64-pc-windows-msvc-shared"

    raise ValueError(f"Unsupported platform: {system} {arch}")


def download_python(dest: Path, version: str, arch: str, overwrite: bool) -> str:
    if dest.exists():
        if overwrite:
            if dest.is_file():
                dest.unlink()
            else:
                shutil.rmtree(dest)
        else:
            raise FileExistsError(
                f"{str(dest)!r} already exists and '--overwrite' is not set"
            )

    url = f"{_base_url}/{_release}/cpython-{version}+{_release}-{arch}-{_dist_type}.tar.gz"
    sha_url = f"{url}.sha256"

    # download the sha file
    response = requests.get(sha_url)
    response.raise_for_status()
    sha256_hash = response.text.strip()

    temp_file = None

    try:
        # download the python distribution to a temporary file
        with requests.get(url, stream=True) as r:
            r.raise_for_status()
            with tempfile.NamedTemporaryFile("wb", delete=False) as f:
                temp_file = Path(f.name)
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)

        # verify hash
        with temp_file.open("rb") as f:
            sha256 = hashlib.sha256()
            while chunk := f.read(8192):
                sha256.update(chunk)
        downloaded_hash = sha256.hexdigest()
        if downloaded_hash != sha256_hash:
            raise ValueError(f"Hash mismatch: {downloaded_hash}")

        # unzip the python distribution
        dest.mkdir(parents=True, exist_ok=True)
        with tarfile.open(temp_file) as tar:
            tar.extractall(dest)
    finally:
        if temp_file:
            temp_file.unlink()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("dest", type=PurePosixPath, help="Destination directory")
    parser.add_argument(
        "--python-version", default=DEFAULT_PYTHON_VERSION, help="Python version"
    )
    # TODO check consistency between python version and `.python-version` file
    parser.add_argument("--arch", default=decide_platform(), help="Platform")
    parser.add_argument(
        "-o", "--overwrite", action="store_true", help="Overwrite existing files"
    )
    args = parser.parse_args()
    dest = Path(__file__).parent / args.dest
    download_python(dest, args.python_version, args.arch, args.overwrite)
