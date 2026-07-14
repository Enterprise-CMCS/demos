"""Shared logging helpers for the data tools scripts."""

from __future__ import annotations

import logging
from datetime import datetime
from pathlib import Path


def get_logger(name: str, verbose: bool = False) -> logging.Logger:
    """Return a configured logger for a module.

    Args:
        name (str): The logger name to initialize.
        verbose (bool): Whether to enable debug-level logging.

    Returns:
        logging.Logger: The configured logger instance.
    """
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG if verbose else logging.INFO)

    if logger.handlers:
        return logger

    log_dir = Path(__file__).parent / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)

    console_handler = logging.StreamHandler()
    log_file = log_dir / f"log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
    file_handler = logging.FileHandler(log_file)

    log_formatter = logging.Formatter(
        "[%(asctime)s] %(levelname)-8s - %(funcName)s() in %(name)s[%(lineno)d]: %(message)s",
        "%Y-%m-%d %H:%M:%S %z",
    )
    console_handler.setFormatter(log_formatter)
    file_handler.setFormatter(log_formatter)

    logger.addHandler(console_handler)
    logger.addHandler(file_handler)
    return logger
