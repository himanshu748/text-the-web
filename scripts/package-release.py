#!/usr/bin/env python3
"""Build a local source/evidence ZIP. No network, live requests, or publication."""
import hashlib
import json
import os
from pathlib import Path
import re
import stat
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "dist-release"
PREFIX = "text-the-web/"
FILES = [".env.example", ".gitignore", "README.md", "package.json", "package-lock.json", "tsconfig.json"]
DIRECTORIES = {"src": {".ts"}, "tests": {".ts"}, "scripts": {".ts", ".mjs", ".py"},
               "public": {".html", ".js", ".css"}, "docs": {".md"}}
# Explicitly reviewed evidence only: no private originals, OS permission screenshots,
# checkout pages, private data, dependency trees, or unrelated workspace projects.
EVIDENCE = [
    "tests.txt", "typecheck.txt", "build.txt", "dependency-audit.json", "secret-check.json",
    "release-verification.json", "release-tests.txt", "release-typecheck.txt", "release-build.txt",
    "live-research.json", "browser-live.txt", "offline-demo.txt",
    "browser-desktop.png", "browser-mobile.png", "demo-imessage-60s.mp4",
    "native-session-redacted.mp4", "demo-imessage-poster.png", "native-help-redacted.png",
    "native-research-redacted.png", "recording-provenance.json", "native-session-status.json",
    "native-research.json", "imessage-help.json", "self-send.json",
    "additional-request-authorization.json", "ipad-followup-verification.json",
    "native-followup-redacted.png",
]
SECRET_NAMES = {"TINYFISH_API_KEY", "SPECTRUM_PROJECT_SECRET", "SELF_IMESSAGE_ADDRESS",
                "TEST_CONVERSATION_ID", "TEST_SENDER_ID"}


def fail(code):
    raise SystemExit(code)


def known_private_values():
    values = {os.environ.get(name, "") for name in SECRET_NAMES}
    for path in (ROOT / ".env", Path.home() / ".config/tinyfish/credentials.env"):
        if path.exists():
            for line in path.read_text().splitlines():
                match = re.match(r"\s*(?:export\s+)?([A-Z_]+)\s*=\s*(.*)", line)
                if match and match[1] in SECRET_NAMES:
                    values.add(match[2].strip().strip("\"'"))
    return [value.encode() for value in values if len(value) >= 8]


def safe_file(relative):
    path = ROOT / relative
    if any(part.is_symlink() for part in (path, *path.parents) if part != ROOT.parent):
        fail("release_rejected_symlink")
    if not path.is_file() or not path.resolve().is_relative_to(ROOT):
        fail("release_missing_or_unsafe_input")
    return path.read_bytes()


def build():
    names = set(FILES + ["evidence/" + name for name in EVIDENCE])
    for directory, suffixes in DIRECTORIES.items():
        base = ROOT / directory
        if base.is_symlink():
            fail("release_rejected_symlink")
        for path in base.rglob("*"):
            if path.is_symlink():
                fail("release_rejected_symlink")
            if path.is_file() and path.suffix in suffixes:
                names.add(path.relative_to(ROOT).as_posix())
    secrets = known_private_values()
    contents = {}
    for relative in sorted(names):
        data = safe_file(relative)
        if any(secret in data for secret in secrets):
            fail("release_rejected_private_value")
        if relative == ".env.example" and data:
            fail("release_requires_empty_env_example")
        contents[relative] = data
    manifest = {
        "project": "Text the Web", "format": 1,
        "purpose": "Local source and redacted evidence handoff; no publication or live requests",
        "defaults": "Fixture research and offline messaging; no credentials or database state included",
        "liveBudget": "Existing adapter allowances remain exhausted. Do not use this copy to reset them.",
        "checks": {"emptyEnvExample": True, "knownPrivateValuesAbsent": True,
                   "symlinksExcluded": True, "explicitEvidenceAllowlist": True},
        "files": [{"path": name, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}
                  for name, data in contents.items()],
    }
    contents["RELEASE-MANIFEST.json"] = (json.dumps(manifest, indent=2) + "\n").encode()
    if OUT.is_symlink():
        fail("release_rejected_output_symlink")
    OUT.mkdir(exist_ok=True)
    target = OUT / "text-the-web-mvp.zip"
    descriptor, temporary = tempfile.mkstemp(prefix=".package-", suffix=".zip", dir=OUT)
    os.close(descriptor)
    try:
        with zipfile.ZipFile(temporary, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
            for name, data in sorted(contents.items()):
                entry = zipfile.ZipInfo(PREFIX + name, date_time=(1980, 1, 1, 0, 0, 0))
                entry.create_system = 3
                entry.external_attr = (stat.S_IFREG | 0o644) << 16
                entry.compress_type = zipfile.ZIP_DEFLATED
                archive.writestr(entry, data)
        with zipfile.ZipFile(temporary) as archive:
            if archive.testzip() is not None or set(archive.namelist()) != {PREFIX + name for name in contents}:
                fail("release_archive_verification_failed")
        os.replace(temporary, target)
        target.chmod(0o644)
    finally:
        Path(temporary).unlink(missing_ok=True)
    digest = hashlib.sha256(target.read_bytes()).hexdigest()
    checksum = OUT / "text-the-web-mvp.zip.sha256"
    if checksum.is_symlink():
        fail("release_rejected_output_symlink")
    checksum.write_text(digest + "  " + target.name + "\n")
    print(json.dumps({"code": "local_release_packaged", "archive": str(target),
                      "files": len(contents), "sha256": digest, "published": False}))


if __name__ == "__main__":
    build()
