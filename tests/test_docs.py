"""Keep local documentation links and curated images valid."""

from __future__ import annotations

import re
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parent.parent
MARKDOWN_LINK = re.compile(r"!?\[[^\]]*]\(([^)]+)\)")


def test_local_markdown_links_resolve() -> None:
    markdown_files = [ROOT / "README.md", *sorted((ROOT / "docs").glob("*.md"))]
    broken: list[str] = []

    for document in markdown_files:
        for target in MARKDOWN_LINK.findall(document.read_text(encoding="utf-8")):
            clean_target = target.split(maxsplit=1)[0].strip("<>")
            if (
                clean_target.startswith(("http://", "https://", "mailto:", "#"))
                or not clean_target
            ):
                continue
            relative_path = unquote(clean_target.split("#", maxsplit=1)[0])
            if (
                relative_path
                and not (document.parent / relative_path).resolve().exists()
            ):
                broken.append(f"{document.relative_to(ROOT)} -> {relative_path}")

    assert broken == []


def test_curated_product_screenshots_exist() -> None:
    screenshot_directory = ROOT / "docs" / "assets" / "screenshots"
    assert {path.name for path in screenshot_directory.glob("*.png")} == {
        "contrast-dark.png",
        "create-light.png",
        "library-dark.png",
        "mobile-create.png",
        "review-dark.png",
        "suggestions-dark.png",
    }
