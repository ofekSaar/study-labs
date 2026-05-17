"""
OCR Service — Backward-compatible wrapper.

This module now delegates to the parser registry.
Kept for backward compatibility with existing imports in generator.py and main.py.
"""

import logging
from engine.parsers import get_parser, get_supported_extensions
from engine.parsers.base import ParseResult

logger = logging.getLogger(__name__)


def extract_text_from_bytes(file_bytes, filename=None):
    """
    Extracts text from file bytes using the appropriate parser.
    
    This is a backward-compatible wrapper. The actual parsing logic
    lives in engine/parsers/ — one module per file format.
    
    Args:
        file_bytes: Raw bytes of the file.
        filename:   Original filename (used to determine which parser to use).
        
    Returns:
        Extracted text as a string.
    """
    logger.info(f"OCR Service: Processing '{filename or 'unknown'}'...")

    parser = get_parser(filename)
    if not parser:
        logger.warning(
            f"No parser found for '{filename}'. "
            f"Supported formats: {get_supported_extensions()}"
        )
        return ""

    result = parser.parse(file_bytes, filename)
    return result.text


def extract_with_images(file_bytes, filename=None) -> ParseResult:
    """
    Extracts both text AND images from file bytes.
    
    Use this when you want access to embedded images for Vision LLM analysis.
    
    Args:
        file_bytes: Raw bytes of the file.
        filename:   Original filename.
        
    Returns:
        ParseResult with text, images, and metadata.
    """
    logger.info(f"OCR Service (full extraction): Processing '{filename or 'unknown'}'...")

    parser = get_parser(filename)
    if not parser:
        logger.warning(
            f"No parser found for '{filename}'. "
            f"Supported formats: {get_supported_extensions()}"
        )
        return ParseResult()

    return parser.parse(file_bytes, filename)

def extract_in_chunks(file_bytes, filename=None, chunk_size=10):
    """
    Extracts text and images from file bytes in chunks (useful for large PDFs).
    Yields ParseResult objects.
    """
    logger.info(f"OCR Service (chunked): Processing '{filename or 'unknown'}' in chunks of {chunk_size}...")

    parser = get_parser(filename)
    if not parser:
        logger.warning(
            f"No parser found for '{filename}'. "
            f"Supported formats: {get_supported_extensions()}"
        )
        yield ParseResult()
        return

    yield from parser.parse_in_chunks(file_bytes, filename, chunk_size=chunk_size)
