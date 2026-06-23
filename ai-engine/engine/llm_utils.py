"""
LLM provider registry and fallback utilities.

Usage:
    from engine.llm_utils import run_with_fallback, run_with_fallback_sync

    # Async (most generation tasks):
    try:
        result = await run_with_fallback(_try_fn, op_name='my_op')
    except RuntimeError:
        result = default_value

    # Sync (structural parsing tasks):
    try:
        result = run_with_fallback_sync(_try_fn, op_name='my_op')
    except RuntimeError:
        result = default_value

    Where _try_fn(provider_name: str, llm_instance) -> value or coroutine -> value.
"""

import logging

logger = logging.getLogger(__name__)


async def run_with_fallback(fn, *, op_name: str):
    """
    Calls async fn(provider_name, llm_instance) for each registered LLM in priority order.

    Raises RuntimeError if all providers fail. Callers supply their own default.
    """
    from engine.generator import LLMS  # imported here to avoid circular imports at module load
    errors = []
    for provider_name, llm_instance in LLMS:
        try:
            return await fn(provider_name, llm_instance)
        except Exception as e:
            logger.warning(f"[{op_name}] {provider_name} failed: {e}")
            errors.append(e)
    raise RuntimeError(
        f"All LLM providers failed for '{op_name}': {errors[-1] if errors else 'no providers configured'}"
    )


def run_with_fallback_sync(fn, *, op_name: str):
    """
    Calls sync fn(provider_name, llm_instance) for each registered LLM in priority order.

    Raises RuntimeError if all providers fail. Callers supply their own default.
    """
    from engine.generator import LLMS  # imported here to avoid circular imports at module load
    errors = []
    for provider_name, llm_instance in LLMS:
        try:
            return fn(provider_name, llm_instance)
        except Exception as e:
            logger.warning(f"[{op_name}] {provider_name} failed: {e}")
            errors.append(e)
    raise RuntimeError(
        f"All LLM providers failed for '{op_name}': {errors[-1] if errors else 'no providers configured'}"
    )
