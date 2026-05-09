"""
Image Analyzer — Sends embedded images to a Vision-capable LLM for description.

Extracted images from any document type are sent to GPT-4o / Gemini Vision,
and the returned text descriptions are injected back into the document's text
stream so the LLM pipeline has full context about charts, diagrams, and photos.
"""

import base64
import logging
import os
import asyncio
from typing import List, Optional

from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# Maximum number of images to analyze per document (cost control)


# Minimum image size in bytes to bother analyzing (skip tiny icons/bullets)
MIN_IMAGE_SIZE = 5000  # ~5KB


async def analyze_image(image_bytes: bytes, context: str = "") -> Optional[str]:
    """
    Sends a single image to a Vision LLM and returns a text description.
    
    Args:
        image_bytes: Raw image bytes (PNG, JPEG, etc.)
        context:     Optional context about the document for better descriptions.
        
    Returns:
        A text description of the image, or None if analysis failed.
    """
    try:
        from openai import AsyncOpenAI
        
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            logger.warning("No OPENAI_API_KEY found — skipping image analysis")
            return None

        client = AsyncOpenAI(api_key=api_key)
        
        # Encode image to base64
        b64_image = base64.b64encode(image_bytes).decode("utf-8")
        
        # Detect image format from magic bytes
        if image_bytes[:8] == b'\x89PNG\r\n\x1a\n':
            media_type = "image/png"
        elif image_bytes[:2] == b'\xff\xd8':
            media_type = "image/jpeg"
        else:
            media_type = "image/png"  # Default fallback

        system_prompt = (
            "You are an image analysis assistant for an educational platform. "
            "Describe the image in detail so that a student who cannot see the image "
            "can fully understand its content. Focus on: data, labels, trends, "
            "relationships, and any key takeaways. "
            "If it's a chart/graph, describe the axes, values, and trends. "
            "If it's a diagram, describe the structure and connections. "
            "Keep the description concise but comprehensive (2-4 sentences). "
            "Use Markdown for formatting and LaTeX for any math symbols or formulas ($...$)."
        )

        context_note = f"\nDocument context: {context}" if context else ""

        response = await client.chat.completions.create(
            model="gpt-4o-mini",  # Cost-effective vision model
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": f"Describe this image from a course document.{context_note}"},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{media_type};base64,{b64_image}",
                                "detail": "low"  # Cost-efficient — "low" costs 85 tokens
                            }
                        }
                    ]
                }
            ],
            max_tokens=300
        )

        description = response.choices[0].message.content.strip()
        return description

    except Exception as e:
        logger.warning(f"Image analysis failed: {e}")
        return None


async def analyze_images(images: List[bytes], context: str = "") -> List[str]:
    """
    Analyzes multiple images concurrently and returns their descriptions.
    
    Args:
        images:  List of raw image byte arrays.
        context: Optional context about the document.
        
    Returns:
        List of text descriptions (one per image). Failed analyses return a placeholder.
    """
    if not images:
        return []

    # Filter out tiny images (icons, bullets, decorations)
    significant_images = [
        (i, img) for i, img in enumerate(images) 
        if len(img) >= MIN_IMAGE_SIZE
    ]

    if not significant_images:
        logger.info("No significant images found (all below size threshold)")
        return []

    logger.info(f"Analyzing {len(significant_images)} embedded images via Vision LLM...")

    # Run analyses concurrently (but limited by the global semaphore in generator.py)
    tasks = [analyze_image(img, context) for _, img in significant_images]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    descriptions = []
    for (orig_idx, _), result in zip(significant_images, results):
        if isinstance(result, Exception):
            logger.warning(f"Image {orig_idx} analysis failed: {result}")
            descriptions.append(f"[IMAGE {orig_idx + 1}: Analysis unavailable]")
        elif result:
            descriptions.append(f"[IMAGE {orig_idx + 1}: {result}]")
        else:
            descriptions.append(f"[IMAGE {orig_idx + 1}: Analysis unavailable]")

    logger.info(f"Image analysis complete: {len(descriptions)} descriptions generated")
    return descriptions
