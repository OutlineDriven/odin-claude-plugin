"""Shared config loader: reads config.yaml from the scripts directory (adjacent to this module)."""

from pathlib import Path

import yaml

_CONFIG_DIR = Path(__file__).resolve().parent
_DEFAULTS = {
    "max_trials": 8,
    "early_stop_speedup": 3.0,
    "perf_stat_enabled": True,
    "vtune_enabled": False,
    "vtune_bin": "/opt/intel/oneapi/vtune/latest/bin64/vtune",
    "build_command": "kernel-builder build --release",
    "install_command": "pip install dist/*.whl --force-reinstall --no-deps",
}


def load_config() -> dict[str, object]:
    """Load config.yaml; missing keys fall back to defaults, a missing file is an error."""
    config_path = _CONFIG_DIR / "config.yaml"
    if not config_path.exists():
        raise FileNotFoundError(
            f"config file not found: {config_path}. The skill stops and reports "
            "rather than assuming trial and profiling settings."
        )
    with open(config_path) as f:
        cfg = yaml.safe_load(f) or {}
    return {**_DEFAULTS, **cfg}
