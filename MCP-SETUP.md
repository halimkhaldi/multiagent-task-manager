# MCP Setup Guide for Multiagent Task Manager

This guide explains how to set up the Multiagent Task Manager as an MCP (Model Context Protocol) tool for AI assistants like Claude Desktop.

## Overview

The MCP server exposes all task management functionality through a standardized protocol, allowing AI assistants to:
- Initialize and manage task projects
- Create, update, and assign tasks
- Manage agents and workloads
- Get intelligent recommendations
- Track project progress
- Perform agent workflows

## Prerequisites

1. **Node.js** (v14 or later)
2. **MCP SDK** dependencies
3. **Claude Desktop** or compatible MCP client

## Installation

### 1. Install MCP Dependencies

```bash
npm install @modelcontextprotocol/sdk
```

### 2. Verify NPX Access

No installation required! You can use npx directly:

```bash
# Test the MCP server (will auto-install if needed)
npx multiagent-task-manager-mcp --help

# Or test the main CLI
npx task-manager status
```

### 3. Optional: Global Installation

For better performance, you can install globally:

```bash
npm install -g multiagent-task-manager
```

## Configuration

### Claude Desktop Configuration

Add to your Claude Desktop configuration file:

**Location:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

**Configuration:**

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

### Alternative: Local Development Setup

**Alternative Methods:**

1. **Using npx with specific package (recommended):**
```json
{
  "mcpServers": {
    "multiagent-task-manager": {
      "command": "npx",
      "args": ["multiagent-task-manager-mcp"],
      "env": {
        "TASK_MANAGER_DATA_DIR": "./my-projects",
        "TASK_MANAGER_AGENT_ID": "dev-assistant"
      }
    }
  }
}
```

2. **Local development setup:**
```json
{
  "mcpServers": {
    "multiagent-task-manager": {
      "command": "node",
      "args": ["./mcp-server.js"],
      "cwd": "/path/to/multiagent-task-manager",
      "env": {
        "TASK_MANAGER_DATA_DIR": "./my-projects",
        "TASK_MANAGER_AGENT_ID": "dev-assistant"
      }
    }
  }
}
```

3. **Global installation:**
```json
{
  "mcpServers": {
    "multiagent-task-manager": {
      "command": "multiagent-task-manager-mcp",
      "env": {
        "TASK_MANAGER_DATA_DIR": "./my-projects",
        "TASK_MANAGER_AGENT_ID": "dev-assistant"
      }
    }
  }
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TASK_MANAGER_DATA_DIR` | Directory for task data | `./tasks-data` |
| `TASK_MANAGER_AGENT_ID` | Default agent ID | `null` |
| `TASK_MANAGER_USE_CURRENT_DIR` | Use current directory | `false` |

## Available MCP Tools

### Project Management

#### `init_task_manager`
Initialize the task manager system.

**Parameters:**
- `dataDir` (string): Data directory path
- `useCurrentDir` (boolean): Use current directory
- `agentId` (string): Set current agent ID

#### `get_project_status`
Get comprehensive project status and metrics.

#### `export_project`
Export all project data in JSON format.

### Task Management

#### `create_task`
Create a new task.

**Parameters:**
- `title` (string, required): Task title
- `category` (string): Task category
- `priority` (string): critical|high|medium|low
- `description` (string): Task description
- `assignees` (array): Agent IDs to assign
- `dependencies` (array): Dependent task IDs
- `completion_criteria` (array): Completion criteria

#### `list_tasks`
List tasks with optional filters.

**Parameters:**
- `agent` (string): Filter by agent ID
- `status` (string): Filter by status
- `priority` (string): Filter by priority
- `phase` (string): Filter by phase

#### `update_task`
Update an existing task.

**Parameters:**
- `taskId` (string, required): Task ID to update
- `status` (string): New status
- `priority` (string): New priority
- `assignees` (array): New assignees

### Agent Management

#### `add_agent`
Add a new agent to the system.

**Parameters:**
- `name` (string, required): Agent name
- `id` (string): Agent ID (auto-generated if not provided)
- `type` (string): ai|human
- `capabilities` (array): Agent capabilities

#### `list_agents`
List all agents with their workloads.

#### `assign_agent`
Assign an agent to a task.

**Parameters:**
- `taskId` (string, required): Task ID
- `agentId` (string, required): Agent ID

#### `get_agent_workload`
Get detailed workload for a specific agent.

**Parameters:**
- `agentId` (string, required): Agent ID

### Recommendations & Workflow

#### `get_recommendations`
Get intelligent task recommendations for an agent.

**Parameters:**
- `agentId` (string, required): Agent ID
- `limit` (number): Max recommendations

#### `agent_check_in`
Perform agent check-in and get status.

**Parameters:**
- `agentId` (string): Agent ID to check in as

#### `start_task`
Start working on a task (agent-centric).

**Parameters:**
- `taskId` (string, required): Task ID
- `agentId` (string): Agent ID

#### `complete_task`
Complete a task (agent-centric).

**Parameters:**
- `taskId` (string, required): Task ID
- `agentId` (string): Agent ID

## Usage Examples

### Basic Project Setup

```
Initialize a new project:
→ init_task_manager with dataDir: "./my-project"

Add team members:
→ add_agent with name: "AI Developer", type: "ai", capabilities: ["coding", "testing"]
→ add_agent with name: "Project Manager", type: "human", capabilities: ["all"]

Create initial tasks:
→ create_task with title: "Setup project structure", priority: "high"
→ create_task with title: "Design database schema", priority: "critical"
```

### Agent Workflow

```
Check agent status:
→ agent_check_in with agentId: "ai-developer"

Get recommendations:
→ get_recommendations with agentId: "ai-developer", limit: 3

Start working:
→ start_task with taskId: "TASK-001", agentId: "ai-developer"

Complete work:
→ complete_task with taskId: "TASK-001", agentId: "ai-developer"
```

### Project Monitoring

```
Get project overview:
→ get_project_status

Check team workloads:
→ list_agents
→ get_agent_workload with agentId: "ai-developer"

Export project data:
→ export_project
```

## Troubleshooting

### Common Issues

1. **"Command not found" Error**
   - Ensure the path to `mcp-server.js` is correct
   - Verify Node.js is installed and in PATH

2. **"Permission denied" Error**
   - Make sure `mcp-server.js` is executable: `chmod +x mcp-server.js`

3. **"Agent not found" Error**
   - Initialize the task manager first with `init_task_manager`
   - Add agents before trying to use them

4. **"Directory not found" Error**
   - Check the `TASK_MANAGER_DATA_DIR` path exists
   - Use absolute paths for better reliability

### Debug Mode

Enable debug logging by setting environment variable:

```json
{
  "env": {
    "DEBUG": "mcp:*",
    "TASK_MANAGER_DATA_DIR": "./debug-data"
  }
}
```

### Log Files

Check these locations for logs:
- **Claude Desktop logs**: Available in the application
- **MCP Server logs**: Written to stderr
- **Task Manager logs**: In the data directory

## Advanced Configuration

### Multiple Projects

Configure multiple task manager instances:

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

### Custom Agent Types

Define specialized agents for your workflow:

```
→ add_agent with name: "Security Specialist", type: "ai", capabilities: ["security", "audit", "compliance"]
→ add_agent with name: "Performance Engineer", type: "ai", capabilities: ["optimization", "monitoring"]
→ add_agent with name: "QA Lead", type: "human", capabilities: ["testing", "quality-assurance"]
```

## Integration Examples

### Project Templates via MCP

```
1. Initialize: init_task_manager
2. Create agents: add_agent (multiple calls)
3. Create task structure: create_task (multiple calls)
4. Set dependencies: update_task with dependencies
5. Get initial recommendations: get_recommendations
```

### Automated Workflows

```
1. Check-in: agent_check_in
2. Get recommendations: get_recommendations  
3. Start highest priority: start_task
4. Work simulation: (external process)
5. Complete task: complete_task
6. Repeat cycle
```

## Support

For issues and questions:

1. **Check the logs** in Claude Desktop and MCP server output
2. **Verify configuration** matches the examples above
3. **Test with simple commands** like `get_project_status`
4. **Review the task manager CLI** for equivalent functionality
5. **Check GitHub issues** for known problems

## Next Steps

Once MCP is working:

1. **Explore agent workflows** with different agent types
2. **Try project templates** for complex setups
3. **Integrate with CI/CD** using the CLI commands
4. **Build custom dashboards** using the export functionality
5. **Automate routine tasks** with agent bots

---

The MCP integration brings the full power of the Multiagent Task Manager to AI assistants, enabling sophisticated project management workflows through natural language interaction.