import plotly.figure_factory as ff
import plotly.graph_objects as go
import pandas as pd
from datetime import datetime, timedelta

# Create the project data with proper dates and color coding by work type
tasks = [
    # Phase 1: Foundation Setup (Weeks 1-2)
    dict(Task="Next.js Frontend Setup", Start='2024-01-01', Finish='2024-01-15', Resource='Frontend'),
    dict(Task="Flask Backend Setup", Start='2024-01-01', Finish='2024-01-15', Resource='Backend'),
    dict(Task="JWT Authentication", Start='2024-01-08', Finish='2024-01-15', Resource='Backend'),
    dict(Task="Database Config", Start='2024-01-08', Finish='2024-01-15', Resource='Backend'),
    dict(Task="User Registration", Start='2024-01-08', Finish='2024-01-15', Resource='Backend'),
    
    # Phase 2: Core AI Integration (Weeks 3-4)
    dict(Task="AI Model API", Start='2024-01-15', Finish='2024-01-29', Resource='Integration'),
    dict(Task="Basic Chat Logic", Start='2024-01-22', Finish='2024-01-29', Resource='Integration'),
    dict(Task="Session Management", Start='2024-01-29', Finish='2024-02-05', Resource='Backend'),
    dict(Task="Error Handling", Start='2024-02-05', Finish='2024-02-12', Resource='Backend'),
    
    # Phase 3: Input Guardrails (Weeks 5-6)
    dict(Task="Perspective API", Start='2024-02-12', Finish='2024-02-26', Resource='Guardrails'),
    dict(Task="Detoxify Backup", Start='2024-02-19', Finish='2024-02-26', Resource='Guardrails'),
    dict(Task="PII Detection", Start='2024-02-26', Finish='2024-03-05', Resource='Guardrails'),
    dict(Task="Topic Filtering", Start='2024-03-05', Finish='2024-03-12', Resource='Guardrails'),
    dict(Task="Rate Limiting", Start='2024-03-12', Finish='2024-03-19', Resource='Guardrails'),
    
    # Phase 4: Output Guardrails (Weeks 7-8)
    dict(Task="Content Validation", Start='2024-03-19', Finish='2024-04-02', Resource='Integration'),
    dict(Task="Hallucination Check", Start='2024-03-26', Finish='2024-04-02', Resource='Integration'),
    dict(Task="Content Alignment", Start='2024-04-02', Finish='2024-04-09', Resource='Integration'),
    dict(Task="Response Filter", Start='2024-04-09', Finish='2024-04-16', Resource='Guardrails'),
    
    # Phase 5: Advanced Features (Weeks 9-10)
    dict(Task="Presidio PII", Start='2024-04-16', Finish='2024-04-30', Resource='Advanced'),
    dict(Task="RBAC System", Start='2024-04-23', Finish='2024-04-30', Resource='Advanced'),
    dict(Task="Admin Dashboard", Start='2024-04-30', Finish='2024-05-07', Resource='Frontend'),
    dict(Task="User Management", Start='2024-05-07', Finish='2024-05-14', Resource='Advanced'),
    
    # Phase 6: Monitoring & Logging (Weeks 11-12)
    dict(Task="Audit Logging", Start='2024-05-14', Finish='2024-05-28', Resource='Monitoring'),
    dict(Task="Monitor Dashboard", Start='2024-05-21', Finish='2024-05-28', Resource='Monitoring'),
    dict(Task="Real-time Alerts", Start='2024-05-28', Finish='2024-06-04', Resource='Monitoring'),
    dict(Task="Compliance Report", Start='2024-06-04', Finish='2024-06-11', Resource='Monitoring'),
    
    # Phase 7: Testing & Optimization (Weeks 13-14)
    dict(Task="Guardrails Test", Start='2024-06-11', Finish='2024-06-25', Resource='Testing'),
    dict(Task="Performance Test", Start='2024-06-18', Finish='2024-06-25', Resource='Testing'),
    dict(Task="Security Test", Start='2024-06-25', Finish='2024-07-02', Resource='Testing'),
    dict(Task="Load Test", Start='2024-07-02', Finish='2024-07-09', Resource='Testing'),
    
    # Phase 8: Deployment & Documentation (Weeks 15-16)
    dict(Task="Production Setup", Start='2024-07-09', Finish='2024-07-23', Resource='Deployment'),
    dict(Task="API Documentation", Start='2024-07-16', Finish='2024-07-23', Resource='Deployment'),
    dict(Task="User Guide", Start='2024-07-23', Finish='2024-07-30', Resource='Deployment'),
    dict(Task="System Monitor", Start='2024-07-30', Finish='2024-08-06', Resource='Deployment')
]

# Define color mapping for different work types
colors = {
    'Frontend': '#1FB8CD',      # Strong cyan
    'Backend': '#DB4545',       # Bright red  
    'Integration': '#2E8B57',   # Sea green
    'Guardrails': '#5D878F',    # Cyan
    'Advanced': '#D2BA4C',      # Moderate yellow
    'Monitoring': '#B4413C',    # Moderate red
    'Testing': '#964325',       # Dark orange
    'Deployment': '#944454'     # Pink-red
}

# Create the Gantt chart
fig = ff.create_gantt(
    tasks,
    colors=colors,
    index_col='Resource',
    show_colorbar=True,
    group_tasks=True,
    showgrid_x=True,
    showgrid_y=True,
    title="AI Companion Guardrail System - 16-Week Implementation Roadmap"
)

# Add milestones as scatter points
milestone_dates = [
    ('2024-01-15', 'Foundation Complete'),
    ('2024-02-05', 'AI Core Ready'),
    ('2024-04-16', 'Guards Implemented'),
    ('2024-08-06', 'System Complete')
]

for date, milestone in milestone_dates:
    fig.add_trace(go.Scatter(
        x=[date, date],
        y=[-0.5, len(tasks) + 0.5],
        mode='lines',
        line=dict(color='red', width=2, dash='dash'),
        name=milestone,
        showlegend=True
    ))

# Improve layout and formatting
fig.update_layout(
    height=800,
    xaxis_title="Timeline (2024)",
    yaxis_title="Tasks by Phase",
    font=dict(size=12),
    legend=dict(
        orientation='v',
        yanchor='top',
        y=1,
        xanchor='left',
        x=1.02
    )
)

# Update x-axis to show weeks
fig.update_xaxes(
    tickformat="%b %d",
    dtick="W1",
    tickangle=45
)

fig.update_yaxes(
    tickfont=dict(size=10)
)

# Save as PNG and SVG
fig.write_image("ai_guardrail_gantt.png")
fig.write_image("ai_guardrail_gantt.svg", format="svg")

print("Enhanced Gantt chart with color coding, milestones, and improved readability created successfully!")