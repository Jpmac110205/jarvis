"""Run with python -m scripts.memory_worker; safe to restart or run multiple workers."""

import logging
import signal
import argparse
from threading import Event
from main import make_model
from memory_worker import run_once
from storage.database import init_memory_db


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--once", action="store_true", help="Process at most one ready job, then exit"
    )
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO)
    stopped = Event()
    for signum in (signal.SIGTERM, signal.SIGINT):
        signal.signal(signum, lambda *_: stopped.set())
    init_memory_db()
    if args.once:
        run_once(make_model)
        return
    while not stopped.is_set():
        try:
            worked = run_once(make_model)
        except Exception:
            logging.exception("Memory worker connection unavailable")
            worked = False
        stopped.wait(0.1 if worked else 2)


if __name__ == "__main__":
    main()
