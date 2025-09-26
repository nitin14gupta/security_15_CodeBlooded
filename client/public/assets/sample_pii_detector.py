"""
PII Detection and Scrubbing using multiple approaches
"""
import re
import hashlib
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
import logging

@dataclass
class PIIResult:
    has_pii: bool
    pii_types: List[str]
    cleaned_text: str
    redacted_items: Dict[str, List[str]]

class PIIDetector:
    def __init__(self):
        # Regex patterns for common PII
        self.patterns = {
            'email': re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'),
            'phone': re.compile(r'(?:\+?1[-\s]?)?\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}'),
            'ssn': re.compile(r'\b\d{3}-\d{2}-\d{4}\b'),
            'credit_card': re.compile(r'\b(?:\d{4}[-\s]?){3}\d{4}\b'),
            'ip_address': re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}\b'),
            'name': re.compile(r'\b[A-Z][a-z]+ [A-Z][a-z]+\b'),  # Simple name pattern
            'address': re.compile(r'\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd)', re.IGNORECASE)
        }

        # Replacement strategies
        self.replacements = {
            'email': '[EMAIL]',
            'phone': '[PHONE]',
            'ssn': '[SSN]',
            'credit_card': '[CREDIT_CARD]',
            'ip_address': '[IP_ADDRESS]',
            'name': '[NAME]',
            'address': '[ADDRESS]'
        }

    def detect_and_scrub_pii(self, text: str) -> PIIResult:
        """
        Detect and remove/replace PII in text
        """
        has_pii = False
        pii_types = []
        redacted_items = {}
        cleaned_text = text

        for pii_type, pattern in self.patterns.items():
            matches = pattern.findall(text)
            if matches:
                has_pii = True
                pii_types.append(pii_type)
                redacted_items[pii_type] = matches

                # Replace with placeholder
                cleaned_text = pattern.sub(self.replacements[pii_type], cleaned_text)

                # Log PII detection (without logging the actual PII)
                logging.warning(f"PII detected: {pii_type}, count: {len(matches)}")

        return PIIResult(
            has_pii=has_pii,
            pii_types=pii_types,
            cleaned_text=cleaned_text,
            redacted_items=redacted_items
        )

    def hash_pii(self, pii_value: str) -> str:
        """Hash PII for logging purposes"""
        return hashlib.sha256(pii_value.encode()).hexdigest()[:8]

    def advanced_pii_detection(self, text: str) -> PIIResult:
        """
        Advanced PII detection using more sophisticated patterns
        Could be extended to use Microsoft Presidio or other libraries
        """
        # This would integrate with Microsoft Presidio or AWS Comprehend
        # For now, using the basic regex approach
        return self.detect_and_scrub_pii(text)

# Usage example
if __name__ == "__main__":
    detector = PIIDetector()

    test_texts = [
        "My email is john.doe@example.com and phone is 555-123-4567",
        "Hello, this is a normal message without PII",
        "My SSN is 123-45-6789 and I live at 123 Main Street"
    ]

    for text in test_texts:
        result = detector.detect_and_scrub_pii(text)
        print(f"Original: {text}")
        print(f"Cleaned: {result.cleaned_text}")
        print(f"PII Found: {result.pii_types}")
        print("-" * 50)