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
from engine.config import MIN_IMAGE_SIZE, VISION_MODEL, OPENROUTER_MODEL, GEMINI_MODEL

load_dotenv()
logger = logging.getLogger(__name__)

# Vision providers, in priority order. Every provider speaks the OpenAI
# chat-completions protocol — OpenRouter and Gemini both expose an
# OpenAI-compatible endpoint — so a single code path covers all of them and
# image analysis no longer silently requires an OpenAI key specifically.
_GEMINI_OPENAI_BASE = "https://generativelanguage.googleapis.com/v1beta/openai/"


def _build_vision_providers():
    providers = []
    if os.environ.get("OPENAI_API_KEY"):
        providers.append(("OpenAI", os.environ["OPENAI_API_KEY"], None, VISION_MODEL))
    if os.environ.get("OPEN_ROUTE_API_KEY"):
        providers.append(("OpenRouter", os.environ["OPEN_ROUTE_API_KEY"],
                           "https://openrouter.ai/api/v1", OPENROUTER_MODEL))
    if os.environ.get("GEMINI_API_KEY"):
        # Gemini's OpenAI-compatible endpoint expects a bare model id (no "models/" prefix)
        gemini_model = GEMINI_MODEL.split("/")[-1]
        providers.append(("Gemini", os.environ["GEMINI_API_KEY"],
                           _GEMINI_OPENAI_BASE, gemini_model))
    return providers


_VISION_PROVIDERS = _build_vision_providers()

_SYSTEM_PROMPT = (
    "You are an image analysis assistant for an educational platform. "
    "Describe the image in detail so that a student who cannot see the image "
    "can fully understand its content. Focus on: data, labels, trends, "
    "relationships, and any key takeaways. "
    "If it's a chart/graph, describe the axes, values, and trends. "
    "If it's a diagram, describe the structure and connections. "
    "Keep the description concise but comprehensive (2-4 sentences). "
    "Use Markdown for formatting and LaTeX for any math symbols or formulas ($...$)."
)


def _media_type(image_bytes: bytes) -> str:
    if image_bytes[:8] == b'\x89PNG\r\n\x1a\n':
        return "image/png"
    if image_bytes[:2] == b'\xff\xd8':
        return "image/jpeg"
    return "image/png"  # Default fallback


async def analyze_image(image_bytes: bytes, context: str = "") -> Optional[str]:
    """
    Sends a single image to a Vision LLM and returns a text description.

    Tries each configured provider (OpenAI → OpenRouter → Gemini) in order,
    falling through on failure.

    Args:
        image_bytes: Raw image bytes (PNG, JPEG, etc.)
        context:     Optional context about the document for better descriptions.

    Returns:
        A text description of the image, or None if all providers failed.
    """
    if not _VISION_PROVIDERS:
        logger.warning("No vision-capable API key found — skipping image analysis")
        return None

    from openai import AsyncOpenAI

    b64_image = base64.b64encode(image_bytes).decode("utf-8")
    media_type = _media_type(image_bytes)
    context_note = f"\nDocument context: {context}" if context else ""

    for name, api_key, base_url, model in _VISION_PROVIDERS:
        try:
            client = AsyncOpenAI(api_key=api_key, base_url=base_url)
            response = await client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": _SYSTEM_PROMPT},
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
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.warning(f"Image analysis failed with {name}: {e}")
            continue

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
