import re

# Negation words that flip the meaning of what follows
NEGATION_WORDS = {
    'not', 'no', 'never', 'neither', 'nor', 'nobody', 'nothing', 'nowhere',
    "didn't", "didn't", "don't", "don't", "doesn't", "doesn't",
    "wasn't", "wasn't", "weren't", "weren't",
    "haven't", "haven't", "hasn't", "hasn't", "hadn't", "hadn't",
    "can't", "can't", "cannot", "couldn't", "couldn't",
    "won't", "won't", "wouldn't", "wouldn't", "shouldn't", "shouldn't",
    "isn't", "isn't", "aren't", "aren't",
    'did not', 'do not', 'does not', 'was not', 'were not',
    'have not', 'has not', 'had not', 'can not', 'could not',
    'will not', 'would not', 'should not', 'is not', 'are not',
}

# Number of words to drop after a negation word
NEGATION_WINDOW = 6


def remove_negated_tokens(text: str) -> str:
    """
    Remove words that are preceded by a negation word within a short window.

    Example:
      "he did not fix the bug"  →  "he"
      "I fixed the bug"         →  "I fixed the bug"   (unchanged)
      "no documentation written" →  ""
    """
    # Normalise multi-word negations to single tokens first
    text_lower = text.lower()
    for phrase in ['did not', 'do not', 'does not', 'was not', 'were not',
                   'have not', 'has not', 'had not', 'can not', 'could not',
                   'will not', 'would not', 'should not', 'is not', 'are not']:
        text_lower = text_lower.replace(phrase, phrase.replace(' ', '_NEG_'))

    tokens = text_lower.split()
    result = []
    skip_until = -1

    for i, token in enumerate(tokens):
        # Expand back multi-word negations
        token_clean = token.replace('_NEG_', ' ')

        if i < skip_until:
            continue  # inside negation window — drop this word

        if token_clean in NEGATION_WORDS or token in NEGATION_WORDS:
            # Start dropping the next NEGATION_WINDOW words
            skip_until = i + 1 + NEGATION_WINDOW
            # Also drop the negation word itself (don't want "not" in the text)
            continue

        result.append(token_clean)

    return ' '.join(result)


def preprocess(text: str) -> str:
    """Full preprocessing pipeline before classification."""
    # 1. Lowercase
    text = text.lower()
    # 2. Remove negated phrases
    text = remove_negated_tokens(text)
    # 3. Strip punctuation
    text = re.sub(r'[^\w\s]', ' ', text)
    # 4. Collapse whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text
