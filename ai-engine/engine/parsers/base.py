"""
Base class and data structures for all file parsers.
Every new parser must extend BaseParser and implement its interface.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Dict, Any


@dataclass
class ParseResult:
    """
    Standard output from every parser.
    
    Attributes:
        text:     The extracted text content from the document.
        images:   A list of raw image byte arrays extracted from the document.
        metadata: Optional metadata (page count, sheet names, slide count, etc.)
    """
    text: str = ""
    images: List[bytes] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


class BaseParser(ABC):
    """
    Abstract base class that all file parsers must implement.
    
    To add a new file format:
        1. Create a new file in engine/parsers/ (e.g. my_format_parser.py)
        2. Subclass BaseParser
        3. Implement supported_extensions() and parse()
        4. Register it in engine/parsers/__init__.py
    """

    @staticmethod
    @abstractmethod
    def supported_extensions() -> List[str]:
        """
        Return a list of file extensions this parser handles.
        Example: ['.pdf']
        """
        ...

    @abstractmethod
    def parse(self, file_bytes: bytes, filename: str) -> ParseResult:
        """
        Extract text and images from the given file bytes.
        
        Args:
            file_bytes: Raw bytes of the uploaded file.
            filename:   Original filename (used for logging/context).
            
        Returns:
            ParseResult with extracted text, images, and metadata.
        """
        ...

    def parse_in_chunks(self, file_bytes: bytes, filename: str, chunk_size: int = 10):
        """
        Extract text and images in chunks (e.g., page batches).
        Default implementation just yields the full result as a single chunk.
        Subclasses like PdfParser should override this for true chunking.
        """
        yield self.parse(file_bytes, filename)
