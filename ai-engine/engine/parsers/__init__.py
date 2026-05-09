"""
Parser Registry — Auto-discovers and registers all file parsers.

To add a new file format:
    1. Create a new parser class in this directory (extend BaseParser)
    2. Import and register it below
    
The registry maps file extensions to parser instances, so the rest of
the application just calls get_parser(filename) without knowing the internals.
"""

import os
import logging
from typing import Optional, List

from .base import BaseParser, ParseResult

logger = logging.getLogger(__name__)

# ── Registry ────────────────────────────────────────────────
_PARSER_REGISTRY: dict[str, BaseParser] = {}


def register_parser(parser_cls: type):
    """Register a parser class for all its supported extensions."""
    instance = parser_cls()
    for ext in parser_cls.supported_extensions():
        ext_lower = ext.lower()
        _PARSER_REGISTRY[ext_lower] = instance
        logger.debug(f"Registered parser {parser_cls.__name__} for '{ext_lower}'")


def get_parser(filename: str) -> Optional[BaseParser]:
    """
    Look up the correct parser for a given filename.
    Returns None if no parser is registered for that extension.
    """
    if not filename:
        return None
    ext = os.path.splitext(filename)[1].lower()
    return _PARSER_REGISTRY.get(ext)


def get_supported_extensions() -> List[str]:
    """Return all currently registered file extensions."""
    return list(_PARSER_REGISTRY.keys())


# ── Auto-register all built-in parsers ──────────────────────
from .pdf_parser import PdfParser
from .pptx_parser import PptxParser
from .docx_parser import DocxParser
from .xlsx_parser import XlsxParser

for _cls in [PdfParser, PptxParser, DocxParser, XlsxParser]:
    register_parser(_cls)

logger.info(f"Parser registry initialized. Supported formats: {get_supported_extensions()}")
