"""A module containing tests for the logger.py file."""

import logging

import pytest

import logger as logger_utils


@pytest.fixture
def isolated_logger(tmp_path, mocker):
    """Provide a logger name with isolated filesystem side effects."""

    logger_name = f"test_logger_{tmp_path.name}"
    mocker.patch.object(logger_utils, "__file__", str(tmp_path / "logger.py"))
    test_logger = logging.getLogger(logger_name)

    for handler in list(test_logger.handlers):
        test_logger.removeHandler(handler)
        handler.close()

    yield logger_name, tmp_path, test_logger

    for handler in list(test_logger.handlers):
        test_logger.removeHandler(handler)
        handler.close()


class TestLogger:
    """A class for the tests for the logger.py file."""

    def test_get_logger_configures_default_logging(self, isolated_logger):
        """Test logger.py functions.

        ::get_logger

        ::It should configure info-level logging and create the log output path.
        """
        logger_name, tmp_path, expected_logger = isolated_logger

        result = logger_utils.get_logger(logger_name)

        assert result is expected_logger
        assert result.level == logging.INFO
        assert len(result.handlers) == 2
        assert (tmp_path / "logs").is_dir()
        assert len(list((tmp_path / "logs").glob("log_*.log"))) == 1

    def test_get_logger_supports_verbose_logging(self, isolated_logger):
        """Test logger.py functions.

        ::get_logger

        ::It should configure debug-level logging when verbose mode is enabled.
        """
        logger_name, _, _ = isolated_logger

        result = logger_utils.get_logger(logger_name, verbose=True)

        assert result.level == logging.DEBUG

    def test_get_logger_does_not_duplicate_handlers(self, isolated_logger):
        """Test logger.py functions.

        ::get_logger

        ::It should reuse existing handlers when the logger is requested multiple times.
        """
        logger_name, _, _ = isolated_logger

        first_result = logger_utils.get_logger(logger_name)
        second_result = logger_utils.get_logger(logger_name, verbose=True)

        assert first_result is second_result
        assert len(second_result.handlers) == 2
        assert second_result.level == logging.DEBUG
