import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest

from app.services.symptomParser import SymptomParser

BASE = Path(__file__).resolve().parent.parent


@pytest.fixture(scope="module")
def parser() -> SymptomParser:
    return SymptomParser(json.loads((BASE / "ml" / "artifact" / "symptoms.json").read_text()))


def test_user_example_vomiting_with_blood(parser):
    result = parser.parse("i have vomiitng from two days and has blood")
    assert result["symptoms"] == ["vomiting"]  # typo fixed
    assert result["suggestions"][0]["phrase"] == "blood"
    assert "stomach_bleeding" in result["suggestions"][0]["options"]
    assert result["duration"] == "few_days"
    assert any("vomiting" in flag for flag in result["red_flags"])


@pytest.mark.parametrize(
    "text, expected",
    [
        ("loose motions since 3 days", ["diarrhoea"]),
        ("throwing up and feeling dizzy", ["vomiting", "dizziness"]),
        ("pain in my chest", ["chest_pain"]),
        ("I have a really bad stomach ache", ["stomach_pain"]),
        ("blood in stool", ["bloody_stool"]),
        ("itchy skin rash", ["skin_rash", "itching"]),
        ("difficultly in breathing", ["breathlessness"]),  # typo + linking word
        ("trouble breathing", ["breathlessness"]),
        ("stool with blood", ["bloody_stool"]),
        ("pain in anal region", ["pain_in_anal_region"]),
    ],
)
def test_everyday_wording(parser, text, expected):
    assert sorted(parser.parse(text)["symptoms"]) == sorted(expected)


def test_negation_is_skipped(parser):
    result = parser.parse("no fever, not vomiting, but headache")
    assert result["symptoms"] == ["headache"]
    assert result["suggestions"] == []


def test_vague_word_gives_choices_not_a_guess(parser):
    result = parser.parse("fever and cough")
    assert result["symptoms"] == ["cough"]
    assert result["suggestions"] == [{"phrase": "fever", "options": ["high_fever", "mild_fever"]}]


def test_specific_phrase_beats_vague_word(parser):
    # "blood in stool" is specific, so "blood" is not offered as a choice
    assert parser.parse("blood in stool")["suggestions"] == []


@pytest.mark.parametrize(
    "text, duration",
    [
        ("since this morning", "today"),
        ("since yesterday", "few_days"),
        ("for 2 days", "few_days"),
        ("from two weeks", "week"),
        ("for a month", "longer"),
        ("for 3 months", "longer"),
        ("headache", None),
    ],
)
def test_duration(parser, text, duration):
    assert parser.parse(text)["duration"] == duration


@pytest.mark.parametrize(
    "text",
    [
        "I cant breathe", "difficultly in breathing", "not able to breathe", "he fainted",
        "slurred speech", "pain in my chest", "blood when I vomit",
    ],
)
def test_red_flags(parser, text):
    assert parser.parse(text)["red_flags"]


@pytest.mark.parametrize("text", ["no pain in chest, just cough", "no difficulty breathing"])
def test_negated_red_flags_are_skipped(parser, text):
    assert parser.parse(text)["red_flags"] == []


def test_nothing_recognised(parser):
    assert parser.parse("hello there") == {
        "symptoms": [], "suggestions": [], "duration": None, "red_flags": []
    }
