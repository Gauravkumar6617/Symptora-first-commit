"""Turns a free-text description ("vomiting for two days and there's blood")
into symptom ids the model knows, plus duration and red-flag warnings.

Rule-based on purpose: runs locally (no health text leaves the server), is
predictable, and is easy to extend by adding phrases to SYNONYMS.
"""

import re
from difflib import get_close_matches

# Everyday wording -> symptom id. Symptom labels ("chest pain") are matched
# automatically, so only list phrases that differ from the label.
SYNONYMS: dict[str, str] = {
    # stomach / digestion
    "vomit": "vomiting", "vomits": "vomiting", "vomited": "vomiting",
    "throwing up": "vomiting", "threw up": "vomiting", "puking": "vomiting",
    "feel like vomiting": "nausea", "nauseous": "nausea", "queasy": "nausea",
    "loose motion": "diarrhoea", "loose motions": "diarrhoea", "loose stool": "diarrhoea",
    "loose stools": "diarrhoea", "diarrhea": "diarrhoea", "watery stool": "diarrhoea",
    "stomach ache": "stomach_pain", "stomachache": "stomach_pain", "tummy ache": "stomach_pain",
    "tummy pain": "stomach_pain", "belly ache": "belly_pain",
    "constipated": "constipation", "heartburn": "acidity", "gas": "passage_of_gases",
    "vomiting blood": "stomach_bleeding", "blood in vomit": "stomach_bleeding",
    "blood vomit": "stomach_bleeding", "vomit blood": "stomach_bleeding",
    "blood in stool": "bloody_stool", "blood in poop": "bloody_stool", "black stool": "bloody_stool",
    "coughing blood": "blood_in_sputum", "coughing up blood": "blood_in_sputum",
    "blood in cough": "blood_in_sputum", "blood in phlegm": "blood_in_sputum",
    "stool with blood": "bloody_stool", "blood with stool": "bloody_stool",
    "blood in motion": "bloody_stool", "blood in potty": "bloody_stool",
    "sputum with blood": "blood_in_sputum", "cough with blood": "blood_in_sputum",
    "blood in urine": "spotting_urination", "urine with blood": "spotting_urination",
    "no appetite": "loss_of_appetite", "not hungry": "loss_of_appetite",
    # fever / general
    "very high fever": "high_fever", "high temperature": "high_fever",
    "slight fever": "mild_fever", "low fever": "mild_fever", "low grade fever": "mild_fever",
    "tired": "fatigue", "tiredness": "fatigue", "exhausted": "fatigue", "exhaustion": "fatigue",
    "body ache": "muscle_pain", "body pain": "muscle_pain", "body aches": "muscle_pain",
    "muscle ache": "muscle_pain", "sweat": "sweating", "sweaty": "sweating",
    "shivers": "shivering", "dehydrated": "dehydration", "losing weight": "weight_loss",
    # head / nerves
    "head pain": "headache", "head ache": "headache", "migraine": "headache",
    "dizzy": "dizziness", "light headed": "dizziness", "lightheaded": "dizziness",
    "vertigo": "spinning_movements", "room spinning": "spinning_movements",
    "confused": "altered_sensorium", "confusion": "altered_sensorium",
    "blurry vision": "blurred_and_distorted_vision", "blurred vision": "blurred_and_distorted_vision",
    "anxious": "anxiety", "depressed": "depression",
    # chest / breathing / nose / throat
    "short of breath": "breathlessness", "shortness of breath": "breathlessness",
    "difficulty breathing": "breathlessness", "breathing difficulty": "breathlessness",
    "cant breathe": "breathlessness", "cannot breathe": "breathlessness",
    "cant breath": "breathlessness", "unable to breathe": "breathlessness",
    "not able to breathe": "breathlessness", "hard to breathe": "breathlessness",
    "trouble breathing": "breathlessness", "problem breathing": "breathlessness",
    "breathing problem": "breathlessness", "breathing issue": "breathlessness",
    "out of breath": "breathlessness", "breathless": "breathlessness",
    "heart racing": "fast_heart_rate", "fast heartbeat": "fast_heart_rate",
    "sore throat": "throat_irritation", "throat pain": "throat_irritation",
    "blocked nose": "congestion", "stuffy nose": "congestion", "sneezing": "continuous_sneezing",
    "mucus": "phlegm", "coughing": "cough",
    # skin / eyes / urine
    "rash": "skin_rash", "itchy": "itching", "itch": "itching",
    "yellow eyes": "yellowing_of_eyes", "yellow skin": "yellowish_skin", "jaundice": "yellowish_skin",
    "red eyes": "redness_of_eyes", "watery eyes": "watering_from_eyes",
    "burning urine": "burning_micturition", "burning while peeing": "burning_micturition",
    "pain while urinating": "burning_micturition", "frequent urination": "polyuria",
    "peeing a lot": "polyuria",
}

# Vague words: offer choices instead of guessing. Only used when no more
# specific phrase (e.g. "blood in stool") already matched those words.
AMBIGUOUS: dict[str, list[str]] = {
    "blood": ["stomach_bleeding", "bloody_stool", "blood_in_sputum", "spotting_urination"],
    "bleeding": ["stomach_bleeding", "bloody_stool", "blood_in_sputum", "spotting_urination"],
    "fever": ["high_fever", "mild_fever"],
    "temperature": ["high_fever", "mild_fever"],
    "weak": ["fatigue", "muscle_weakness", "weakness_in_limbs"],
    "weakness": ["fatigue", "muscle_weakness", "weakness_in_limbs"],
    "cold": ["runny_nose", "congestion", "chills"],
}

# Phrase -> warning. Checked on the raw text, whatever symptoms matched.
RED_FLAGS: list[tuple[re.Pattern, str]] = [
    (re.compile(r"\b(vomit\w*|throw\w* up|threw up)\b.*\bblood|\bblood\b.*\bvomit"),
     "Blood with vomiting can be a medical emergency. Seek urgent care now."),
    (re.compile(
        r"\b(cant|cannot|can not|not able to|unable to|struggling to|difficult\w*|trouble|problem|hard to)"
        r"( in| with)? breath"
    ),
     "Serious trouble breathing needs emergency care. Call an ambulance."),
    (re.compile(r"\b(fainted|passed out|unconscious|blacked out)\b"),
     "Fainting or losing consciousness needs urgent medical attention."),
    (re.compile(r"\bslurred speech\b|\bface (is )?droop|\bone side\b.*\b(weak|numb)"),
     "These can be signs of a stroke. Call emergency services immediately."),
    (re.compile(r"\bchest pain\b|\bpain in chest\b"),
     "Chest pain can be serious. If it is severe or spreading, seek urgent care."),
]

# Linking words are ignored on both sides, so "difficulty in breathing" matches
# "difficulty breathing" and "stool with blood" matches "blood in stool".
CONNECTORS = {"in", "of", "with", "while", "during", "when", "at", "on", "to", "a", "an"}
# Dropped from the text before matching: "pain in my chest" -> "pain in chest".
SKIP_WORDS = {"my", "the", "his", "her", "their", "our", "your", "some", "very", "bad", "severe", "really"}
NEGATIONS = {"no", "not", "without", "never", "dont", "didnt", "isnt", "havent", "hasnt"}
FILLER = {"of", "the", "in", "and", "a", "on", "to", "from", "over"}

NUMBER_WORDS = {
    "a": 1, "an": 1, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6,
    "seven": 7, "eight": 8, "nine": 9, "ten": 10, "couple": 2, "few": 3, "several": 3,
}
UNIT_DAYS = {"hour": 0, "day": 1, "week": 7, "month": 30, "year": 365}
DURATION_RE = re.compile(
    r"\b(\d+|" + "|".join(NUMBER_WORDS) + r")\s*(?:of\s+)?(hour|day|week|month|year)s?\b"
)


def _tokens(text: str) -> list[str]:
    text = text.lower().replace("'", "")
    return re.findall(r"[a-z0-9]+", text)


def _key(words) -> tuple[str, ...]:
    return tuple(w for w in words if w not in CONNECTORS)


class SymptomParser:
    def __init__(self, symptom_ids: list[str]):
        known = set(symptom_ids)
        # phrase (as a token tuple) -> symptom id; longest phrases matched first
        phrases: dict[tuple[str, ...], str] = {}
        for sid in symptom_ids:
            words = tuple(w for w in re.findall(r"[a-z]+", sid) if w not in FILLER)
            phrases[_key(re.findall(r"[a-z]+", sid))] = sid  # full label, e.g. pain in anal region
            if words:
                phrases.setdefault(_key(words), sid)  # without filler words
            if len(words) >= 2 and words[-1] == "pain":
                phrases.setdefault(("pain", *words[:-1]), sid)  # chest pain -> pain in chest
        for phrase, sid in SYNONYMS.items():
            assert sid in known, f"SYNONYMS points at unknown symptom {sid}"
            phrases[_key(_tokens(phrase))] = sid
        phrases.pop((), None)
        self.phrases = sorted(phrases.items(), key=lambda kv: -len(kv[0]))
        self.vocabulary = sorted({w for p in phrases for w in p} | set(AMBIGUOUS) | set(NUMBER_WORDS))

    def _fix_typos(self, tokens: list[str]) -> list[str]:
        """'vomiitng' -> 'vomiting'. Short words are left alone to avoid false fixes."""
        fixed = []
        for t in tokens:
            if len(t) >= 4 and t not in self.vocabulary:
                match = get_close_matches(t, self.vocabulary, n=1, cutoff=0.8)
                t = match[0] if match else t
            fixed.append(t)
        return fixed

    def parse(self, text: str) -> dict:
        fixed = [t for t in self._fix_typos(_tokens(text)) if t not in SKIP_WORDS]
        clean = " ".join(fixed)  # for duration / red-flag patterns, which need linking words
        tokens = [t for t in fixed if t not in CONNECTORS]
        used = [False] * len(tokens)
        found: list[str] = []

        def negated(start: int) -> bool:
            return any(t in NEGATIONS for t in tokens[max(0, start - 2):start])

        for phrase, sid in self.phrases:
            n = len(phrase)
            for i in range(len(tokens) - n + 1):
                if tuple(tokens[i:i + n]) == phrase and not any(used[i:i + n]):
                    used[i:i + n] = [True] * n
                    if not negated(i) and sid not in found:
                        found.append(sid)

        suggestions = []
        for i, t in enumerate(tokens):
            if t in AMBIGUOUS and not used[i] and not negated(i):
                options = [s for s in AMBIGUOUS[t] if s not in found]
                if options and t not in [s["phrase"] for s in suggestions]:
                    suggestions.append({"phrase": t, "options": options})

        return {
            "symptoms": found,
            "suggestions": suggestions,
            "duration": self._duration(clean),
            "red_flags": self._red_flags(clean),
        }

    @staticmethod
    def _red_flags(clean: str) -> list[str]:
        """Warnings whose pattern appears without a 'no' / 'not' just before it."""
        flags = []
        for pattern, message in RED_FLAGS:
            for match in pattern.finditer(clean):
                before = clean[: match.start()].split()[-2:]
                if not NEGATIONS.intersection(before):
                    flags.append(message)
                    break
        return flags

    @staticmethod
    def _duration(clean: str) -> str | None:
        days = []
        for amount, unit in DURATION_RE.findall(clean):
            n = int(amount) if amount.isdigit() else NUMBER_WORDS[amount]
            days.append(n * UNIT_DAYS[unit] if unit != "hour" else 0)
        if re.search(r"\b(today|this morning|since morning|tonight)\b", clean):
            days.append(0)
        if re.search(r"\b(yesterday|last night)\b", clean):
            days.append(1)
        if not days:
            return None
        longest = max(days)
        if longest < 1:
            return "today"
        if longest < 7:
            return "few_days"
        if longest < 29:  # up to 4 weeks
            return "week"
        return "longer"
