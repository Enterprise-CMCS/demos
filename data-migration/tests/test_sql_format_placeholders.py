"""Guard against pg_format mangling format() placeholders inside SQL.

pg_format reflows the contents of dollar-quoted ($q$...$q$) blocks as if they
were nested SQL. When such a block holds a ``format()`` template, pg_format
reads the ``%`` of a ``%N$I``/``%N$L``/``%N$s`` positional placeholder as the
modulo operator and pads it with spaces, turning ``%1$I`` into ``% 1$I``. That
breaks the ``format()`` call at runtime, and -- because the mangled output is
itself round-trip stable -- ``scripts/sql_fmt.py``'s round-trip guard does not
catch it. Single-quoted format strings are treated as opaque literals and are
left intact, so the convention is to keep format() templates single-quoted.

This test scans every hand-written SQL file for the mangle signature so the
regression cannot reappear silently.
"""

from __future__ import annotations

import importlib.util
import re
import sys
from pathlib import Path

_SCRIPTS_DIR = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(_SCRIPTS_DIR))


def _load(name: str):
    spec = importlib.util.spec_from_file_location(name, _SCRIPTS_DIR / f"{name}.py")
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


sql_fmt = _load("sql_fmt")

# A format() positional placeholder is %N$T (T in I/L/s). The pg_format mangle
# inserts whitespace between % and the argument number: "% 1$I".
BROKEN_PLACEHOLDER = re.compile(r"%\s+\d+\$[ILs]")


def test_no_space_broken_format_placeholders():
    offenders: list[str] = []
    for path in sql_fmt.in_scope_files():
        text = path.read_text()
        for match in BROKEN_PLACEHOLDER.finditer(text):
            line = text.count("\n", 0, match.start()) + 1
            offenders.append(f"{path}:{line}: {match.group(0)!r}")
    assert not offenders, "pg_format mangled format() placeholder(s):\n" + "\n".join(offenders)
