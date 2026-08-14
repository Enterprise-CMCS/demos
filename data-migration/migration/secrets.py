"""AWS Secrets Manager access for the DEMOS RDS admin credentials.

``boto3`` is imported lazily (patched in tests) so the toolkit stays
importable without AWS libraries. Credentials come from the ambient
environment (instance role / standard boto3 chain).
"""

from __future__ import annotations

import json
from typing import Any

from migration.lib import die


def _client(region: str | None = None) -> Any:
    """Build a Secrets Manager client. Lazy boto3 import; patched in tests."""
    import boto3

    if region:
        return boto3.client("secretsmanager", region_name=region)
    return boto3.client("secretsmanager")


def get_secret_json(secret_id: str, region: str | None = None) -> dict[str, Any]:
    """Fetch ``secret_id`` and parse its ``SecretString`` as JSON.

    Hard-fails via :func:`die` when the secret is missing, has no string
    payload, or does not parse as a JSON object.
    """
    client = _client(region)
    resp = client.get_secret_value(SecretId=secret_id)
    raw = resp.get("SecretString")
    if not raw:
        die(f"secret {secret_id!r} has no SecretString payload")
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        die(f"secret {secret_id!r} is not valid JSON: {e}")
    if not isinstance(data, dict):
        die(f"secret {secret_id!r} did not parse to a JSON object")
    return data
