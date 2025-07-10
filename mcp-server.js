#!/usr/bin/env node

/**
 * MCP Server for Multiagent Task Manager
 *
 * This server exposes the TaskManager functionality via the Model Context Protocol (MCP),
 * allowing AI assistants to manage tasks, agents, and workflows.
 */

// MCP SDK imports will be loaded dynamically
let Server, StdioServerTransport, CallToolRequestSchema, ListToolsRequestSchema;
const TaskManager = require("./task-manager.js");
const {
  findProjectRoot,
  resolveTaskManagerDirectory,
  createTaskManagerStructure,
  migrateLegacyData,
  getDirectoryInfo,
} = require("./src/utils/directory-utils.js");

class TaskManagerMCPServer {
  constructor() {
    this.server = null;
    this.taskManager = null;
  }

  async initialize() {
    // Dynamically import MCP SDK modules
    const { Server } = await import(
      "@modelcontextprotocol/sdk/server/index.js"
    );
    const { StdioServerTransport } = await import(
      "@modelcontextprotocol/sdk/server/stdio.js"
    );
    const { CallToolRequestSchema, ListToolsRequestSchema } = await import(
      "@modelcontextprotocol/sdk/types.js"
    );

    // Store for later use
    global.Server = Server;
    global.StdioServerTransport = StdioServerTransport;
    global.CallToolRequestSchema = CallToolRequestSchema;
    global.ListToolsRequestSchema = ListToolsRequestSchema;

    this.server = new Server(
      {
        name: "multiagent-task-manager",
        version: "1.2.11",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupToolHandlers();
  }

  // Enhanced directory resolution using new utilities
  resolveDirectory(options = {}) {
    console.log(
      `[MCP Server] Resolving directory with options:`,
      JSON.stringify(options, null, 2),
    );

    // Try to find project root first
    const projectRoot = findProjectRoot();
    console.log(`[MCP Server] Project root: ${projectRoot || "Not found"}`);

    // Use the new directory resolution utility
    const resolution = resolveTaskManagerDirectory({
      dataDir: options.dataDir,
      useCurrentDir: options.useCurrentDir,
      projectRoot: projectRoot,
    });

    console.log(
      `[MCP Server] Directory resolution result:`,
      JSON.stringify(resolution, null, 2),
    );

    return {
      directory: resolution.directory,
      projectRoot: projectRoot,
      resolution: resolution,
    };
  }

  // Legacy method for backward compatibility
  isDirectorySafe(dirPath) {
    const { isDirectorySafe } = require("./src/utils/directory-utils.js");
    return isDirectorySafe(dirPath);
  }

  // Legacy method for backward compatibility
  findSafeDirectory(preferredDir = null) {
    const { findSafeDirectory } = require("./src/utils/directory-utils.js");
    return findSafeDirectory(preferredDir);
  }

  ensureTaskManager(options = {}) {
    if (!this.taskManager) {
      try {
        console.log(
          `[MCP Server] Ensuring TaskManager with options:`,
          JSON.stringify(options, null, 2),
        );

        // Use enhanced directory resolution
        const { directory, projectRoot, resolution } =
          this.resolveDirectory(options);

        // Ensure directory structure exists
        const structureResult = createTaskManagerStructure(directory);
        if (!structureResult.success) {
          console.warn(
            `[MCP Server] Directory structure creation had issues:`,
            structureResult.errors,
          );
        }

        // Migrate legacy data if project root found
        if (projectRoot && projectRoot !== directory) {
          const migrationResult = migrateLegacyData(projectRoot, directory);
          if (migrationResult.migrated.length > 0) {
            console.log(
              `[MCP Server] Migrated legacy data:`,
              migrationResult.migrated,
            );
          }
        }

        // Create TaskManager with resolved directory
        const taskManagerOptions = {
          ...options,
          dataDir: directory,
          useCurrentDir: false, // Always use resolved directory
        };

        console.log(
          `[MCP Server] Creating TaskManager with options:`,
          JSON.stringify(taskManagerOptions, null, 2),
        );
        this.taskManager = new TaskManager(taskManagerOptions);
        console.log(
          `[MCP Server] TaskManager initialized successfully with dataDir: ${this.taskManager.dataDir}`,
        );
      } catch (error) {
        console.error(
          `[MCP Server] Error in ensureTaskManager: ${error.message}`,
        );
        console.error(`[MCP Server] Stack trace: ${error.stack}`);

        // Emergency fallback
        const emergencyDir = "./emergency-tasks-data";
        console.log(`[MCP Server] Using emergency fallback: ${emergencyDir}`);

        const emergencyOptions = {
          dataDir: emergencyDir,
          useCurrentDir: false,
        };

        this.taskManager = new TaskManager(emergencyOptions);
        console.log(
          `[MCP Server] Emergency TaskManager initialized with dataDir: ${this.taskManager.dataDir}`,
        );
      }
    }
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(global.ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "init_task_manager",
            description:
              "Initialize the task manager in a directory (defaults to current directory)",
            inputSchema: {
              type: "object",
              properties: {
                dataDir: {
                  type: "string",
                  description:
                    "Directory to store task data (optional, overrides useCurrentDir)",
                },
                useCurrentDir: {
                  type: "boolean",
                  description:
                    "Use current directory for task data (default: true)",
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
          {
            name: "remove_agent",
            description: "Remove an agent from the system",
            inputSchema: {
              type: "object",
              properties: {
                agentId: {
                  type: "string",
                  description: "Agent ID to remove",
                },
              },
              required: ["agentId"],
            },
          },
          {
            name: "delete_task",
            description: "Delete a task",
            inputSchema: {
              type: "object",
              properties: {
                taskId: {
                  type: "string",
                  description: "Task ID to delete",
                },
              },
              required: ["taskId"],
            },
          },
          {
            name: "get_task",
            description: "Get details of a specific task",
            inputSchema: {
              type: "object",
              properties: {
                taskId: {
                  type: "string",
                  description: "Task ID",
                },
              },
              required: ["taskId"],
            },
          },
          {
            name: "unassign_agent",
            description: "Remove an agent assignment from a task",
            inputSchema: {
              type: "object",
              properties: {
                taskId: {
                  type: "string",
                  description: "Task ID",
                },
                agentId: {
                  type: "string",
                  description: "Agent ID to unassign",
                },
              },
              required: ["taskId", "agentId"],
            },
          },
          {
            name: "get_my_tasks",
            description: "Get tasks for the current agent",
            inputSchema: {
              type: "object",
              properties: {
                agentId: {
                  type: "string",
                  description: "Agent ID (or use current agent)",
                },
                status: {
                  type: "string",
                  enum: ["todo", "in-progress", "completed", "blocked"],
                  description: "Filter by status",
                },
              },
            },
          },
          {
            name: "get_my_notifications",
            description: "Get notifications for the current agent",
            inputSchema: {
              type: "object",
              properties: {
                agentId: {
                  type: "string",
                  description: "Agent ID (or use current agent)",
                },
              },
            },
          },
          {
            name: "clear_my_notifications",
            description: "Clear notifications for the current agent",
            inputSchema: {
              type: "object",
              properties: {
                agentId: {
                  type: "string",
                  description: "Agent ID (or use current agent)",
                },
              },
            },
          },
          {
            name: "transfer_task",
            description: "Transfer a task from one agent to another",
            inputSchema: {
              type: "object",
              properties: {
                taskId: {
                  type: "string",
                  description: "Task ID to transfer",
                },
                fromAgentId: {
                  type: "string",
                  description: "Current agent ID",
                },
                toAgentId: {
                  type: "string",
                  description: "Target agent ID",
                },
              },
              required: ["taskId", "fromAgentId", "toAgentId"],
            },
          },
          {
            name: "set_current_agent",
            description: "Set the current agent ID for the session",
            inputSchema: {
              type: "object",
              properties: {
                agentId: {
                  type: "string",
                  description: "Agent ID to set as current",
                },
              },
              required: ["agentId"],
            },
          },
          {
            name: "get_current_agent",
            description: "Get the current agent information",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(
      global.CallToolRequestSchema,
      async (request) => {
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
            case "remove_agent":
              return await this.handleRemoveAgent(args);
            case "delete_task":
              return await this.handleDeleteTask(args);
            case "get_task":
              return await this.handleGetTask(args);
            case "unassign_agent":
              return await this.handleUnassignAgent(args);
            case "get_my_tasks":
              return await this.handleGetMyTasks(args);
            case "get_my_notifications":
              return await this.handleGetMyNotifications(args);
            case "clear_my_notifications":
              return await this.handleClearMyNotifications(args);
            case "transfer_task":
              return await this.handleTransferTask(args);
            case "set_current_agent":
              return await this.handleSetCurrentAgent(args);
            case "get_current_agent":
              return await this.handleGetCurrentAgent(args);
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
      },
    );
  }

  ensureTaskManager(options = {}) {
    if (!this.taskManager) {
      try {
        // Enhanced logging for debugging directory issues
        const cwd = process.cwd();
        const homeDir = process.env.HOME;
        const taskManagerDataDir = process.env.TASK_MANAGER_DATA_DIR;

        console.log(`[MCP Server] Directory Detection Debug:`);
        console.log(`  Current Working Directory: ${cwd}`);
        console.log(`  HOME environment variable: ${homeDir}`);
        console.log(`  TASK_MANAGER_DATA_DIR: ${taskManagerDataDir}`);
        console.log(`  Options passed: ${JSON.stringify(options, null, 2)}`);

        // Default to current directory for MCP server usage, with safety checks
        const defaultOptions = { useCurrentDir: true, ...options };

        // Enhanced safety check for problematic directories
        const isSystemDirectory =
          cwd === "/" ||
          !cwd ||
          cwd.startsWith("/usr/") ||
          cwd.startsWith("/opt/") ||
          cwd.startsWith("/var/") ||
          cwd.startsWith("/tmp/") ||
          cwd.startsWith("/etc/") ||
          cwd.startsWith("/bin/") ||
          cwd.startsWith("/sbin/") ||
          cwd.includes("node_modules") ||
          cwd.includes("/.npm/") ||
          cwd.includes("/.cache/");

        if (isSystemDirectory) {
          console.log(
            `[MCP Server] WARNING: Detected unsafe directory: ${cwd}`,
          );
          console.log(`[MCP Server] Falling back to safe directory...`);

          // Priority order for fallback directories
          let fallbackDir;
          if (taskManagerDataDir) {
            fallbackDir = taskManagerDataDir;
            console.log(
              `[MCP Server] Using TASK_MANAGER_DATA_DIR: ${fallbackDir}`,
            );
          } else if (homeDir) {
            fallbackDir = `${homeDir}/TaskManager`;
            console.log(`[MCP Server] Using HOME directory: ${fallbackDir}`);
          } else {
            fallbackDir = "./tasks-data";
            console.log(`[MCP Server] Using relative fallback: ${fallbackDir}`);
          }

          defaultOptions.dataDir = fallbackDir;
          defaultOptions.useCurrentDir = false;
        } else {
          console.log(`[MCP Server] Using current directory: ${cwd}`);
        }

        console.log(
          `[MCP Server] Final options: ${JSON.stringify(defaultOptions, null, 2)}`,
        );
        this.taskManager = new TaskManager(defaultOptions);
        console.log(
          `[MCP Server] TaskManager initialized with dataDir: ${this.taskManager.dataDir}`,
        );
      } catch (error) {
        console.error(
          `[MCP Server] Error in ensureTaskManager: ${error.message}`,
        );
        console.error(`[MCP Server] Stack trace: ${error.stack}`);

        // Enhanced fallback to a safe directory
        const fallbackOptions = {
          dataDir:
            process.env.TASK_MANAGER_DATA_DIR ||
            (process.env.HOME
              ? `${process.env.HOME}/TaskManager`
              : "./tasks-data"),
          useCurrentDir: false,
        };

        console.log(
          `[MCP Server] Using fallback options: ${JSON.stringify(fallbackOptions, null, 2)}`,
        );
        this.taskManager = new TaskManager(fallbackOptions);
        console.log(
          `[MCP Server] Fallback TaskManager initialized with dataDir: ${this.taskManager.dataDir}`,
        );
      }
    }
  }

  async handleInitTaskManager(args) {
    const { dataDir, useCurrentDir, agentId } = args;

    try {
      console.log(
        `[MCP Server] handleInitTaskManager called with args: ${JSON.stringify(args, null, 2)}`,
      );

      const cwd = process.cwd();
      const homeDir = process.env.HOME;
      const taskManagerDataDir = process.env.TASK_MANAGER_DATA_DIR;

      console.log(`[MCP Server] Init Environment Debug:`);
      console.log(`  Current Working Directory: ${cwd}`);
      console.log(`  HOME: ${homeDir}`);
      console.log(`  TASK_MANAGER_DATA_DIR: ${taskManagerDataDir}`);

      const options = {};
      if (agentId) {
        options.agentId = agentId;
        console.log(`[MCP Server] Setting agentId: ${agentId}`);
      }

      // Use enhanced directory resolution
      const { directory, projectRoot, resolution } = this.resolveDirectory({
        dataDir: dataDir,
        useCurrentDir: useCurrentDir,
      });

      console.log(`[MCP Server] Directory resolution completed:`);
      console.log(`  Resolved directory: ${directory}`);
      console.log(`  Project root: ${projectRoot || "Not found"}`);
      console.log(`  Strategy used: ${resolution.strategy}`);
      console.log(`  Fallback used: ${resolution.fallbackUsed}`);
      console.log(`  Directory safe: ${resolution.safe}`);

      options.dataDir = directory;
      options.useCurrentDir = false; // Always use resolved directory

      console.log(
        `[MCP Server] Final TaskManager options: ${JSON.stringify(options, null, 2)}`,
      );

      // Ensure directory structure exists before creating TaskManager
      const structureResult = createTaskManagerStructure(directory);
      if (!structureResult.success) {
        console.warn(
          `[MCP Server] Directory structure creation issues:`,
          structureResult.errors,
        );
      } else {
        console.log(
          `[MCP Server] Directory structure ensured:`,
          structureResult.created,
        );
      }

      // Migrate legacy data if needed
      if (projectRoot && projectRoot !== directory) {
        const migrationResult = migrateLegacyData(projectRoot, directory);
        if (migrationResult.migrated.length > 0) {
          console.log(
            `[MCP Server] Legacy data migrated:`,
            migrationResult.migrated,
          );
        }
      }

      // Create new TaskManager instance with enhanced error handling
      try {
        this.taskManager = new TaskManager(options);
        console.log(`[MCP Server] TaskManager created successfully`);
        console.log(`  Final dataDir: ${this.taskManager.dataDir}`);
        console.log(`  Project root: ${projectRoot || "Not detected"}`);
        console.log(`  Resolution strategy: ${resolution.strategy}`);
      } catch (tmError) {
        console.error(
          `[MCP Server] TaskManager creation failed: ${tmError.message}`,
        );
        console.error(`[MCP Server] Attempting emergency recovery...`);

        // Emergency fallback
        const emergencyDir = "./emergency-tasks-data";
        const emergencyOptions = {
          dataDir: emergencyDir,
          useCurrentDir: false,
          agentId: options.agentId,
        };
        console.log(
          `[MCP Server] Emergency options: ${JSON.stringify(emergencyOptions, null, 2)}`,
        );
        this.taskManager = new TaskManager(emergencyOptions);
        console.log(
          `[MCP Server] Emergency TaskManager created with dataDir: ${this.taskManager.dataDir}`,
        );
      }

      const initOptions = { useCurrentDir: options.useCurrentDir };
      if (options.dataDir && !options.useCurrentDir) {
        initOptions.dataDir = options.dataDir;
      }

      console.log(
        `[MCP Server] Calling smartInit with options: ${JSON.stringify(initOptions, null, 2)}`,
      );
      const results = this.taskManager.smartInit(initOptions);
      console.log(`[MCP Server] smartInit completed successfully`);
      console.log(`[MCP Server] Results: ${JSON.stringify(results, null, 2)}`);

      const successMessage = `✅ Task Manager initialized successfully!

🏠 Directory Information:
- Data directory: ${this.taskManager.dataDir}
- Current working directory: ${cwd}
- Project root: ${projectRoot || "Not detected"}
- Resolution strategy: ${resolution.strategy}
- Directory safety validated: ✅
- Fallback used: ${resolution.fallbackUsed ? "Yes" : "No"}

📋 Initialization Summary:
${results.created.length > 0 ? `✨ Created: ${results.created.join(", ")}\n` : ""}${results.existed.length > 0 ? `📁 Already existed: ${results.existed.join(", ")}\n` : ""}${results.updated.length > 0 ? `🔄 Updated: ${results.updated.join(", ")}\n` : ""}
👤 Agent ID: ${this.taskManager.currentAgentId || "Not set"}

🎯 Ready to manage tasks with enhanced directory handling!`;

      console.log(`[MCP Server] Returning success response`);

      return {
        content: [
          {
            type: "text",
            text: successMessage,
          },
        ],
      };
    } catch (error) {
      console.error(
        `[MCP Server] handleInitTaskManager fatal error: ${error.message}`,
      );
      console.error(`[MCP Server] Error stack: ${error.stack}`);

      const errorMessage = `❌ Failed to initialize Task Manager: ${error.message}

🔍 Debug Information:
- Current directory: ${process.cwd()}
- HOME directory: ${process.env.HOME || "Not set"}
- TASK_MANAGER_DATA_DIR: ${process.env.TASK_MANAGER_DATA_DIR || "Not set"}
- Project root detection: ${findProjectRoot() || "Failed"}
- Args provided: ${JSON.stringify(args, null, 2)}

💡 Troubleshooting Steps:
1. Set TASK_MANAGER_DATA_DIR environment variable to a writable directory
   Example: export TASK_MANAGER_DATA_DIR="$HOME/TaskManager"

2. Ensure you're running from a user directory (not system directories like /, /usr/, etc.)

3. Provide a custom dataDir in the initialization call:
   Example: {"dataDir": "$HOME/MyTaskManager"}

4. Check directory permissions for write access

5. Run from a project directory with package.json or .git

🔧 Enhanced Solutions:
- For macOS: export TASK_MANAGER_DATA_DIR="$HOME/TaskManager"
- For Linux: export TASK_MANAGER_DATA_DIR="$HOME/taskmanager"
- For Windows: set TASK_MANAGER_DATA_DIR=%USERPROFILE%\\TaskManager
- Project-based: Run from directory with package.json or .git for automatic detection

🆕 New Features:
- Automatic project root detection
- Smart directory structure migration
- Enhanced safety validation`;

      return {
        content: [
          {
            type: "text",
            text: errorMessage,
          },
        ],
        isError: true,
      };
    }
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

  async handleRemoveAgent(args) {
    this.ensureTaskManager();
    const { agentId } = args;

    try {
      this.taskManager.removeAgent(agentId);
      return {
        content: [
          {
            type: "text",
            text: `✅ Agent ${agentId} removed successfully`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to remove agent: ${error.message}`);
    }
  }

  async handleDeleteTask(args) {
    this.ensureTaskManager();
    const { taskId } = args;

    try {
      this.taskManager.deleteTask(taskId);
      return {
        content: [
          {
            type: "text",
            text: `✅ Task ${taskId} deleted successfully`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to delete task: ${error.message}`);
    }
  }

  async handleGetTask(args) {
    this.ensureTaskManager();
    const { taskId } = args;

    try {
      const task = this.taskManager.getTask(taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(task, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get task: ${error.message}`);
    }
  }

  async handleUnassignAgent(args) {
    this.ensureTaskManager();
    const { taskId, agentId } = args;

    try {
      this.taskManager.unassignAgentFromTask(taskId, agentId);
      return {
        content: [
          {
            type: "text",
            text: `✅ Agent ${agentId} unassigned from task ${taskId}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to unassign agent: ${error.message}`);
    }
  }

  async handleGetMyTasks(args) {
    this.ensureTaskManager();
    const { agentId, status } = args;

    try {
      // Set agent if provided
      if (agentId) {
        this.taskManager.setCurrentAgent(agentId);
      }

      let tasks;
      if (status === "todo") {
        tasks = this.taskManager.getMyTodoTasks();
      } else if (status === "in-progress") {
        tasks = this.taskManager.getMyActiveTasks();
      } else {
        tasks = this.taskManager.getMyTasks();
        if (status) {
          tasks = tasks.filter((task) => task.status === status);
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(tasks, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get my tasks: ${error.message}`);
    }
  }

  async handleGetMyNotifications(args) {
    this.ensureTaskManager();
    const { agentId } = args;

    try {
      if (agentId) {
        this.taskManager.setCurrentAgent(agentId);
      }

      const notifications = this.taskManager.getMyNotifications();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(notifications, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get notifications: ${error.message}`);
    }
  }

  async handleClearMyNotifications(args) {
    this.ensureTaskManager();
    const { agentId } = args;

    try {
      if (agentId) {
        this.taskManager.setCurrentAgent(agentId);
      }

      this.taskManager.clearMyNotifications();
      return {
        content: [
          {
            type: "text",
            text: "✅ Notifications cleared successfully",
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to clear notifications: ${error.message}`);
    }
  }

  async handleTransferTask(args) {
    this.ensureTaskManager();
    const { taskId, fromAgentId, toAgentId } = args;

    try {
      // Unassign from source agent
      this.taskManager.unassignAgentFromTask(taskId, fromAgentId);
      // Assign to target agent
      this.taskManager.assignAgentToTask(taskId, toAgentId);

      return {
        content: [
          {
            type: "text",
            text: `✅ Task ${taskId} transferred from ${fromAgentId} to ${toAgentId}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to transfer task: ${error.message}`);
    }
  }

  async handleSetCurrentAgent(args) {
    this.ensureTaskManager();
    const { agentId } = args;

    try {
      this.taskManager.setCurrentAgent(agentId);
      return {
        content: [
          {
            type: "text",
            text: `✅ Current agent set to ${agentId}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to set current agent: ${error.message}`);
    }
  }

  async handleGetCurrentAgent(args) {
    this.ensureTaskManager();

    try {
      const currentAgent = this.taskManager.getCurrentAgent();
      return {
        content: [
          {
            type: "text",
            text: currentAgent
              ? JSON.stringify(currentAgent, null, 2)
              : "No current agent set",
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get current agent: ${error.message}`);
    }
  }

  async run() {
    await this.initialize();
    const transport = new global.StdioServerTransport();
    await this.server.connect(transport);
    console.log("TaskManager MCP server running on stdio");
  }
}

// Run the server
async function main() {
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
      "args": ["-y", "--package=multiagent-task-manager", "multiagent-task-manager-mcp"],
      "env": {
        "TASK_MANAGER_AGENT_ID": "claude-assistant"
      }
    }
  }
}

Directory Safety:
- Defaults to current directory for task data
- Automatically falls back to ~/TaskManager if current directory is read-only
- System directories (/, /usr/, /opt/) are avoided for safety

Available Tools:
- init_task_manager: Initialize task manager (safe directory handling)
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
  await server.run();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = TaskManagerMCPServer;
