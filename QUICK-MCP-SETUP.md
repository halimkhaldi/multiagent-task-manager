# Quick MCP Setup with NPX

Get the Multiagent Task Manager working with Claude Desktop in under 5 minutes using npx.

## 🚀 1-Minute Setup

### Step 1: Test NPX Access
```bash
npx multiagent-task-manager-mcp --help
```

### Step 2: Configure Claude Desktop

**macOS:** Edit `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** Edit `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "multiagent-task-manager": {
      "command": "npx",
      "args": ["multiagent-task-manager-mcp"],
      "env": {
        "TASK_MANAGER_DATA_DIR": "~/Documents/TaskManager",
        "TASK_MANAGER_AGENT_ID": "claude-assistant"
      }
    }
  }
}
```

### Step 3: Restart Claude Desktop

That's it! Claude now has access to the task manager.

## ✅ Quick Test

Ask Claude:
```
Initialize a new task manager project and create a task called "Test Task"
```

Claude will use:
- `init_task_manager` to set up the project
- `create_task` to create your task

## 🎯 What You Get

**13 MCP Tools Available:**
- `init_task_manager` - Set up projects
- `create_task` - Create tasks
- `list_tasks` - View tasks with filters
- `add_agent` - Add team members
- `assign_agent` - Assign work
- `get_recommendations` - AI task suggestions
- `get_project_status` - Project overview
- `agent_check_in` - Agent status
- `start_task` / `complete_task` - Workflow actions
- `get_agent_workload` - Workload analysis
- `list_agents` - Team overview
- `update_task` - Modify tasks
- `export_project` - Data export

## 💡 Example Workflows

### Project Setup
```
"Set up a new web development project with 3 agents: frontend developer, backend developer, and QA tester"
```

### Task Management
```
"Create 5 tasks for building a login system, assign them appropriately, and show me the project status"
```

### Agent Workflows
```
"Check in as the frontend developer, get my recommendations, and start the highest priority task"
```

## 🔧 Customization

### Different Data Directory
```json
{
  "env": {
    "TASK_MANAGER_DATA_DIR": "~/Projects/MyProject",
    "TASK_MANAGER_AGENT_ID": "my-agent"
  }
}
```

### Multiple Projects
```json
{
  "mcpServers": {
    "project-alpha": {
      "command": "npx",
      "args": ["multiagent-task-manager-mcp"],
      "env": {
        "TASK_MANAGER_DATA_DIR": "~/Projects/Alpha",
        "TASK_MANAGER_AGENT_ID": "alpha-assistant"
      }
    },
    "project-beta": {
      "command": "npx",
      "args": ["multiagent-task-manager-mcp"],
      "env": {
        "TASK_MANAGER_DATA_DIR": "~/Projects/Beta", 
        "TASK_MANAGER_AGENT_ID": "beta-assistant"
      }
    }
  }
}
```

## 🚨 Troubleshooting

**"Command not found"**
- Make sure Node.js is installed
- Test: `npx --version`

**"Permission denied"**
- Ensure NPX has internet access to download packages

**"Agent not found"**
- Initialize the project first: "Initialize task manager"

**Claude doesn't see the tools**
- Restart Claude Desktop after config changes
- Check JSON syntax in config file

## 🌟 Pro Tips

1. **Start Fresh**: Always begin with "Initialize task manager"

2. **Use Natural Language**: 
   - "Add a frontend developer with React skills"
   - "Show me high priority tasks for the backend team"
   - "Get recommendations for Sarah and start her highest priority task"

3. **Combine Operations**:
   - "Create a project roadmap with 10 tasks, assign them to appropriate agents, and show me the timeline"

4. **Export Data**: 
   - "Export the current project data" gives you JSON for backup

## 📚 Full Documentation

- Complete guide: `MCP-SETUP.md`
- CLI usage: `npx task-manager --help`
- Package info: `npx multiagent-task-manager-mcp --version`

---

**That's it!** Your AI assistant now has full access to enterprise-grade multi-agent task management. 🎉