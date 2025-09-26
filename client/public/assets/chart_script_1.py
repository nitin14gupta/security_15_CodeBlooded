# Create a detailed user flow flowchart for the AI Companion Guardrail System
diagram_code = """
flowchart TD
    A([User Input]) --> B{Authenticated?}
    B -->|No| C[Redirect to Login]
    C --> A
    B -->|Yes| D[Next.js Frontend]
    D --> E[Flask Backend]
    E --> F[Input Guardrails]
    F --> G{Toxicity Check}
    G -->|Fail| H[Return Error/Warning]
    G -->|Pass| I{PII Detection}
    I -->|Fail| J[Scrub PII & Continue]
    I -->|Pass| K{Topic Restriction}
    J --> K
    K -->|Fail| H
    K -->|Pass| L{Rate Limit}
    L -->|Exceed| H
    L -->|Pass| M[Send to LLM API]
    M --> N[AI Response Generated]
    N --> O[Output Guardrails]
    O --> P{Hallucination Check}
    P -->|Fail| Q{Retry Count < 3?}
    Q -->|Yes| M
    Q -->|No| R[Safe Default Response]
    P -->|Pass| S{Content Alignment}
    S -->|Fail| Q
    S -->|Pass| T{Output PII Check}
    T -->|Fail| U[Remove PII]
    T -->|Pass| V{Output Toxicity}
    U --> V
    V -->|Fail| Q
    V -->|Pass| W[Log Interaction]
    W --> X[Return Response]
    X --> Y[Display in Frontend]
    Y --> Z([End])
    H --> W
    R --> W
    
    style A fill:#B3E5EC
    style Z fill:#B3E5EC
    style H fill:#FFCDD2
    style R fill:#FFCDD2
"""

# Create the mermaid diagram
create_mermaid_diagram(diagram_code, 'ai_guardrail_flowchart.png', 'ai_guardrail_flowchart.svg')