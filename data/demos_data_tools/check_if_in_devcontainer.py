"""Simple function to check and exit if the program is not within a devcontainer."""

import os
import sys
from logging import getLogger

from logger_utils import config_logger

logger = config_logger(getLogger(__name__))


def check_if_in_devcontainer() -> None:
    """Loosely check if we are within a devcontainer, and exit if not."""
    logger.info("Checking if executing in a devcontainer")
    is_devcontainer = os.environ.get("DEVCONTAINER") == "true"
    if not is_devcontainer:
        logger.error("This tool should only be used from within the devcontainer - exiting now!")
        sys.exit(3)
    else:
        logger.info("Devcontainer check passed")


if __name__ == "__main__":
    check_if_in_devcontainer()
