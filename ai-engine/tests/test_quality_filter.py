"""Tests for engine.quality_filter.is_clean — pure function, no LLM/ML deps."""

from engine.quality_filter import is_clean


def test_empty_and_whitespace_are_not_clean():
    assert is_clean("") is False
    assert is_clean("   \n\t  ") is False
    assert is_clean(None) is False


def test_normal_english_text_is_clean():
    assert is_clean("The quick brown fox jumps over the lazy dog.") is True


def test_hebrew_text_is_clean():
    # Hebrew letters fall inside the unicode range the filter treats as valid.
    assert is_clean("שלום עולם זהו טקסט בעברית לבדיקה") is True


def test_high_noise_is_rejected():
    # Mostly non-alphanumeric garbage (OCR noise) should be dropped.
    noisy = "@#$%^&*()<>{}[]|\\~`@#$%^&*()<>{}[]|\\~`a"
    assert is_clean(noisy) is False


def test_mixed_text_just_under_threshold_is_clean():
    # ~10% punctuation in otherwise clean prose stays under the 15% threshold.
    text = "Hello world, this is a normal sentence with words and spaces."
    assert is_clean(text) is True
