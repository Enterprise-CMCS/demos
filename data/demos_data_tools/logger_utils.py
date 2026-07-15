"""Shared logging helpers for the data tools scripts."""

import logging
from datetime import datetime
from typing import TYPE_CHECKING

# Note these imports are done in this fashion to make the mocking easier in tests
from logging import FileHandler, Formatter, StreamHandler, getLogger
from pathlib import Path

if TYPE_CHECKING:  # pragma: no cover
    from logging import Logger

LOG_DIR = Path(__file__).parent / "logs"
_CONFIGURED_FLAG = "_demos_data_tools_configured"


def get_logger(name: str, verbose: bool = False) -> "Logger":
    """Return a configured logger for a module.

    Args:
        name (str): The logger name to initialize.
        verbose (bool): Whether to enable debug-level logging.

    Returns:
        Logger: The configured logger instance.
    """
    logger = getLogger(name)

    # We use this sentinel to avoid reconfiguring a logger that's already set up
    if getattr(logger, _CONFIGURED_FLAG, False):
        return logger

    logger.setLevel(logging.DEBUG if verbose else logging.INFO)
    LOG_DIR.mkdir(parents=True, exist_ok=True)

    console_handler = StreamHandler()
    log_file = LOG_DIR / f"log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
    file_handler = FileHandler(log_file, delay=True)

    log_formatter = Formatter(
        "[%(asctime)s] %(levelname)-8s - %(funcName)s() in %(name)s[%(lineno)d]: %(message)s",
        "%Y-%m-%d %H:%M:%S %z",
    )
    console_handler.setFormatter(log_formatter)
    file_handler.setFormatter(log_formatter)

    logger.addHandler(console_handler)
    logger.addHandler(file_handler)
    setattr(logger, _CONFIGURED_FLAG, True)
    return logger
