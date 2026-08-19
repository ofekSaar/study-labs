import pytest
import numpy as np
from unittest.mock import patch, MagicMock
from engine.quality_validator import validate_topic_quality, build_retry_feedback, QualityResult
from engine.config import (
    MIN_SUMMARY_WORDS,
    MIN_SUMMARY_HEADERS,
    MIN_SUMMARY_BULLETS,
    SUMMARY_COHERENCE_THRESHOLD,
    SUMMARY_GROUNDING_THRESHOLD,
    KEYWORD_COVERAGE_THRESHOLD,
    QUESTION_ALIGNMENT_THRESHOLD,
)

def create_valid_summary():
    """Generates a summary that passes all format checks (words, headers, bullets, etc.)"""
    sections = [
        "## Overview\n"
        "Deterministic finite automata are fundamental computational models used in theoretical computer science. "
        "They consist of a finite set of states, a transition function, an initial state, and a set of accepting states. "
        "DFAs process input strings one symbol at a time and either accept or reject the input based on the final state reached. "
        "Understanding DFAs is essential for studying regular languages and compiler design principles in modern computing. "
        "The concept was first introduced in the 1950s and has since become a cornerstone of automata theory. "
        "DFAs are the simplest class of automata and serve as the foundation for more complex models like pushdown automata and Turing machines.\n\n"
        "The practical importance of DFAs extends beyond theoretical study. They are used extensively in software engineering "
        "for tasks like lexical analysis, pattern matching, and protocol verification. Modern regular expression engines "
        "often compile patterns into DFAs for efficient string matching. Understanding how DFAs work gives students "
        "the theoretical tools to analyze the computational complexity of problems and design efficient algorithms.\n\n",

        "## Key Concepts & Definitions\n"
        "- **State**: A configuration of the automaton at any point during computation representing current progress\n"
        "- **Transition function**: A mapping from state and input symbol to the next state in the automaton\n"
        "- **Accepting state**: A final state that indicates the input string belongs to the language recognized\n"
        "- **Alphabet**: The finite set of symbols that the automaton can read from the input tape\n"
        "- **Dead state**: A non-accepting state from which no accepting state can be reached regardless of input\n"
        "- **Regular language**: A language that can be recognized by some deterministic finite automaton\n"
        "- **Start state**: The unique initial state where computation begins before reading any input symbol\n\n",

        "## Theory / Mathematical Principles\n"
        "The formal definition of a DFA is a 5-tuple consisting of states, alphabet, transition function, start state, and accept states. "
        "The transition function delta maps each state-symbol pair to exactly one next state, making the automaton deterministic. "
        "Every NFA can be converted to an equivalent DFA using the subset construction algorithm, though the resulting DFA may have exponentially more states. "
        "The pumping lemma provides a necessary condition for regular languages and can be used to prove certain languages are not regular. "
        "Minimization algorithms reduce a DFA to its smallest equivalent form by merging indistinguishable states. "
        "The Myhill-Nerode theorem establishes that a language is regular if and only if it has a finite number of equivalence classes "
        "under the distinguishability relation. This theorem also provides the basis for computing the minimum state DFA. "
        "Closure properties show that regular languages are closed under union, intersection, complement, and concatenation operations.\n\n",

        "## Worked Examples or Applications\n"
        "Consider a DFA that accepts all binary strings ending in zero one. The automaton requires three states to track the last two symbols seen. "
        "State q0 is the initial state, q1 is reached after seeing a zero, and q2 is the accepting state reached after seeing zero followed by one. "
        "The transition function is defined as delta(q0,0)=q1, delta(q0,1)=q0, delta(q1,0)=q1, delta(q1,1)=q2, delta(q2,0)=q1, delta(q2,1)=q0. "
        "In practice, DFAs are used in lexical analysis phases of compilers to tokenize source code into meaningful units. "
        "Pattern matching engines in text editors and search tools often compile regular expressions into DFAs for efficient matching. "
        "Network protocol verification systems use DFAs to model and verify the correctness of communication protocols.\n\n",

        "## Summary & Key Takeaways\n"
        "Deterministic finite automata provide the theoretical foundation for understanding regular languages and computation. "
        "They are widely applied in compiler design, pattern matching, and protocol verification systems. "
        "The key properties include determinism in transitions, finite memory, and the ability to process input in linear time. "
        "Students should understand state diagrams, formal tuple notation, the subset construction, and the pumping lemma. "
        "These concepts form the basis for studying more advanced topics in computational theory and formal languages.\n\n",
    ]
    return "".join(sections)

@patch('engine.quality_validator.embed_texts')
def test_short_summary_fails(mock_embed):
    summary = "This is a short summary. " * 10  # 50 words
    result = validate_topic_quality("Topic", "Desc", summary, [], None, False)
    assert not result.passed
    assert any("word_count" in f for f in result.failures)
    mock_embed.assert_not_called()

@patch('engine.quality_validator.embed_texts')
def test_adequate_summary_passes_format(mock_embed):
    mock_embed.return_value = np.array([[1.0, 0.0], [0.95, 0.31]])
    summary = create_valid_summary()
    # Pass None for description so keyword coverage check is skipped (testing format only)
    result = validate_topic_quality("Topic", None, summary, [], None, False)
    assert result.passed
    assert len(result.failures) == 0

@patch('engine.quality_validator.embed_texts')
def test_missing_headers_fails(mock_embed):
    summary = create_valid_summary().replace("## ", "")
    result = validate_topic_quality("Topic", "Desc", summary, [], None, False)
    assert not result.passed
    assert any("headers" in f for f in result.failures)

@patch('engine.quality_validator.embed_texts')
def test_missing_bullets_fails(mock_embed):
    # Remove all bullet-style lines from the summary
    summary = "\n".join(
        line for line in create_valid_summary().split("\n")
        if not line.strip().startswith("- ")
    )
    result = validate_topic_quality("Topic", "Desc", summary, [], None, False)
    assert not result.passed
    assert any("bullets" in f for f in result.failures)

@patch('engine.quality_validator.embed_texts')
def test_placeholder_text_fails(mock_embed):
    summary = create_valid_summary() + "\nTODO: finish this."
    result = validate_topic_quality("Topic", "Desc", summary, [], None, False)
    assert not result.passed
    assert any("placeholder" in f for f in result.failures)

@patch('engine.quality_validator.embed_texts')
def test_tbd_placeholder_fails(mock_embed):
    summary = create_valid_summary() + "\nTBD: details."
    result = validate_topic_quality("Topic", "Desc", summary, [], None, False)
    assert not result.passed
    assert any("placeholder" in f for f in result.failures)

@patch('engine.quality_validator.embed_texts')
def test_repeated_paragraph_fails(mock_embed):
    paragraph = ("This is a very long paragraph that will be repeated to trigger the repetition "
                 "detection. It needs to be more than 50 characters to count.")
    summary = create_valid_summary() + f"\n\n{paragraph}\n\n{paragraph}"
    result = validate_topic_quality("Topic", "Desc", summary, [], None, False)
    assert not result.passed
    assert any("repetition" in f for f in result.failures)

@patch('engine.quality_validator.embed_texts')
def test_coherence_check_passes(mock_embed):
    # Coherence: embed_texts([summary, topic]) → 2-row array
    # dot product of row 0 and row 1 should be > threshold (0.45)
    mock_embed.return_value = np.array([[1.0, 0.0], [0.95, 0.31]])  # dot = 0.95
    summary = create_valid_summary()
    result = validate_topic_quality("Topic", None, summary, [], None, False)
    assert result.passed

@patch('engine.quality_validator.embed_texts')
def test_coherence_check_fails(mock_embed):
    mock_embed.return_value = np.array([[1.0, 0.0], [0.0, 1.0]])  # dot = 0.0
    summary = create_valid_summary()
    result = validate_topic_quality("Topic", None, summary, [], None, False)
    assert not result.passed
    assert any("coherence" in f for f in result.failures)

@patch('engine.quality_validator.embed_texts')
def test_grounding_check_passes(mock_embed):
    # Call 1: embed_texts([summary, topic]) for coherence → 2 rows
    # Call 2: embed_texts([material]) for grounding → 1 row
    coherence_embeddings = np.array([[1.0, 0.0], [0.95, 0.31]])  # coherence = 0.95
    material_embeddings = np.array([[0.9, 0.44]])  # grounding = dot(summary, material) = 0.9
    mock_embed.side_effect = [coherence_embeddings, material_embeddings]
    summary = create_valid_summary()
    result = validate_topic_quality("Topic", None, summary, [], ["Material content"], True)
    assert result.passed

@patch('engine.quality_validator.embed_texts')
def test_grounding_check_fails(mock_embed):
    coherence_embeddings = np.array([[1.0, 0.0], [0.95, 0.31]])  # coherence passes
    material_embeddings = np.array([[0.0, 1.0]])  # grounding = dot([1,0], [0,1]) = 0.0
    mock_embed.side_effect = [coherence_embeddings, material_embeddings]
    summary = create_valid_summary()
    result = validate_topic_quality("Topic", None, summary, [], ["Material content"], True)
    assert not result.passed
    assert any("grounding" in f for f in result.failures)

@patch('engine.quality_validator.embed_texts')
def test_grounding_check_skipped_when_ungrounded(mock_embed):
    # Only coherence check runs (no grounding since is_material_grounded=False)
    mock_embed.return_value = np.array([[1.0, 0.0], [0.95, 0.31]])
    summary = create_valid_summary()
    result = validate_topic_quality("Topic", None, summary, [], ["Material content"], False)
    assert result.passed
    assert not any("grounding" in f for f in result.failures)

@patch('engine.quality_validator.embed_texts')
def test_keyword_coverage_passes(mock_embed):
    mock_embed.return_value = np.array([[1.0, 0.0], [0.95, 0.31]])
    summary = create_valid_summary() + " apple banana cherry"
    result = validate_topic_quality("Topic", "apple banana cherry", summary, [], None, False)
    assert result.passed

@patch('engine.quality_validator.embed_texts')
def test_keyword_coverage_fails(mock_embed):
    mock_embed.return_value = np.array([[1.0, 0.0], [0.95, 0.31]])
    summary = create_valid_summary()
    result = validate_topic_quality("Topic", "xylophone zephyr quasar", summary, [], None, False)
    assert not result.passed
    assert any("keyword_coverage" in f for f in result.failures)

@patch('engine.quality_validator.embed_texts')
def test_alignment_check_flags_question(mock_embed):
    # Call 1: embed_texts([summary, topic]) for coherence → 2 rows
    # Call 2: embed_texts([question_text]) for alignment → 1 row
    coherence_embeddings = np.array([[1.0, 0.0], [0.95, 0.31]])
    question_embeddings = np.array([[0.0, 1.0]])  # alignment = dot([1,0], [0,1]) = 0.0
    mock_embed.side_effect = [coherence_embeddings, question_embeddings]
    summary = create_valid_summary()
    question = MagicMock()
    question.question_text = "What is this?"
    result = validate_topic_quality("Topic", None, summary, [question], None, False)
    assert result.passed  # alignment warnings don't cause failure
    assert result.alignment_warnings == [0]

def test_build_retry_feedback_format():
    result = QualityResult(
        passed=False,
        failures=["word_count: 200 < 500 minimum", "headers: 1 < 3 minimum"]
    )
    feedback = build_retry_feedback(result)
    assert "word_count" in feedback
    assert "headers" in feedback
    assert "Write MORE content" in feedback
    assert "proper Markdown section headers" in feedback

@patch('engine.quality_validator.embed_texts')
def test_format_failure_short_circuits_sbert(mock_embed):
    summary = "Too short"
    result = validate_topic_quality("Topic", "Desc", summary, [], None, False)
    assert not result.passed
    mock_embed.assert_not_called()

