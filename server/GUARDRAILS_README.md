# Input Guardrails Implementation

This document describes the comprehensive input guardrails system implemented for the SecurityApp chat endpoint.

## Features

### 1. PII Detection and Scrubbing
- **Library**: Microsoft Presidio
- **Capabilities**:
  - Detects emails, phone numbers, SSNs, credit cards, IP addresses
  - Uses both Presidio's NLP models and custom regex patterns
  - Automatically scrubs PII with configurable replacement strategies
  - Provides detailed analysis of detected entities

### 2. Toxicity Detection
- **Library**: Detoxify
- **Capabilities**:
  - Detects toxic content using pre-trained models
  - Configurable toxicity threshold
  - Categorizes toxicity types (hate, threat, obscene, etc.)
  - Blocks messages above threshold

### 3. Input Validation
- **Rules**:
  - Message length limits (1-2000 characters)
  - Word count limits (1-300 words)
  - Line count limits (max 20 lines)
  - Character validation (allowed characters only)
  - Spam pattern detection

### 4. Content Filtering
- **Restricted Keywords**: Violence, hate speech, illegal activities, etc.
- **Spam Detection**: Repeated characters, excessive caps, URL patterns
- **Topic Restrictions**: Configurable list of disallowed topics

## API Endpoints

### Chat Endpoint (Modified)
```
POST /api/gemini/chat
```

**Request Body**:
```json
{
  "message": "User message here",
  "user_id": "optional_user_id"
}
```

**Response** (Success):
```json
{
  "response": "AI response text",
  "model": "gemini-2.0-flash",
  "guardrails_applied": {
    "pii_detected": true,
    "pii_scrubbed": true,
    "risk_level": "MEDIUM",
    "warnings": ["PII detected: EMAIL, PHONE_NUMBER"]
  }
}
```

**Response** (Blocked):
```json
{
  "error": "Message blocked by guardrails",
  "warnings": ["Message contains toxic content (hate)"],
  "risk_level": "HIGH",
  "blocked_reasons": ["Toxicity detected"]
}
```

### Safety Analysis Endpoint
```
POST /api/gemini/analyze-safety
```

**Request Body**:
```json
{
  "message": "Message to analyze"
}
```

**Response**:
```json
{
  "message_length": 45,
  "word_count": 8,
  "analysis_timestamp": "2024-01-01T00:00:00Z",
  "safety_checks": {
    "toxicity": {
      "is_toxic": false,
      "confidence": 0.2,
      "categories": {...}
    },
    "pii": {
      "has_pii": true,
      "entity_types": ["EMAIL", "PHONE_NUMBER"]
    },
    "content": {
      "has_restricted_content": false,
      "found_keywords": []
    },
    "validation": {
      "is_valid": true,
      "violations": []
    }
  },
  "overall_safety": {
    "is_safe": true,
    "recommendations": []
  }
}
```

## Configuration

The guardrails can be configured by modifying the `GuardrailsService` configuration:

```python
config = {
    'toxicity_threshold': 0.7,        # Toxicity detection threshold
    'pii_threshold': 0.5,             # PII detection confidence threshold
    'enable_pii_scrubbing': True,    # Enable/disable PII scrubbing
    'enable_toxicity_detection': True, # Enable/disable toxicity detection
    'enable_input_validation': True,  # Enable/disable input validation
    'block_on_high_risk': True        # Block messages on high risk
}
```

## Installation Requirements

Add these to your `requirements.txt`:
```
presidio_analyzer
presidio_anonymizer
detoxify==0.5.2
```

Also install the spaCy model:
```bash
python -m spacy download en_core_web_lg
```

## Testing

Run the test script to verify functionality:
```bash
cd server
python test_guardrails.py
```

## Usage Examples

### Basic Usage
```python
from utils.guardrails import guardrails_service

# Process a message
result = guardrails_service.process_message("My email is test@example.com")

if result['should_block']:
    print(f"Message blocked: {result['warnings']}")
else:
    print(f"Processed message: {result['processed_message']}")
```

### Safety Analysis
```python
# Get detailed safety report
report = guardrails_service.get_safety_report("Message to analyze")
print(f"Safe: {report['overall_safety']['is_safe']}")
```

### PII Detection Only
```python
from utils.pii_guard import pii_guard

# Detect PII
summary = pii_guard.get_pii_summary("My phone is 555-123-4567")
print(f"PII detected: {summary['has_pii']}")

# Scrub PII
scrubbed, info = pii_guard.scrub_pii("My phone is 555-123-4567")
print(f"Scrubbed: {scrubbed}")
```

## Error Handling

The system gracefully handles errors:
- If Presidio fails to initialize, PII detection is disabled
- If Detoxify fails to load, toxicity detection is disabled
- All errors are logged and returned in the response
- The system continues to function with reduced capabilities

## Performance Considerations

- PII detection and scrubbing adds ~100-500ms per message
- Toxicity detection adds ~200-800ms per message
- Input validation is very fast (~1-5ms)
- Consider caching for high-traffic applications

## Security Notes

- PII scrubbing replaces sensitive data with placeholders
- Original messages are not stored when PII is detected
- All processing is done server-side
- User IDs are optional and used only for logging
