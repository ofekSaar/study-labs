"""
PDF Parser — Extracts text and embedded images from PDF files.

Uses PyMuPDF (fitz) for text extraction and image extraction.
Falls back to Tesseract OCR for scanned/image-based pages.
"""

import io
import logging
from typing import List

import fitz  # PyMuPDF
from PIL import Image
import pytesseract

from .base import BaseParser, ParseResult

logger = logging.getLogger(__name__)


class PdfParser(BaseParser):

    @staticmethod
    def supported_extensions() -> List[str]:
        return ['.pdf']

    def parse(self, file_bytes: bytes, filename: str) -> ParseResult:
        logger.info(f"PdfParser: Processing '{filename}'...")
        text_parts = []
        images = []

        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")

            for page_num in range(len(doc)):
                page = doc.load_page(page_num)

                # --- Text Extraction ---
                page_text = page.get_text()

                # If text is too short, the page is likely a scanned image → use OCR
                if len(page_text.strip()) < 50:
                    logger.debug(f"  Page {page_num + 1}: text too short, attempting OCR...")
                    try:
                        pix = page.get_pixmap()
                        img_data = pix.tobytes("png")
                        image = Image.open(io.BytesIO(img_data))
                        ocr_text = pytesseract.image_to_string(image, lang='heb+eng')
                        page_text = ocr_text
                    except Exception as e:
                        logger.warning(f"  OCR failed on page {page_num + 1}: {e}")

                text_parts.append(page_text)

                # --- Embedded Image Extraction ---
                try:
                    image_list = page.get_images(full=True)
                    for img_index, img_info in enumerate(image_list):
                        xref = img_info[0]
                        base_image = doc.extract_image(xref)
                        if base_image and base_image.get("image"):
                            images.append(base_image["image"])
                            logger.debug(f"  Page {page_num + 1}: extracted image {img_index + 1}")
                except Exception as e:
                    logger.warning(f"  Image extraction failed on page {page_num + 1}: {e}")

            doc.close()

        except Exception as e:
            logger.error(f"PdfParser Error for '{filename}': {e}")
            return ParseResult(text="", images=[], metadata={"error": str(e)})

        full_text = "\n\n".join(text_parts)
        logger.info(f"PdfParser: Extracted {len(full_text)} chars, {len(images)} images from '{filename}'")

        return ParseResult(
            text=full_text,
            images=images,
            metadata={"page_count": len(text_parts), "image_count": len(images)}
        )

    def parse_in_chunks(self, file_bytes: bytes, filename: str, chunk_size: int = 10):
        logger.info(f"PdfParser: Processing '{filename}' in chunks of {chunk_size} pages...")
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            total_pages = len(doc)
            
            for chunk_start in range(0, total_pages, chunk_size):
                text_parts = []
                images = []
                chunk_end = min(chunk_start + chunk_size, total_pages)
                
                for page_num in range(chunk_start, chunk_end):
                    page = doc.load_page(page_num)
                    page_text = page.get_text()
                    
                    # --- Text Extraction ---
                    if len(page_text.strip()) < 50:
                        logger.debug(f"  Page {page_num + 1}: text too short, attempting OCR...")
                        try:
                            pix = page.get_pixmap()
                            img_data = pix.tobytes("png")
                            image = Image.open(io.BytesIO(img_data))
                            ocr_text = pytesseract.image_to_string(image, lang='heb+eng')
                            page_text = ocr_text
                        except Exception as e:
                            logger.warning(f"  OCR failed on page {page_num + 1}: {e}")
                    
                    text_parts.append(page_text)
                    
                    # --- Embedded Image Extraction ---
                    try:
                        image_list = page.get_images(full=True)
                        for img_index, img_info in enumerate(image_list):
                            xref = img_info[0]
                            base_image = doc.extract_image(xref)
                            if base_image and base_image.get("image"):
                                images.append(base_image["image"])
                                logger.debug(f"  Page {page_num + 1}: extracted image {img_index + 1}")
                    except Exception as e:
                        logger.warning(f"  Image extraction failed on page {page_num + 1}: {e}")
                
                yield ParseResult(
                    text="\n\n".join(text_parts),
                    images=images,
                    metadata={"chunk_start": chunk_start + 1, "chunk_end": chunk_end, "total_pages": total_pages}
                )
            doc.close()
        except Exception as e:
            logger.error(f"PdfParser chunking Error for '{filename}': {e}")
            yield ParseResult(text="", images=[], metadata={"error": str(e)})
