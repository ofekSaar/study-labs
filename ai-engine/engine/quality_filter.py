import re
import logging

logger = logging.getLogger(__name__)

_NON_ALPHANUMERIC = re.compile(r'[^a-zA-Z0-9֐-׿\s]')
_NOISE_THRESHOLD = 0.15


def is_clean(text: str) -> bool:
    """
    Returns False if more than 15% of characters are non-alphanumeric noise.
    Treats Hebrew unicode range as valid alphanumeric content.
    """
    if not text or not text.strip():
        return False

    total = len(text)
    noise = len(_NON_ALPHANUMERIC.findall(text))
    ratio = noise / total

    if ratio > _NOISE_THRESHOLD:
        logger.warning(f"OCR quality filter: dropped chunk (noise ratio {ratio:.1%})")
        return False

    return True
