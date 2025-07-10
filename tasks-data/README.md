# Task Manager Data Directory

This directory contains the TaskManager project data files.

## Files

- `task-tracker.json`: Main project and task data
- `agents.json`: Agent registry and capabilities
- `README.md`: This documentation file

## Quick Start

```bash
# Set your agent identity
export TASK_MANAGER_AGENT_ID=your-agent-id

# Check your tasks
node task-manager.js my-tasks

# Get recommendations
node task-manager.js my-recommendations

# Start working on a task
node task-manager.js start TASK-001
```

## Environment Variables

Set these in your `.env` file or environment:

- `TASK_MANAGER_AGENT_ID`: Your agent identifier
- `TASK_MANAGER_DATA_DIR`: Path to this data directory
- `TASK_MANAGER_USE_CURRENT_DIR`: Use current directory instead of ./tasks-data

## Agent Types

- **human**: Human team members with full capabilities
- **ai**: AI agents with specific capabilities

## Task Workflow

1. `todo` → `in-progress` → `completed`
2. Optional: `blocked`, `review`, `cancelled`

## Priority Levels

- `critical` 🔴: Must be done immediately
- `high` 🟠: Important and urgent
- `medium` 🟡: Normal priority
- `low` 🟢: Can be deferred

For more information, see the main TaskManager documentation.
