from __future__ import annotations

import logging
from datetime import datetime

LOG_FORMAT = "%(asctime)s | %(name)-22s | %(levelname)-8s | %(message)s"
DATE_FORMAT = "%Y-%m-%dT%H:%M:%S"

logging.basicConfig(level=logging.INFO, format=LOG_FORMAT, datefmt=DATE_FORMAT)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)


def ts() -> str:
    """Return current UTC timestamp as ISO string."""
    return datetime.utcnow().isoformat() + "Z"
