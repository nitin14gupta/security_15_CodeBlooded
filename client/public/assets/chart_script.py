# Create an improved system architecture diagram with color-coded flows and better layout
diagram_code = """
graph TD
    %% Frontend Layer
    subgraph FE ["🖥️ Frontend Layer (Next.js)"]
        UI1[Chat Interface]
        UI2[Admin Dashboard] 
        Auth[Auth Components]
        RT[Real-time Features]
    end
    
    %% API Gateway - more compact layout
    subgraph GW ["🔐 API Gateway/Middleware"]
        Valid[Request Validation]
        AuthZ[Auth/Authorization]
        Rate[Rate Limiting]
        InitFilter[Initial Filtering]
    end
    
    %% Backend - aligned vertically
    subgraph BE ["⚙️ Backend (Flask)"]
        App[Application Server]
        UserMgmt[User Management]
        SessionMgmt[Session Management]
        API[API Endpoints]
    end
    
    %% Guardrails - core system
    subgraph GR ["🛡️ Guardrail System"]
        InputFilter[Input Filter Module<br/>• Toxicity Detection<br/>• PII Scrubbing<br/>• Topic Restrictions]
        AIInterface[AI Model Interface]
        OutputValid[Output Validation<br/>• Hallucination Check<br/>• Content Alignment]
        AuditLog[Audit Logger]
    end
    
    %% External Services - organized
    subgraph EXT ["🌐 External Services"]
        ContentMod[Content Moderation<br/>Perspective/Detoxify]
        PIIDetect[PII Detection<br/>Presidio/Comprehend]
        LLMAPIs[AI Model APIs<br/>OpenAI/Anthropic]
        OAuthProvs[OAuth Providers]
    end
    
    %% Storage - compact
    subgraph STORE ["💾 Data Storage"]
        UserDB[User Database<br/>PostgreSQL]
        LogDB[Audit Logs DB]
        RedisCache[Session Cache<br/>Redis]
    end
    
    %% Monitoring
    subgraph MON ["📊 Monitoring & Analytics"]
        Monitor[Real-time Monitor]
        Compliance[Compliance Reports]
        Metrics[Performance Metrics]
    end
    
    %% User Request Flow (Blue)
    UI1 -->|1. User Request| Valid
    Valid -->|2| AuthZ
    AuthZ -->|3| Rate
    Rate -->|4| InitFilter
    InitFilter -->|5| App
    App -->|6| InputFilter
    InputFilter -->|7a| ContentMod
    InputFilter -->|7b| PIIDetect
    InputFilter -->|8| AIInterface
    AIInterface -->|9| LLMAPIs
    LLMAPIs -->|10| OutputValid
    OutputValid -->|11| App
    App -->|12. Response| UI1
    
    %% Admin Flow (Red dashed)
    UI2 -.->|Admin Request| AuthZ
    AuthZ -.->|Admin Auth| UserMgmt
    UserMgmt -.->|Admin Data| Monitor
    
    %% Authentication Flow (Green thick)
    Auth ==>|Auth Request| OAuthProvs
    OAuthProvs ==>|Token| UserMgmt
    UserMgmt ==>|Session| SessionMgmt
    
    %% Data Storage Connections (Purple)
    App <-->|User Data| UserDB
    AuditLog -->|Logs| LogDB
    SessionMgmt <-->|Cache| RedisCache
    
    %% Audit and Monitoring Flow (Orange)
    InputFilter -.->|Audit Trail| AuditLog
    OutputValid -.->|Audit Trail| AuditLog
    AuditLog -.->|Monitoring Data| Monitor
    Monitor -.->|Reports| Compliance
    Monitor -.->|Metrics| Metrics
    
    %% Styling for different flow types
    classDef userFlow fill:#B3E5EC,stroke:#1FB8CD,stroke-width:2px
    classDef adminFlow fill:#FFCDD2,stroke:#DB4545,stroke-width:2px
    classDef authFlow fill:#A5D6A7,stroke:#2E8B57,stroke-width:3px
    classDef storageFlow fill:#E1BEE7,stroke:#8E24AA,stroke-width:2px
    classDef auditFlow fill:#FFEB8A,stroke:#D2BA4C,stroke-width:2px
"""

# Create the diagram with improved layout
png_path, svg_path = create_mermaid_diagram(
    diagram_code, 
    png_filepath='improved_ai_architecture.png',
    svg_filepath='improved_ai_architecture.svg',
    width=1400,
    height=900
)

print(f"Improved AI Guardrail System architecture diagram created: {png_path} and {svg_path}")