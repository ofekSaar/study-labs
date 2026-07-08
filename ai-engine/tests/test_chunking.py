import os
from engine.ocr import extract_in_chunks

FIXTURES_DIR = "/app/tests/fixtures/computational-models"

def test_extract_in_chunks_pages():
    path = os.path.join(FIXTURES_DIR, "handwritten_summary.pdf")
    assert os.path.exists(path), f"handwritten_summary.pdf not found at {path}"
    
    with open(path, "rb") as f:
        file_bytes = f.read()
        
    chunks = list(extract_in_chunks(file_bytes, filename="handwritten_summary.pdf", chunk_size=10))
    
    # 42 pages with chunk_size=10 should yield 5 chunks:
    # Chunk 1: pages 1-10
    # Chunk 2: pages 11-20
    # Chunk 3: pages 21-30
    # Chunk 4: pages 31-40
    # Chunk 5: pages 41-42
    assert len(chunks) == 5, f"Expected 5 chunks, but got {len(chunks)}"
    
    # Check that each yielded object has metadata containing page range
    for idx, chunk in enumerate(chunks):
        assert chunk is not None
        # Verify page ranges in metadata
        meta = chunk.metadata or {}
        assert "chunk_start" in meta
        assert "chunk_end" in meta
        start_p = meta["chunk_start"]
        end_p = meta["chunk_end"]
        
        expected_start = idx * 10 + 1
        expected_end = min((idx + 1) * 10, 42)
        assert start_p == expected_start
        assert end_p == expected_end
