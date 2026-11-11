"""Read a task-local product DESIGN and verify its recorded content hash."""

import hashlib
import json
import os
from pathlib import Path


def selected_style():
    raw_root = os.environ.get("SYNAPSE_DESIGN_TASK_DIR")
    if not raw_root:
        raise ValueError("Set SYNAPSE_DESIGN_TASK_DIR to the task with the selected DESIGN.")
    root = Path(raw_root).resolve(strict=True)
    try:
        context = json.loads((root / "style-context.json").read_text(encoding="utf-8"))
        if context.get("schemaVersion") != 1 or not str(context.get("styleId", "")).strip():
            raise ValueError("invalid selected style context")
        guide = (root / context["guidePath"]).resolve(strict=True)
        if not guide.is_relative_to(root) or guide == root:
            raise ValueError("selected DESIGN is outside the task directory")
        data = guide.read_bytes()
        if not data or hashlib.sha256(data).hexdigest() != context.get("contentHash"):
            raise ValueError("selected DESIGN content does not match the recorded hash")
        return {"id": context["styleId"], "markdown": data.decode("utf-8"), "root": root}
    except (OSError, ValueError, KeyError, TypeError) as error:
        raise ValueError(f"Cannot read the selected product DESIGN: {error}") from error
