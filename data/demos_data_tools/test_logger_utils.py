"""A module containing tests for the logger_utils.py file."""

import logging

import pytest

import logger_utils


class TestLogger:
    """A class for the tests for the logger_utils.py file."""

    @pytest.fixture
    def logger_mocks(self, mocker):
        """Isolate config_logger from the logging module."""
        mock_logger = mocker.MagicMock()
        setattr(mock_logger, logger_utils._CONFIGURED_FLAG, False)
        return {
            "logger": mock_logger,
            "StreamHandler": mocker.patch("logger_utils.StreamHandler"),
            "Formatter": mocker.patch("logger_utils.Formatter"),
        }

    def test_config_logger_configures_console_logging(self, logger_mocks):
        """Test logger_utils.py functions.

        ::config_logger

        ::It should return an info-level logger with a console handler.
        """
        result = logger_utils.config_logger(logger_mocks["logger"])

        logger_mocks["logger"].setLevel.assert_called_once_with(logging.INFO)
        assert logger_mocks["StreamHandler"].call_count == 1
        logger_mocks["logger"].addHandler.assert_called_once()
        assert result is logger_mocks["logger"]

    def test_config_logger_does_not_duplicate_handlers(self, logger_mocks):
        """Test logger_utils.py functions.

        ::config_logger

        ::It should not reconfigure a logger it has already configured.
        """
        first = logger_utils.config_logger(logger_mocks["logger"])
        second = logger_utils.config_logger(logger_mocks["logger"])

        assert first is second
        assert logger_mocks["StreamHandler"].call_count == 1
        logger_mocks["logger"].addHandler.assert_called_once()
        logger_mocks["logger"].setLevel.assert_called_once()
