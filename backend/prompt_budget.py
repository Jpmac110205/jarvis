"""Reject oversized full-context requests rather than silently dropping file text."""

import os
import tiktoken
from fastapi import HTTPException


def check_prompt_budget(messages, model):
    try:
        encoding = tiktoken.encoding_for_model(model)
    except KeyError:
        encoding = tiktoken.get_encoding("cl100k_base")
    tokens = sum(
        len(encoding.encode(str(m.content), disallowed_special=())) + 8
        for m in messages
    )
    limit = int(os.getenv("MAX_CONTEXT_TOKENS", "64000"))
    if tokens > limit:
        raise HTTPException(
            status_code=413,
            detail=f"This question and its full context exceed the {limit:,}-token input budget. "
            "Remove an attached document or shorten your question or user memory. "
            "No attached text has been truncated.",
        )
    return tokens
