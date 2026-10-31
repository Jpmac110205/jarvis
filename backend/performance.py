"""Structured latency observations without logging prompts, answers or tokens."""

import json
import logging
from contextlib import contextmanager
from time import perf_counter

logger = logging.getLogger("uvicorn.error")


class Timings:
    def __init__(self, request_id):
        self.started = perf_counter()
        self.values = {"request_id": str(request_id)}

    @contextmanager
    def span(self, name):
        started = perf_counter()
        try:
            yield
        finally:
            self.values[name + "_ms"] = round((perf_counter() - started) * 1000, 1)

    def mark(self, name):
        self.values[name + "_ms"] = round((perf_counter() - self.started) * 1000, 1)

    def emit(self, status):
        self.mark("total")
        logger.info("chat_latency %s", json.dumps({**self.values, "status": status}))
