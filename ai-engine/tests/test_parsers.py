import os
from engine.ocr import extract_text_from_bytes

FIXTURES_DIR = "/app/tests/fixtures/computational-models"

def test_parse_pdf_syllabus():
    path = os.path.join(FIXTURES_DIR, "Syllabus.pdf")
    assert os.path.exists(path), f"Syllabus.pdf not found at {path}"
    
    with open(path, "rb") as f:
        file_bytes = f.read()
    
    extracted_text = extract_text_from_bytes(file_bytes, filename="Syllabus.pdf")
    
    assert extracted_text is not None
    assert len(extracted_text.strip()) > 100
    assert "מודלים חישוביים" in extracted_text or "Computational Models" in extracted_text


def test_parse_pptx_presentation():
    path = os.path.join(FIXTURES_DIR, "presentation.pptx")
    assert os.path.exists(path), f"presentation.pptx not found at {path}"
    
    with open(path, "rb") as f:
        file_bytes = f.read()
        
    extracted_text = extract_text_from_bytes(file_bytes, filename="presentation.pptx")
    
    assert extracted_text is not None
    assert len(extracted_text.strip()) > 100
    assert "שלוסברג" in extracted_text or "מודלים" in extracted_text
