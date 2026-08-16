"""
Endpoint-level tests for the error-handling fixes in main.generate_course.

The AI/ML/DB-heavy engine submodules (llama-index, pymupdf, pymongo, ...) are
stubbed in sys.modules before importing `main`, so these tests run without the
full dependency stack. They focus purely on the FastAPI error-status behaviour:

  * a duplicate file must return 400 (regression: it used to be re-wrapped as 500)
  * a missing syllabus path must return 400
"""

import sys
import types
import hashlib
import importlib

import pytest


@pytest.fixture()
def client(tmp_path, monkeypatch):
    # --- Stub heavy engine submodules so `import main` succeeds cheaply --------
    # monkeypatch.setitem auto-restores the original sys.modules entry (or
    # removes it) on teardown, so these stubs don't leak into other tests.
    def _mod(name, **attrs):
        m = types.ModuleType(name)
        for k, v in attrs.items():
            setattr(m, k, v)
        monkeypatch.setitem(sys.modules, name, m)
        return m

    # Track which hashes are "already seen" so the dedup check can be driven.
    seen_hashes = set()

    def fake_check_file_hash(hash_val, course_id=None):
        return hash_val in seen_hashes

    def fake_save_file_hash(filename, hash_val, course_id=None):
        seen_hashes.add(hash_val)

    _mod(
        "engine.db",
        get_db_handle=lambda: None,
        save_course_to_db=lambda course: {"_id": "x", "course_structure": {}},
        update_course_progress=lambda *a, **k: None,
        save_to_staging=lambda *a, **k: None,
        check_file_hash=fake_check_file_hash,
        save_file_hash=fake_save_file_hash,
        update_course_in_db=lambda *a, **k: {"_id": "x", "course_structure": {}},
        ensure_ttl_index=lambda: None,
    )

    class _ParseResult:
        def __init__(self, text="parsed text", images=None):
            self.text = text
            self.images = images or []

    def _extract_in_chunks(file_bytes, filename=None, chunk_size=10):
        yield _ParseResult()

    _mod(
        "engine.ocr",
        extract_text_from_bytes=lambda *a, **k: "parsed text",
        extract_with_images=lambda *a, **k: _ParseResult(),
        extract_in_chunks=_extract_in_chunks,
    )

    _mod("engine.parsers")
    _mod("engine.parsers.image_analyzer", analyze_images=lambda *a, **k: [])

    async def _create_course_pipeline(*a, **k):
        return object(), []

    async def _evaluate_answer(*a, **k):
        return {}

    async def _validate_syllabus_content(*a, **k):
        return {"is_syllabus": True, "reason": "stub"}

    _mod(
        "engine.generator",
        create_course_pipeline=_create_course_pipeline,
        evaluate_answer=_evaluate_answer,
        validate_syllabus_content=_validate_syllabus_content,
    )

    async def _evaluate_course(*a, **k):
        return {"score": 0}

    _mod("engine.judge", evaluate_course=_evaluate_course)

    class _ObjectId:
        def __init__(self, v):
            self.v = v

        def __str__(self):
            return str(self.v)

    _mod("bson", ObjectId=_ObjectId)

    # Force a fresh import of `main` against the stubs; monkeypatch.delitem
    # restores the original (absence) on teardown so the stubbed `main` is removed.
    monkeypatch.delitem(sys.modules, "main", raising=False)
    main = importlib.import_module("main")

    from fastapi.testclient import TestClient
    return TestClient(main.app), tmp_path


def _write(tmp_path, name, content=b"hello world"):
    p = tmp_path / name
    p.write_bytes(content)
    return str(p)


def test_missing_syllabus_returns_400(client):
    test_client, tmp_path = client
    resp = test_client.post("/api/generate-course/", json={
        "courseId": "c1",
        "syllabusPath": str(tmp_path / "does_not_exist.pdf"),
        "materialsPaths": [],
    })
    assert resp.status_code == 400
    assert "not found" in resp.json()["detail"].lower()


def test_duplicate_material_skipped_gracefully_returns_200(client):
    test_client, tmp_path = client
    syllabus = _write(tmp_path, "syllabus.pdf", b"unique syllabus bytes")
    # Same bytes twice → identical SHA256 → second occurrence is a duplicate.
    mat = _write(tmp_path, "dup.pdf", b"identical material bytes")

    # Send duplicate material paths — second occurrence should be skipped gracefully.
    resp = test_client.post("/api/generate-course/", json={
        "courseId": "c1",
        "syllabusPath": syllabus,
        "materialsPaths": [mat, mat],
    })

    assert resp.status_code == 200, resp.text
