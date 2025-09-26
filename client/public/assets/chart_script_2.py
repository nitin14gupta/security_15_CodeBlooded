# Create a detailed AI Guardrails diagram using mermaid
diagram_code = """
flowchart TD
    User[👤 User Input] --> InputGuards{🛡️ Input Filtering}
    
    %% Input Filtering Guardrails
    InputGuards --> Toxicity[🔍 Toxicity Detection<br/>Perspective API<br/>Score: 0-1]
    InputGuards --> Profanity[🚫 Profanity Filter<br/>Keyword Match<br/>Leetspeak Detect]
    InputGuards --> TopicRestr[📋 Topic Restrictions<br/>Blocked Topics<br/>Context Analysis]
    
    Toxicity --> ToxExample["Example: 'You idiot!'<br/>Score: 0.8 → Blocked"]
    Profanity --> ProfExample["Example: 'What the h3ll'<br/>Leetspeak → Blocked"]
    TopicRestr --> TopExample["Example: 'How to hack'<br/>Blocked Topic → Rejected"]
    
    %% Flow to AI Model
    ToxExample --> AIModel{🤖 AI Model}
    ProfExample --> AIModel
    TopExample --> AIModel
    
    %% Output Validation Guardrails
    AIModel --> OutputGuards{🔍 Output Validation}
    
    OutputGuards --> Hallucination[🔎 Hallucination Check<br/>Fact Verification<br/>Knowledge Base]
    OutputGuards --> Alignment[🎯 Content Alignment<br/>Intent Matching<br/>Response Quality]
    OutputGuards --> Consistency[🔄 Consistency Check<br/>Previous Responses<br/>Context Memory]
    
    Hallucination --> HallExample["Example: 'Paris is in Germany'<br/>Fact Check → False → Blocked"]
    Alignment --> AlignExample["Example: User asks weather<br/>AI gives recipe → Misaligned"]
    Consistency --> ConsExample["Example: Contradicts<br/>previous answer → Flagged"]
    
    %% PII Detection & Scrubbing
    HallExample --> PIIGuards{🔒 PII Detection}
    AlignExample --> PIIGuards
    ConsExample --> PIIGuards
    
    PIIGuards --> PIIInput[📥 Input PII Detection<br/>Names, Emails<br/>Phone, Addresses]
    PIIGuards --> PIIOutput[📤 Output PII Prevention<br/>No Personal Info<br/>Generation Block]
    PIIGuards --> DataMask[🎭 Data Masking<br/>Synthetic Replace<br/>Pattern Matching]
    
    PIIInput --> PIIExample1["Input: 'My email is john@test.com'<br/>Detected → Masked as [EMAIL]"]
    PIIOutput --> PIIExample2["Output: Avoids generating<br/>real names/addresses"]
    DataMask --> PIIExample3["'John Smith' →<br/>'[NAME_1]' or 'Alex Johnson'"]
    
    %% Access Controls & RBAC
    PIIExample1 --> AccessControl{🔐 Access Controls}
    PIIExample2 --> AccessControl
    PIIExample3 --> AccessControl
    
    AccessControl --> Roles[👥 User Roles<br/>Admin, Moderator<br/>User, Guest]
    AccessControl --> Permissions[📊 Permissions Matrix<br/>Feature Access<br/>Model Access]
    AccessControl --> Resources[🎛️ Resource Control<br/>Different Models<br/>API Limits]
    
    Roles --> RoleExample["Admin: Full Access<br/>User: Limited Features<br/>Guest: Read-only"]
    Permissions --> PermExample["Matrix: Role × Feature<br/>Admin: ✅✅✅<br/>User: ✅❌✅"]
    Resources --> ResExample["GPT-4: Admin only<br/>GPT-3.5: All users<br/>Custom: Moderator+"]
    
    %% Audit Trails & Logging
    RoleExample --> AuditTrail{📊 Audit & Logging}
    PermExample --> AuditTrail
    ResExample --> AuditTrail
    
    AuditTrail --> IOLogging[💾 I/O Logging<br/>User Messages<br/>AI Responses]
    AuditTrail --> SysEvents[⚡ System Events<br/>Login Attempts<br/>Violations]
    AuditTrail --> Monitoring[📈 Real-time Monitor<br/>Alerts, Dashboard<br/>Threshold Checks]
    AuditTrail --> Compliance[📋 Compliance Report<br/>GDPR, Retention<br/>Audit Reports]
    
    IOLogging --> LogExample1["Log Entry:<br/>{timestamp, user_id<br/>input, output, score}"]
    SysEvents --> LogExample2["Event: Login Failed<br/>User: suspicious_user<br/>Time: 2024-01-15 14:30"]
    Monitoring --> LogExample3["Alert: High toxicity<br/>threshold exceeded<br/>→ Auto-block activated"]
    Compliance --> LogExample4["Monthly Report:<br/>1M requests processed<br/>0.3% blocked, 99.7% clean"]
    
    %% Final Output
    LogExample1 --> SafeOutput[✅ Safe AI Response]
    LogExample2 --> SafeOutput
    LogExample3 --> SafeOutput
    LogExample4 --> SafeOutput
    
    %% Styling for different guardrail types
    classDef inputGuard fill:#B3E5EC,stroke:#1FB8CD,stroke-width:2px
    classDef outputGuard fill:#FFCDD2,stroke:#DB4545,stroke-width:2px
    classDef piiGuard fill:#A5D6A7,stroke:#2E8B57,stroke-width:2px
    classDef accessGuard fill:#9FA8B0,stroke:#5D878F,stroke-width:2px
    classDef auditGuard fill:#FFEB8A,stroke:#D2BA4C,stroke-width:2px
    classDef example fill:#f9f9f9,stroke:#666,stroke-width:1px
    
    class InputGuards,Toxicity,Profanity,TopicRestr inputGuard
    class OutputGuards,Hallucination,Alignment,Consistency outputGuard
    class PIIGuards,PIIInput,PIIOutput,DataMask piiGuard
    class AccessControl,Roles,Permissions,Resources accessGuard
    class AuditTrail,IOLogging,SysEvents,Monitoring,Compliance auditGuard
    class ToxExample,ProfExample,TopExample,HallExample,AlignExample,ConsExample,PIIExample1,PIIExample2,PIIExample3,RoleExample,PermExample,ResExample,LogExample1,LogExample2,LogExample3,LogExample4 example
"""

# Create the mermaid diagram
png_path, svg_path = create_mermaid_diagram(
    diagram_code, 
    png_filepath='ai_guardrails.png',
    svg_filepath='ai_guardrails.svg',
    width=1400,
    height=1000
)

print(f"AI Guardrails diagram saved as:")
print(f"PNG: {png_path}")
print(f"SVG: {svg_path}")