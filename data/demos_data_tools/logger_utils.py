"""Shared logging helpers for the data tools scripts."""

from typing import TYPE_CHECKING

# Note these imports are done in this fashion to make the mocking easier in tests
from logging import Formatter, StreamHandler, INFO as INFO_LOG_LEVEL

if TYPE_CHECKING:  # pragma: no cover
    from logging import Logger

_CONFIGURED_FLAG = "_demos_data_tools_configured"


def config_logger(logger_to_configure: "Logger") -> "Logger":
    """Configure a logger with standard formatting.

    Args:
        logger_to_configure (Logger): The logger to configure.

    Returns:
        Logger: The configured logger.
    """
    # We use this sentinel to avoid reconfiguring a logger that's already set up
    if getattr(logger_to_configure, _CONFIGURED_FLAG, False):
        return logger_to_configure

    console_handler = StreamHandler()
    console_handler.setFormatter(
        Formatter(
            "[%(asctime)s] %(levelname)-8s - %(funcName)s() in %(module)s[%(lineno)d]: %(message)s",
            "%Y-%m-%d %H:%M:%S %z",
        )
    )
    logger_to_configure.addHandler(console_handler)
    logger_to_configure.setLevel(INFO_LOG_LEVEL)
    setattr(logger_to_configure, _CONFIGURED_FLAG, True)
    return logger_to_configure
