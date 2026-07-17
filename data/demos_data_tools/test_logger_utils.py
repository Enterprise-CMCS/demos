"""A module containing tests for the logger_utils.py file."""

import logging

import pytest

import logger_utils


class TestLogger:
    """A class for the tests for the logger.py file."""

    @pytest.fixture
    def logger_mocks(self, mocker):
        """Isolate get_logger from the logging module and the filesystem."""
        mock_logger = mocker.MagicMock()
        setattr(mock_logger, logger_utils._CONFIGURED_FLAG, False)
        return {
            "logger": mock_logger,
            "getLogger": mocker.patch("logger_utils.getLogger", return_value=mock_logger),
            "StreamHandler": mocker.patch("logger_utils.StreamHandler"),
            "FileHandler": mocker.patch("logger_utils.FileHandler"),
            "Formatter": mocker.patch("logger_utils.Formatter"),
            "LOG_DIR": mocker.patch("logger_utils.LOG_DIR"),
        }

    def test_get_logger_configures_default_logging(self, logger_mocks):
        """Test logger.py functions.

        ::get_logger

        ::It should return an info-level logger with console and file handlers.
        """
        result = logger_utils.get_logger("my.module")

        logger_mocks["getLogger"].assert_called_once_with("my.module")
        logger_mocks["logger"].setLevel.assert_called_once_with(logging.INFO)
        assert logger_mocks["StreamHandler"].call_count == 1
        assert logger_mocks["FileHandler"].call_count == 1
        assert logger_mocks["logger"].addHandler.call_count == 2
        assert result is logger_mocks["logger"]

    def test_get_logger_creates_log_directory(self, logger_mocks):
        """Test logger.py functions.

        ::get_logger

        ::It should create the log output directory.
        """
        logger_utils.get_logger("my.module")

        logger_mocks["LOG_DIR"].mkdir.assert_called_once_with(parents=True, exist_ok=True)

    def test_get_logger_supports_verbose_logging(self, logger_mocks):
        """Test logger.py functions.

        ::get_logger

        ::It should configure debug-level logging when verbose mode is enabled.
        """
        logger_utils.get_logger("my.module", verbose=True)

        logger_mocks["logger"].setLevel.assert_called_once_with(logging.DEBUG)

    def test_get_logger_does_not_duplicate_handlers(self, logger_mocks):
        """Test logger.py functions.

        ::get_logger

        ::It should not reconfigure a logger it has already configured.
        """
        first = logger_utils.get_logger("my.module")
        second = logger_utils.get_logger("my.module")

        assert first is second
        assert logger_mocks["StreamHandler"].call_count == 1
        assert logger_mocks["FileHandler"].call_count == 1
        assert logger_mocks["logger"].addHandler.call_count == 2
        assert logger_mocks["logger"].setLevel.call_count == 1
