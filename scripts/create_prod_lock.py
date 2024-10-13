from pathlib import Path
import re

if __name__ == "__main__":
    lock_file = Path(__file__).parent.parent / "requirements.lock"
    text = lock_file.read_text("utf8")
    text = re.sub(r"^-e ", "", text, flags=re.MULTILINE)
    lock_file.with_name("requirements-prod.lock").write_text(text, "utf8")
