#!/usr/bin/env node

/**
 * MCP Server for Multiagent Task Manager
 *
 * This server exposes the TaskManager functionality via the Model Context Protocol (MCP),
 * allowing AI assistants to manage tasks, agents, and workflows.
 */

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const {
  StdioServerTransport,
} = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");
const TaskManager = require("./task-manager.js");

class TaskManagerMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "multiagent-task-manager",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.taskManager = null;
    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "init_task_manager",
            description: "Initialize the task manager in a specified directory",
            inputSchema: {
              type: "object",
              properties: {
                dataDir: {
                  type: "string",
                  description:
                    "Directory to store task data (default: ./tasks-data)",
                },
                useCurrentDir: {
                  type: "boolean",
                  description:
                    "Use current directory instead of tasks-data subdirectory",
                },
                agentId: {
                  type: "string",
                  description: "Set the current agent ID",
                },
              },
            },
          },
          {
            name: "create_task",
            description: "Create a new task",
            inputSchema: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                  description: "Task title",
                },
                category: {
                  type: "string",
                  description: "Task category (coding, design, testing, etc.)",
                },
                priority: {
                  type: "string",
                  enum: ["critical", "high", "medium", "low"],
                  description: "Task priority",
                },
                description: {
                  type: "string",
                  description: "Task description",
                },
                assignees: {
                  type: "array",
                  items: { type: "string" },
                  description: "Array of agent IDs to assign to this task",
                },
                dependencies: {
                  type: "array",
                  items: { type: "string" },
                  description: "Array of task IDs this task depends on",
                },
                completion_criteria: {
                  type: "array",
                  items: { type: "string" },
                  description: "Array of completion criteria",
                },
              },
              required: ["title"],
            },
          },
          {
            name: "list_tasks",
            description: "List tasks with optional filters",
            inputSchema: {
              type: "object",
              properties: {
                agent: {
                  type: "string",
                  description: "Filter by agent ID",
                },
                status: {
                  type: "string",
                  enum: ["todo", "in-progress", "completed", "blocked"],
                  description: "Filter by task status",
                },
                priority: {
                  type: "string",
                  enum: ["critical", "high", "medium", "low"],
                  description: "Filter by priority",
                },
                phase: {
                  type: "string",
                  description: "Filter by phase",
                },
              },
            },
          },
          {
            name: "update_task",
            description: "Update an existing task",
            inputSchema: {
              type: "object",
              properties: {
                taskId: {
                  type: "string",
                  description: "Task ID to update",
                },
                status: {
                  type: "string",
                  enum: ["todo", "in-progress", "completed", "blocked"],
                  description: "New task status",
                },
                priority: {
                  type: "string",
                  enum: ["critical", "high", "medium", "low"],
                  description: "New task priority",
                },
                assignees: {
                  type: "array",
                  items: { type: "string" },
                  description: "New assignees",
                },
              },
              required: ["taskId"],
            },
          },
          {
            name: "assign_agent",
            description: "Assign an agent to a task",
            inputSchema: {
              type: "object",
              properties: {
                taskId: {
                  type: "string",
                  description: "Task ID",
                },
                agentId: {
                  type: "string",
                  description: "Agent ID to assign",
                },
              },
              required: ["taskId", "agentId"],
            },
          },
          {
            name: "add_agent",
            description: "Add a new agent to the system",
            inputSchema: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  description: "Agent ID (auto-generated if not provided)",
                },
                name: {
                  type: "string",
                  description: "Agent name",
                },
                type: {
                  type: "string",
                  enum: ["ai", "human"],
                  description: "Agent type",
                },
                capabilities: {
                  type: "array",
                  items: { type: "string" },
                  description: "Agent capabilities",
                },
              },
              required: ["name"],
            },
          },
          {
            name: "list_agents",
            description: "List all agents",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "get_recommendations",
            description: "Get task recommendations for an agent",
            inputSchema: {
              type: "object",
              properties: {
                agentId: {
                  type: "string",
                  description: "Agent ID to get recommendations for",
                },
                limit: {
                  type: "number",
                  description: "Maximum number of recommendations",
                },
              },
              required: ["agentId"],
            },
          },
          {
            name: "get_project_status",
            description: "Get overall project status and metrics",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "get_agent_workload",
            description: "Get workload information for a specific agent",
            inputSchema: {
              type: "object",
              properties: {
                agentId: {
                  type: "string",
                  description: "Agent ID",
                },
              },
              required: ["agentId"],
            },
          },
          {
            name: "agent_check_in",
            description:
              "Perform agent check-in (requires current agent to be set)",
            inputSchema: {
              type: "object",
              properties: {
                agentId: {
                  type: "string",
                  description: "Agent ID to check in as",
                },
              },
            },
          },
          {
            name: "start_task",
            description: "Start working on a task (agent-centric)",
            inputSchema: {
              type: "object",
              properties: {
                taskId: {
                  type: "string",
                  description: "Task ID to start",
                },
                agentId: {
                  type: "string",
                  description: "Agent ID (or use current agent)",
                },
              },
              required: ["taskId"],
            },
          },
          {
            name: "complete_task",
            description: "Complete a task (agent-centric)",
            inputSchema: {
              type: "object",
              properties: {
                taskId: {
                  type: "string",
                  description: "Task ID to complete",
                },
                agentId: {
                  type: "string",
                  description: "Agent ID (or use current agent)",
                },
              },
              required: ["taskId"],
            },
          },
          {
            name: "export_project",
            description: "Export project data",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "init_task_manager":
            return await this.handleInitTaskManager(args);
          case "create_task":
            return await this.handleCreateTask(args);
          case "list_tasks":
            return await this.handleListTasks(args);
          case "update_task":
            return await this.handleUpdateTask(args);
          case "assign_agent":
            return await this.handleAssignAgent(args);
          case "add_agent":
            return await this.handleAddAgent(args);
          case "list_agents":
            return await this.handleListAgents(args);
          case "get_recommendations":
            return await this.handleGetRecommendations(args);
          case "get_project_status":
            return await this.handleGetProjectStatus(args);
          case "get_agent_workload":
            return await this.handleGetAgentWorkload(args);
          case "agent_check_in":
            return await this.handleAgentCheckIn(args);
          case "start_task":
            return await this.handleStartTask(args);
          case "complete_task":
            return await this.handleCompleteTask(args);
          case "export_project":
            return await this.handleExportProject(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  ensureTaskManager(options = {}) {
    if (!this.taskManager) {
      this.taskManager = new TaskManager(options);
    }
  }

  async handleInitTaskManager(args) {
    const { dataDir, useCurrentDir, agentId } = args;

    const options = {};
    if (dataDir) options.dataDir = dataDir;
    if (agentId) options.agentId = agentId;
    if (useCurrentDir) options.useCurrentDir = useCurrentDir;

    this.taskManager = new TaskManager(options);
    const results = this.taskManager.smartInit({ useCurrentDir, dataDir });

    return {
      content: [
        {
          type: "text",
          text: `✅ Task Manager initialized successfully!\n\nInitialization Summary:\n${
            results.created.length > 0
              ? `Created: ${results.created.join(", ")}\n`
              : ""
          }${
            results.existed.length > 0
              ? `Already existed: ${results.existed.join(", ")}\n`
              : ""
          }${
            results.updated.length > 0
              ? `Updated: ${results.updated.join(", ")}\n`
              : ""
          }\nData directory: ${this.taskManager.dataDir}`,
        },
      ],
    };
  }

  async handleCreateTask(args) {
    this.ensureTaskManager();

    const task = this.taskManager.createTask(args);

    return {
      content: [
        {
          type: "text",
          text: `✅ Task created successfully!\n\nTask ID: ${task.id}\nTitle: ${task.title}\nPriority: ${task.priority}\nStatus: ${task.status}\nAssignees: ${task.assignees.map((a) => a.name).join(", ") || "None"}`,
        },
      ],
    };
  }

  async handleListTasks(args) {
    this.ensureTaskManager();

    const tasks = this.taskManager.listTasks(args);

    if (tasks.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No tasks found matching the criteria.",
          },
        ],
      };
    }

    const taskList = tasks
      .map((task) => {
        const priority =
          task.priority === "critical"
            ? "🔴"
            : task.priority === "high"
              ? "🟠"
              : task.priority === "medium"
                ? "🟡"
                : "🟢";
        const assignees = task.assignees
          ? task.assignees.map((a) => a.name).join(", ")
          : "Unassigned";

        return `${priority} ${task.id}: ${task.title} [${task.status}] - ${assignees}`;
      })
      .join("\n");

    const filterDesc =
      Object.keys(args).length > 0
        ? ` (filtered by: ${Object.entries(args)
            .map(([k, v]) => `${k}=${v}`)
            .join(", ")})`
        : "";

    return {
      content: [
        {
          type: "text",
          text: `📋 Tasks${filterDesc}:\n\n${taskList}`,
        },
      ],
    };
  }

  async handleUpdateTask(args) {
    this.ensureTaskManager();

    const { taskId, ...updates } = args;
    const task = this.taskManager.updateTask(taskId, updates);

    return {
      content: [
        {
          type: "text",
          text: `✅ Task ${taskId} updated successfully!\n\nTitle: ${task.title}\nStatus: ${task.status}\nPriority: ${task.priority}`,
        },
      ],
    };
  }

  async handleAssignAgent(args) {
    this.ensureTaskManager();

    const { taskId, agentId } = args;
    const task = this.taskManager.assignAgentToTask(taskId, { id: agentId });

    return {
      content: [
        {
          type: "text",
          text: `✅ Agent ${agentId} assigned to task ${taskId}!\n\nTask: ${task.title}\nAssignees: ${task.assignees.map((a) => a.name).join(", ")}`,
        },
      ],
    };
  }

  async handleAddAgent(args) {
    this.ensureTaskManager();

    const agent = this.taskManager.addAgent(args);

    return {
      content: [
        {
          type: "text",
          text: `✅ Agent added successfully!\n\nID: ${agent.id}\nName: ${agent.name}\nType: ${agent.type}\nCapabilities: ${agent.capabilities.join(", ") || "None specified"}`,
        },
      ],
    };
  }

  async handleListAgents(args) {
    this.ensureTaskManager();

    const agents = this.taskManager.listAgents();

    if (agents.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No agents found.",
          },
        ],
      };
    }

    const agentList = agents
      .map((agent) => {
        const icon = agent.type === "ai" ? "🤖" : "👤";
        const status = agent.status === "active" ? "✅" : "⏸️";

        return `${status} ${icon} ${agent.name} (${agent.id})\n   Type: ${agent.type}, Active: ${agent.workload.active_tasks}, Completed: ${agent.workload.completed_tasks}${
          agent.capabilities && agent.capabilities.length > 0
            ? `\n   Capabilities: ${agent.capabilities.join(", ")}`
            : ""
        }`;
      })
      .join("\n\n");

    return {
      content: [
        {
          type: "text",
          text: `👥 Agents:\n\n${agentList}`,
        },
      ],
    };
  }

  async handleGetRecommendations(args) {
    this.ensureTaskManager();

    const { agentId, limit } = args;
    const recommendations = this.taskManager.getRecommendationsForAgent(
      agentId,
      limit,
    );

    if (recommendations.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No recommendations available for agent ${agentId}.`,
          },
        ],
      };
    }

    const recList = recommendations
      .map((task, index) => {
        const priority =
          task.priority === "critical"
            ? "🔴"
            : task.priority === "high"
              ? "🟠"
              : task.priority === "medium"
                ? "🟡"
                : "🟢";

        return `${index + 1}. ${priority} ${task.id}: ${task.title} (Score: ${task.recommendation_score})\n   ${task.recommendation_reason}`;
      })
      .join("\n\n");

    return {
      content: [
        {
          type: "text",
          text: `🎯 Recommendations for ${agentId}:\n\n${recList}`,
        },
      ],
    };
  }

  async handleGetProjectStatus(args) {
    this.ensureTaskManager();

    const status = this.taskManager.getProjectStatus();

    return {
      content: [
        {
          type: "text",
          text: `📊 Project Status:

Progress: ${status.progress.completion_percentage}% (${status.progress.completed}/${status.progress.total_tasks} tasks)
Agents: ${status.agents.total} (${status.agents.by_type.human} human, ${status.agents.by_type.ai} AI)
Tasks: ${status.tasks.by_status.in_progress} active, ${status.tasks.by_status.todo} todo, ${status.tasks.by_status.completed} completed

Priority Breakdown:
• Critical: ${status.tasks.by_priority.critical} tasks
• High: ${status.tasks.by_priority.high} tasks
• Medium: ${status.tasks.by_priority.medium} tasks
• Low: ${status.tasks.by_priority.low} tasks`,
        },
      ],
    };
  }

  async handleGetAgentWorkload(args) {
    this.ensureTaskManager();

    const { agentId } = args;
    const workload = this.taskManager.getAgentWorkload(agentId);

    const activeTasks =
      workload.tasks.active.length > 0
        ? "\n\nActive Tasks:\n" +
          workload.tasks.active
            .map((task) => {
              const priority =
                task.priority === "critical"
                  ? "🔴"
                  : task.priority === "high"
                    ? "🟠"
                    : task.priority === "medium"
                      ? "🟡"
                      : "🟢";
              return `• ${priority} ${task.id}: ${task.title} [${task.status}]`;
            })
            .join("\n")
        : "";

    return {
      content: [
        {
          type: "text",
          text: `📊 Workload for ${workload.agent.name}:

Active tasks: ${workload.workload.active_tasks}
Completed tasks: ${workload.workload.completed_tasks}
Total score: ${workload.workload.total_score}${activeTasks}`,
        },
      ],
    };
  }

  async handleAgentCheckIn(args) {
    this.ensureTaskManager();

    const { agentId } = args;
    if (agentId) {
      this.taskManager.setCurrentAgent(agentId);
    }

    const checkIn = this.taskManager.checkIn();
    const agent = checkIn.agent;
    const icon = agent.type === "ai" ? "🤖" : "👤";

    const recommendations =
      checkIn.recommendations.length > 0
        ? "\n\nTop Recommendations:\n" +
          checkIn.recommendations
            .slice(0, 2)
            .map((task, index) => {
              const priority =
                task.priority === "critical"
                  ? "🔴"
                  : task.priority === "high"
                    ? "🟠"
                    : task.priority === "medium"
                      ? "🟡"
                      : "🟢";
              return `${index + 1}. ${priority} ${task.id}: ${task.title}`;
            })
            .join("\n")
        : "";

    return {
      content: [
        {
          type: "text",
          text: `${icon} Check-in for ${agent.name} (${agent.id})

Status: ${agent.status}
Active tasks: ${checkIn.status.active_tasks}
Todo tasks: ${checkIn.status.todo_tasks}
Pending recommendations: ${checkIn.status.pending_recommendations}${recommendations}`,
        },
      ],
    };
  }

  async handleStartTask(args) {
    this.ensureTaskManager();

    const { taskId, agentId } = args;
    if (agentId) {
      this.taskManager.setCurrentAgent(agentId);
    }

    const task = this.taskManager.startTask(taskId);

    return {
      content: [
        {
          type: "text",
          text: `⚡ Started working on: ${task.title}\n\nTask ID: ${task.id}\nStatus: ${task.status}`,
        },
      ],
    };
  }

  async handleCompleteTask(args) {
    this.ensureTaskManager();

    const { taskId, agentId } = args;
    if (agentId) {
      this.taskManager.setCurrentAgent(agentId);
    }

    const task = this.taskManager.completeTask(taskId);

    return {
      content: [
        {
          type: "text",
          text: `✅ Completed: ${task.title}\n\nTask ID: ${task.id}\nStatus: ${task.status}\nCompleted: ${task.completed}`,
        },
      ],
    };
  }

  async handleExportProject(args) {
    this.ensureTaskManager();

    const exportData = {
      project: this.taskManager.taskTracker.project,
      agents: this.taskManager.agents,
      tasks: this.taskManager.taskTracker.tasks,
      progress: this.taskManager.taskTracker.progress,
      exported: new Date().toISOString(),
    };

    return {
      content: [
        {
          type: "text",
          text: `📤 Project Export Data:\n\n\`\`\`json\n${JSON.stringify(exportData, null, 2)}\n\`\`\``,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Multiagent Task Manager MCP Server running on stdio");
  }
}

// Run the server
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
🤖 Multiagent Task Manager MCP Server

This is an MCP (Model Context Protocol) server that exposes the
Multiagent Task Manager functionality to AI assistants like Claude.

Usage:
  npx multiagent-task-manager-mcp              # Run MCP server
  npx multiagent-task-manager-mcp --version    # Show version
  npx multiagent-task-manager-mcp --help       # Show this help

Configuration:
Add to your Claude Desktop config:

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

Available Tools:
- init_task_manager: Initialize task manager
- create_task: Create new tasks
- list_tasks: List and filter tasks
- add_agent: Add team members
- get_recommendations: Get AI recommendations
- get_project_status: View project status
- And many more...

For full documentation, see: MCP-SETUP.md
`);
    process.exit(0);
  }

  if (args.includes("--version") || args.includes("-v")) {
    const packageJson = require("./package.json");
    console.log(`multiagent-task-manager-mcp v${packageJson.version}`);
    process.exit(0);
  }

  const server = new TaskManagerMCPServer();
  server.run().catch(console.error);
}

module.exports = TaskManagerMCPServer;
