#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Task Manager - Multi-Agent Task Management System
 * A comprehensive package for managing tasks across multiple AI agents and humans
 */

class TaskManager {
  constructor(options = {}) {
    this.dataDir = options.dataDir || process.env.TASK_MANAGER_DATA_DIR || './tasks-data';
    this.trackerFile = path.join(this.dataDir, 'task-tracker.json');
    this.agentsFile = path.join(this.dataDir, 'agents.json');
    this.currentAgentId = options.agentId || process.env.TASK_MANAGER_AGENT_ID || null;
    this.config = {
      maxRecommendations: options.maxRecommendations || 3,
      autoSave: options.autoSave !== false,
      useCurrentDir: options.useCurrentDir || process.env.TASK_MANAGER_USE_CURRENT_DIR === 'true',
      ...options
    };

    this.scoring = {
      priority: { critical: 10, high: 7, medium: 5, low: 2 },
      dependency: { blocking: 8, dependent: 3, independent: 1 },
      criticalPath: { onPath: 5, nearPath: 3, offPath: 1 },
      risk: { high: 8, medium: 5, low: 2 },
      phase: { active: 10, next: 7, future: 3, completed: 0 }
    };

    this.taskTracker = null;
    this.agents = null;
    this.init();
  }

  // ==================== INITIALIZATION ====================

  init() {
    this.ensureDataDirectory();
    this.loadData();
  }

  ensureDataDirectory() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
      this.createInitialFiles();
    }
  }

  smartInit(options = {}) {
    const useCurrentDir = options.useCurrentDir || this.config.useCurrentDir;
    const targetDir = options.dataDir || process.env.TASK_MANAGER_DATA_DIR ||
      (useCurrentDir ? './' : './tasks-data');

    console.log(`🔍 Initializing TaskManager in: ${targetDir}`);

    // Update paths if different from constructor
    if (targetDir !== this.dataDir) {
      this.dataDir = targetDir;
      this.trackerFile = path.join(this.dataDir, 'task-tracker.json');
      this.agentsFile = path.join(this.dataDir, 'agents.json');
    }

    const results = {
      created: [],
      existed: [],
      updated: []
    };

    // Create data directory if it doesn't exist
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
      results.created.push(`Directory: ${this.dataDir}`);
      console.log(`✅ Created directory: ${this.dataDir}`);
    } else {
      results.existed.push(`Directory: ${this.dataDir}`);
      console.log(`📁 Directory exists: ${this.dataDir}`);
    }

    // Handle task tracker file
    if (!fs.existsSync(this.trackerFile)) {
      this.createTaskTracker();
      results.created.push('task-tracker.json');
      console.log(`✅ Created: task-tracker.json`);
    } else {
      results.existed.push('task-tracker.json');
      console.log(`📄 Exists: task-tracker.json`);
    }

    // Handle agents file
    if (!fs.existsSync(this.agentsFile)) {
      this.createAgentsFile();
      results.created.push('agents.json');
      console.log(`✅ Created: agents.json`);
    } else {
      results.existed.push('agents.json');
      console.log(`📄 Exists: agents.json`);
    }

    // Handle README in data directory
    const readmePath = path.join(this.dataDir, 'README.md');
    if (!fs.existsSync(readmePath)) {
      this.createDataReadme();
      results.created.push('README.md');
      console.log(`✅ Created: README.md`);
    } else {
      results.existed.push('README.md');
      console.log(`📄 Exists: README.md`);
    }

    // Handle .env file (always in project root)
    const projectRoot = process.cwd();
    const envPath = path.join(projectRoot, '.env');
    const envExamplePath = path.join(__dirname, '.env.example');

    this.handleEnvFile(envPath, envExamplePath, results);

    // Load data after ensuring files exist
    this.loadData();

    return results;
  }

  handleEnvFile(envPath, envExamplePath, results) {
    const requiredEnvVars = [
      '# TaskManager Configuration',
      'TASK_MANAGER_AGENT_ID=your-agent-id',
      'TASK_MANAGER_DATA_DIR=./tasks-data',
      'TASK_MANAGER_USE_CURRENT_DIR=false'
    ];

    if (fs.existsSync(envPath)) {
      // Read existing .env file
      const existingContent = fs.readFileSync(envPath, 'utf8');
      const lines = existingContent.split('\n');

      // Check which TaskManager variables are missing
      const missingVars = requiredEnvVars.filter(reqVar => {
        if (reqVar.startsWith('#')) return false; // Skip comments
        const varName = reqVar.split('=')[0];
        return !lines.some(line => line.trim().startsWith(varName + '='));
      });

      if (missingVars.length > 0) {
        // Append missing variables
        const newContent = existingContent.trimEnd() + '\n\n# TaskManager Configuration\n' +
          missingVars.filter(v => !v.startsWith('#')).join('\n') + '\n';

        fs.writeFileSync(envPath, newContent);
        results.updated.push('.env (appended TaskManager variables)');
        console.log(`🔄 Updated: .env (added ${missingVars.length} TaskManager variables)`);
      } else {
        results.existed.push('.env (TaskManager variables already present)');
        console.log(`📄 Exists: .env (TaskManager variables already configured)`);
      }
    } else {
      // Create new .env file
      const envContent = [
        '# Project Environment Variables',
        '',
        ...requiredEnvVars,
        ''
      ].join('\n');

      fs.writeFileSync(envPath, envContent);
      results.created.push('.env');
      console.log(`✅ Created: .env`);
    }
  }

  createInitialFiles() {
    this.createTaskTracker();
    this.createAgentsFile();
    this.createDataReadme();
    console.log(`✅ Task Manager initialized in ${this.dataDir}`);
  }

  createTaskTracker() {
    const initialTracker = {
      project: {
        name: "New Project",
        code: "NEW-PROJ",
        version: "1.0.0",
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        status: "active",
        description: "Project managed by Task Manager"
      },
      progress: {
        total_tasks: 0,
        completed: 0,
        in_progress: 0,
        todo: 0,
        completion_percentage: 0
      },
      current_state: {
        active_phase: "phase-1",
        active_tasks: [],
        next_recommended_tasks: [],
        blocking_issues: [],
        latest_update: new Date().toISOString(),
        recommendation_algorithm: {
          version: "2.0.0",
          max_recommendations: this.config.maxRecommendations
        }
      },
      phases: {},
      tasks: {},
      agents: {},
      recommendation_history: [],
      metrics: {
        velocity: { tasks_per_day: 0, completion_rate: 0 },
        quality: { bugs_found: 0, test_coverage: 0 },
        performance: {}
      }
    };

    fs.writeFileSync(this.trackerFile, JSON.stringify(initialTracker, null, 2));
  }

  createAgentsFile() {
    const initialAgents = {
      registry: {},
      types: {
        human: { icon: "👤", capabilities: ["all"] },
        ai: { icon: "🤖", capabilities: ["code", "analysis", "documentation"] }
      },
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };

    fs.writeFileSync(this.agentsFile, JSON.stringify(initialAgents, null, 2));
  }

  createDataReadme() {
    const readme = `# Task Manager Data Directory

This directory contains the TaskManager project data files.

## Files

- \`task-tracker.json\`: Main project and task data
- \`agents.json\`: Agent registry and capabilities
- \`README.md\`: This documentation file

## Quick Start

\`\`\`bash
# Set your agent identity
export TASK_MANAGER_AGENT_ID=your-agent-id

# Check your tasks
node task-manager.js my-tasks

# Get recommendations
node task-manager.js my-recommendations

# Start working on a task
node task-manager.js start TASK-001
\`\`\`

## Environment Variables

Set these in your \`.env\` file or environment:

- \`TASK_MANAGER_AGENT_ID\`: Your agent identifier
- \`TASK_MANAGER_DATA_DIR\`: Path to this data directory
- \`TASK_MANAGER_USE_CURRENT_DIR\`: Use current directory instead of ./tasks-data

## Agent Types

- **human**: Human team members with full capabilities
- **ai**: AI agents with specific capabilities

## Task Workflow

1. \`todo\` → \`in-progress\` → \`completed\`
2. Optional: \`blocked\`, \`review\`, \`cancelled\`

## Priority Levels

- \`critical\` 🔴: Must be done immediately
- \`high\` 🟠: Important and urgent
- \`medium\` 🟡: Normal priority
- \`low\` 🟢: Can be deferred

For more information, see the main TaskManager documentation.
`;

    fs.writeFileSync(path.join(this.dataDir, 'README.md'), readme);
  }

  loadData() {
    try {
      if (fs.existsSync(this.trackerFile)) {
        this.taskTracker = JSON.parse(fs.readFileSync(this.trackerFile, 'utf8'));
      } else {
        this.taskTracker = null;
      }
      if (fs.existsSync(this.agentsFile)) {
        this.agents = JSON.parse(fs.readFileSync(this.agentsFile, 'utf8'));
      } else {
        this.agents = null;
      }

      // Ensure data structures exist
      if (!this.taskTracker) {
        this.createInitialFiles();
      }
      if (!this.agents) {
        this.createInitialFiles();
      }
    } catch (error) {
      console.error('Error loading data:', error.message);
      throw error;
    }
  }

  saveData() {
    if (!this.config.autoSave) return;

    try {
      this.taskTracker.project.updated = new Date().toISOString();
      this.agents.updated = new Date().toISOString();

      fs.writeFileSync(this.trackerFile, JSON.stringify(this.taskTracker, null, 2));
      fs.writeFileSync(this.agentsFile, JSON.stringify(this.agents, null, 2));
    } catch (error) {
      console.error('Error saving data:', error.message);
      throw error;
    }
  }

  // ==================== AGENT MANAGEMENT ====================

  addAgent(agentInfo) {
    const agent = {
      id: agentInfo.id || `agent-${Date.now()}`,
      name: agentInfo.name,
      type: agentInfo.type || 'ai', // 'ai' or 'human'
      capabilities: agentInfo.capabilities || [],
      status: 'active',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      workload: {
        active_tasks: 0,
        completed_tasks: 0,
        total_score: 0
      },
      ...agentInfo
    };

    this.agents.registry[agent.id] = agent;
    this.saveData();

    console.log(`✅ Agent ${agent.name} (${agent.id}) added successfully`);
    return agent;
  }

  getAgent(agentId) {
    if (!this.agents || !this.agents.registry) {
      return null;
    }
    return this.agents.registry[agentId] || null;
  }

  listAgents() {
    if (!this.agents || !this.agents.registry) {
      return [];
    }
    return Object.values(this.agents.registry);
  }

  updateAgent(agentId, updates) {
    if (!this.agents.registry[agentId]) {
      throw new Error(`Agent ${agentId} not found`);
    }

    if (!this.agents || !this.agents.registry) {
      throw new Error('Agents registry not initialized');
    }

    this.agents.registry[agentId] = {
      ...this.agents.registry[agentId],
      ...updates,
      updated: new Date().toISOString()
    };

    this.saveData();
    return this.agents.registry[agentId];
  }

  removeAgent(agentId) {
    if (!this.agents.registry[agentId]) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Unassign from all tasks
    if (this.taskTracker && this.taskTracker.tasks) {
      Object.values(this.taskTracker.tasks).forEach(task => {
        if (task.assignees) {
          task.assignees = task.assignees.filter(a => a.id !== agentId);
        }
      });
    }

    if (this.agents && this.agents.registry) {
      delete this.agents.registry[agentId];
    }
    this.saveData();

    console.log(`✅ Agent ${agentId} removed successfully`);
  }

  // ==================== TASK MANAGEMENT ====================

  createTask(taskData) {
    const taskId = taskData.id || this.generateTaskId();

    const task = {
      id: taskId,
      title: taskData.title,
      category: taskData.category || 'general',
      phase: taskData.phase || this.taskTracker.current_state.active_phase,
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      assignees: this.normalizeAssignees(taskData.assignees || []),
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      completed: null,
      dependencies: taskData.dependencies || [],
      blocks: taskData.blocks || [],
      subtasks: taskData.subtasks || [],
      files_affected: taskData.files_affected || [],
      completion_criteria: taskData.completion_criteria || [],
      description: taskData.description || '',
      recommendation_score: 0,
      risk_level: taskData.risk_level || 'medium',
      estimated_hours: taskData.estimated_hours || 0,
      tags: taskData.tags || []
    };

    if (!this.taskTracker) {
      this.createInitialFiles();
      this.loadData();
    }
    if (!this.taskTracker.tasks) {
      this.taskTracker.tasks = {};
    }
    this.taskTracker.tasks[taskId] = task;
    this.updateProgress();
    this.updateAgentWorkloads();
    this.saveData();

    console.log(`✅ Task ${taskId} created: ${task.title}`);
    return task;
  }

  updateTask(taskId, updates) {
    if (!this.taskTracker.tasks[taskId]) {
      throw new Error(`Task ${taskId} not found`);
    }

    const oldStatus = this.taskTracker.tasks[taskId].status;

    this.taskTracker.tasks[taskId] = {
      ...this.taskTracker.tasks[taskId],
      ...updates,
      updated: new Date().toISOString()
    };

    // Handle status changes
    if (updates.status && updates.status !== oldStatus) {
      if (updates.status === 'completed') {
        this.taskTracker.tasks[taskId].completed = new Date().toISOString();
      }
    }

    // Handle assignee changes
    if (updates.assignees) {
      this.taskTracker.tasks[taskId].assignees = this.normalizeAssignees(updates.assignees);
    }

    this.updateProgress();
    this.updateAgentWorkloads();
    this.saveData();

    console.log(`✅ Task ${taskId} updated`);
    return this.taskTracker.tasks[taskId];
  }

  deleteTask(taskId) {
    if (!this.taskTracker.tasks[taskId]) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Remove from dependencies and blocks
    Object.values(this.taskTracker.tasks).forEach(task => {
      task.dependencies = task.dependencies.filter(dep => dep !== taskId);
      task.blocks = task.blocks.filter(block => block !== taskId);
    });

    delete this.taskTracker.tasks[taskId];
    this.updateProgress();
    this.updateAgentWorkloads();
    this.saveData();

    console.log(`✅ Task ${taskId} deleted`);
  }

  getTask(taskId) {
    return this.taskTracker.tasks[taskId] || null;
  }

  listTasks(filters = {}) {
    let tasks = Object.values(this.taskTracker.tasks);

    if (filters.agent) {
      tasks = tasks.filter(task =>
        task.assignees && task.assignees.some(a => a.id === filters.agent)
      );
    }

    if (filters.status) {
      tasks = tasks.filter(task => task.status === filters.status);
    }

    if (filters.priority) {
      tasks = tasks.filter(task => task.priority === filters.priority);
    }

    if (filters.phase) {
      tasks = tasks.filter(task => task.phase === filters.phase);
    }

    return tasks;
  }

  // ==================== TASK ASSIGNMENT ====================

  assignAgentToTask(taskId, agentInfo) {
    const task = this.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const normalizedAgent = this.normalizeAssignee(agentInfo);

    // Check if agent is already assigned
    const isAlreadyAssigned = task.assignees.some(a => a.id === normalizedAgent.id);
    if (isAlreadyAssigned) {
      console.log(`⚠️  Agent ${normalizedAgent.id} is already assigned to task ${taskId}`);
      return task;
    }

    task.assignees.push(normalizedAgent);
    task.updated = new Date().toISOString();

    this.updateAgentWorkloads();
    this.saveData();

    // Notify the assigned agent
    try {
      this.notifyAssignment(taskId, this.currentAgentId);
    } catch (error) {
      // Notification failed, but assignment succeeded
      console.log(`⚠️  Assignment notification failed: ${error.message}`);
    }

    console.log(`✅ Agent ${normalizedAgent.name} assigned to task ${taskId}`);
    return task;
  }

  unassignAgentFromTask(taskId, agentId) {
    const task = this.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.assignees = task.assignees.filter(a => a.id !== agentId);
    task.updated = new Date().toISOString();

    this.updateAgentWorkloads();
    this.saveData();

    console.log(`✅ Agent ${agentId} unassigned from task ${taskId}`);
    return task;
  }

  transferTask(taskId, fromAgentId, toAgentInfo) {
    this.unassignAgentFromTask(taskId, fromAgentId);
    return this.assignAgentToTask(taskId, toAgentInfo);
  }

  // ==================== RECOMMENDATIONS ====================

  getRecommendationsForAgent(agentId, limit = null) {
    const agent = this.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const eligibleTasks = this.getEligibleTasksForAgent(agentId);
    const scoredTasks = eligibleTasks.map(task => ({
      ...task,
      recommendation_score: this.calculateTaskScore(task)
    }));

    // Sort by score (highest first)
    scoredTasks.sort((a, b) => b.recommendation_score - a.recommendation_score);

    const recommendations = scoredTasks.slice(0, limit || this.config.maxRecommendations);

    // Update recommendation history
    this.addRecommendationHistory(agentId, recommendations);

    return recommendations.map(task => ({
      ...task,
      recommendation_reason: this.generateRecommendationReason(task)
    }));
  }

  // ==================== AGENT-CENTRIC METHODS ====================

  getCurrentAgent() {
    if (!this.currentAgentId) {
      throw new Error('No current agent set. Set TASK_MANAGER_AGENT_ID environment variable or pass agentId in constructor.');
    }
    return this.getAgent(this.currentAgentId);
  }

  setCurrentAgent(agentId) {
    const agent = this.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    this.currentAgentId = agentId;
    return agent;
  }

  getMyTasks(filters = {}) {
    if (!this.currentAgentId) {
      throw new Error('No current agent set');
    }
    return this.listTasks({ ...filters, agent: this.currentAgentId });
  }

  getMyActiveTasks() {
    return this.getMyTasks({ status: 'in-progress' });
  }

  getMyTodoTasks() {
    return this.getMyTasks({ status: 'todo' });
  }

  getMyRecommendations(limit = null) {
    if (!this.currentAgentId) {
      throw new Error('No current agent set');
    }
    return this.getRecommendationsForAgent(this.currentAgentId, limit);
  }

  getMyWorkload() {
    if (!this.currentAgentId) {
      throw new Error('No current agent set');
    }
    return this.getAgentWorkload(this.currentAgentId);
  }

  startTask(taskId) {
    const task = this.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Check if current agent is assigned to this task
    const isAssigned = task.assignees && task.assignees.some(a => a.id === this.currentAgentId);
    if (!isAssigned) {
      throw new Error(`Current agent is not assigned to task ${taskId}`);
    }

    return this.updateTask(taskId, { status: 'in-progress' });
  }

  completeTask(taskId) {
    const task = this.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Check if current agent is assigned to this task
    const isAssigned = task.assignees && task.assignees.some(a => a.id === this.currentAgentId);
    if (!isAssigned) {
      throw new Error(`Current agent is not assigned to task ${taskId}`);
    }

    return this.updateTask(taskId, { status: 'completed' });
  }

  takeSelfAssignedTask(taskId) {
    if (!this.currentAgentId) {
      throw new Error('No current agent set');
    }

    const currentAgent = this.getCurrentAgent();
    return this.assignAgentToTask(taskId, {
      id: this.currentAgentId,
      name: currentAgent.name,
      type: currentAgent.type,
      role: 'primary'
    });
  }

  checkIn() {
    if (!this.currentAgentId) {
      throw new Error('No current agent set');
    }

    const agent = this.getCurrentAgent();
    const activeTasks = this.getMyActiveTasks();
    const todoTasks = this.getMyTodoTasks();
    const recommendations = this.getMyRecommendations(3);

    return {
      agent: agent,
      status: {
        active_tasks: activeTasks.length,
        todo_tasks: todoTasks.length,
        pending_recommendations: recommendations.length
      },
      active_tasks: activeTasks,
      todo_tasks: todoTasks,
      recommendations: recommendations
    };
  }

  notifyAssignment(taskId, assignedByAgentId = null) {
    const task = this.getTask(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const assignedBy = assignedByAgentId ? this.getAgent(assignedByAgentId) : null;
    const notification = {
      type: 'task_assignment',
      task_id: taskId,
      task_title: task.title,
      assigned_by: assignedBy ? assignedBy.name : 'System',
      assigned_at: new Date().toISOString(),
      priority: task.priority,
      message: `You have been assigned to task: ${task.title}`
    };

    // Store notification for the assigned agents
    task.assignees.forEach(assignee => {
      if (!this.taskTracker.notifications) {
        this.taskTracker.notifications = {};
      }
      if (!this.taskTracker.notifications[assignee.id]) {
        this.taskTracker.notifications[assignee.id] = [];
      }
      this.taskTracker.notifications[assignee.id].push(notification);
    });

    this.saveData();
    return notification;
  }

  getMyNotifications() {
    if (!this.currentAgentId) {
      throw new Error('No current agent set');
    }

    if (!this.taskTracker.notifications || !this.taskTracker.notifications[this.currentAgentId]) {
      return [];
    }

    return this.taskTracker.notifications[this.currentAgentId];
  }

  clearMyNotifications() {
    if (!this.currentAgentId) {
      throw new Error('No current agent set');
    }

    if (this.taskTracker.notifications && this.taskTracker.notifications[this.currentAgentId]) {
      this.taskTracker.notifications[this.currentAgentId] = [];
      this.saveData();
    }
  }

  getEligibleTasksForAgent(agentId) {
    const agent = this.getAgent(agentId);
    if (!agent) return [];

    return Object.values(this.taskTracker.tasks).filter(task => {
      // Must be todo or unassigned
      if (task.status !== 'todo' && task.status !== 'blocked') return false;

      // Check if agent is already assigned
      const isAssigned = task.assignees && task.assignees.some(a => a.id === agentId);
      if (isAssigned) return false;

      // Check dependencies
      const hasUnmetDependencies = task.dependencies.some(depId => {
        const depTask = this.taskTracker.tasks[depId];
        return !depTask || depTask.status !== 'completed';
      });
      if (hasUnmetDependencies) return false;

      // Check agent capabilities (for AI agents)
      if (agent.type === 'ai' && agent.capabilities && agent.capabilities.length > 0) {
        const taskRequiresCapability = this.getRequiredCapabilities(task);
        if (taskRequiresCapability.length > 0) {
          const hasRequiredCapability = taskRequiresCapability.some(cap =>
            agent.capabilities.includes(cap)
          );
          if (!hasRequiredCapability) return false;
        }
      }

      return true;
    });
  }

  getRequiredCapabilities(task) {
    const capabilities = [];

    if (task.category === 'coding' || task.category === 'feature') {
      capabilities.push('coding');
    }
    if (task.category === 'testing') {
      capabilities.push('testing');
    }
    if (task.category === 'documentation') {
      capabilities.push('documentation');
    }
    if (task.category === 'analysis') {
      capabilities.push('analysis');
    }

    return capabilities;
  }

  calculateTaskScore(task) {
    let score = 0;

    // Priority score
    score += this.scoring.priority[task.priority] || 0;

    // Dependency score
    const dependencyCount = task.blocks ? task.blocks.length : 0;
    score += dependencyCount > 0 ? this.scoring.dependency.blocking : this.scoring.dependency.independent;

    // Risk score
    score += this.scoring.risk[task.risk_level] || 0;

    // Phase score
    const currentPhase = this.taskTracker.current_state.active_phase;
    if (task.phase === currentPhase) {
      score += this.scoring.phase.active;
    } else {
      score += this.scoring.phase.future;
    }

    return Math.round(score);
  }

  generateRecommendationReason(task) {
    const reasons = [];

    if (this.scoring.priority[task.priority] >= 7) {
      reasons.push(`High priority (${task.priority})`);
    }

    if (task.blocks && task.blocks.length > 0) {
      reasons.push(`Blocks ${task.blocks.length} other task(s)`);
    }

    if (task.phase === this.taskTracker.current_state.active_phase) {
      reasons.push('In active phase');
    }

    if (task.risk_level === 'high') {
      reasons.push('High risk - needs attention');
    }

    return reasons.join(', ') || 'Good fit for current workflow';
  }

  // ==================== HELPER METHODS ====================

  normalizeAssignees(assignees) {
    if (!Array.isArray(assignees)) {
      assignees = [assignees];
    }

    return assignees.map(assignee => this.normalizeAssignee(assignee));
  }

  normalizeAssignee(assignee) {
    if (typeof assignee === 'string') {
      // Try to find agent by ID first
      const agent = this.getAgent(assignee);
      if (agent) {
        return {
          id: agent.id,
          name: agent.name,
          type: agent.type,
          role: 'primary',
          assigned_date: new Date().toISOString()
        };
      }

      // Assume it's a human if not found in agents
      return {
        id: assignee,
        name: assignee,
        type: 'human',
        role: 'primary',
        assigned_date: new Date().toISOString()
      };
    }

    return {
      id: assignee.id,
      name: assignee.name || assignee.id,
      type: assignee.type || 'human',
      role: assignee.role || 'primary',
      assigned_date: assignee.assigned_date || new Date().toISOString()
    };
  }

  generateTaskId() {
    if (!this.taskTracker || !this.taskTracker.tasks) {
      return 'TASK-001';
    }

    const tasks = Object.keys(this.taskTracker.tasks);
    if (tasks.length === 0) {
      return 'TASK-001';
    }

    const maxId = tasks.reduce((max, taskId) => {
      const match = taskId.match(/TASK-(\d+)/);
      if (match) {
        const num = parseInt(match[1]);
        return num > max ? num : max;
      }
      return max;
    }, 0);

    return `TASK-${String(maxId + 1).padStart(3, '0')}`;
  }

  updateProgress() {
    const tasks = Object.values(this.taskTracker.tasks);
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const todo = tasks.filter(t => t.status === 'todo').length;

    this.taskTracker.progress = {
      total_tasks: total,
      completed: completed,
      in_progress: inProgress,
      todo: todo,
      completion_percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }

  updateAgentWorkloads() {
    if (!this.agents || !this.agents.registry) {
      return;
    }

    // Reset all agent workloads
    Object.values(this.agents.registry).forEach(agent => {
      agent.workload = {
        active_tasks: 0,
        completed_tasks: 0,
        total_score: 0
      };
    });

    if (!this.taskTracker || !this.taskTracker.tasks) {
      return;
    }

    // Calculate workloads from tasks
    Object.values(this.taskTracker.tasks).forEach(task => {
      if (task.assignees) {
        task.assignees.forEach(assignee => {
          const agent = this.agents.registry[assignee.id];
          if (agent) {
            if (task.status === 'completed') {
              agent.workload.completed_tasks++;
            } else if (task.status === 'in-progress' || task.status === 'todo') {
              agent.workload.active_tasks++;
              agent.workload.total_score += task.recommendation_score || 0;
            }
          }
        });
      }
    });
  }

  addRecommendationHistory(agentId, recommendations) {
    const historyEntry = {
      agent_id: agentId,
      date: new Date().toISOString(),
      algorithm_version: "2.0.0",
      recommendations: recommendations.map(task => ({
        task_id: task.id,
        score: task.recommendation_score,
        selected: false
      })),
      rationale: `Generated ${recommendations.length} recommendations for agent ${agentId}`
    };

    if (!this.taskTracker.recommendation_history) {
      this.taskTracker.recommendation_history = [];
    }

    this.taskTracker.recommendation_history.push(historyEntry);

    // Keep only last 50 entries
    if (this.taskTracker.recommendation_history.length > 50) {
      this.taskTracker.recommendation_history = this.taskTracker.recommendation_history.slice(-50);
    }
  }

  // ==================== REPORTING ====================

  getProjectStatus() {
    const agents = this.listAgents();
    const tasks = Object.values(this.taskTracker.tasks);

    return {
      project: this.taskTracker.project,
      progress: this.taskTracker.progress,
      agents: {
        total: agents.length,
        active: agents.filter(a => a.status === 'active').length,
        by_type: {
          human: agents.filter(a => a.type === 'human').length,
          ai: agents.filter(a => a.type === 'ai').length
        }
      },
      tasks: {
        total: tasks.length,
        by_status: {
          todo: tasks.filter(t => t.status === 'todo').length,
          in_progress: tasks.filter(t => t.status === 'in-progress').length,
          completed: tasks.filter(t => t.status === 'completed').length,
          blocked: tasks.filter(t => t.status === 'blocked').length
        },
        by_priority: {
          critical: tasks.filter(t => t.priority === 'critical').length,
          high: tasks.filter(t => t.priority === 'high').length,
          medium: tasks.filter(t => t.priority === 'medium').length,
          low: tasks.filter(t => t.priority === 'low').length
        }
      }
    };
  }

  getAgentWorkload(agentId) {
    const agent = this.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const tasks = this.listTasks({ agent: agentId });

    return {
      agent: agent,
      workload: agent.workload,
      tasks: {
        active: tasks.filter(t => t.status === 'in-progress' || t.status === 'todo'),
        completed: tasks.filter(t => t.status === 'completed'),
        blocked: tasks.filter(t => t.status === 'blocked')
      }
    };
  }

  // ==================== CLI INTERFACE ====================

  static parseArgs(args) {
    const parsed = { command: args[0], options: {}, flags: [] };

    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('--')) {
        const flagName = arg.substring(2);
        if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
          parsed.options[flagName] = args[i + 1];
          i++; // Skip the next argument as it's the value
        } else {
          parsed.flags.push(flagName);
        }
      }
    }

    return parsed;
  }

  static async promptForTask() {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (prompt) => new Promise((resolve) => {
      rl.question(prompt, resolve);
    });

    try {
      console.log('\n📝 Creating a new task...\n');

      const title = await question('Task title: ');
      const category = await question('Category (coding/design/documentation/testing/general): ') || 'general';
      const priority = await question('Priority (critical/high/medium/low): ') || 'medium';
      const description = await question('Description (optional): ');
      const assigneeInput = await question('Assignee ID (optional): ');
      const dependenciesInput = await question('Dependencies (comma-separated task IDs, optional): ');

      rl.close();

      const taskData = {
        title: title.trim(),
        category: category.trim(),
        priority: priority.trim(),
        description: description.trim() || undefined,
        assignees: assigneeInput.trim() ? [assigneeInput.trim()] : [],
        dependencies: dependenciesInput.trim() ?
          dependenciesInput.split(',').map(dep => dep.trim()).filter(dep => dep) : []
      };

      return taskData;
    } catch (error) {
      rl.close();
      throw error;
    }
  }

  static async promptForAgent() {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (prompt) => new Promise((resolve) => {
      rl.question(prompt, resolve);
    });

    try {
      console.log('\n🤖 Adding a new agent...\n');

      const name = await question('Agent name: ');
      const id = await question('Agent ID (optional, will auto-generate if empty): ');
      const type = await question('Type (ai/human): ') || 'ai';
      const capabilitiesInput = await question('Capabilities (comma-separated, e.g., coding,testing,documentation): ');

      rl.close();

      const agentData = {
        name: name.trim(),
        id: id.trim() || undefined,
        type: type.trim(),
        capabilities: capabilitiesInput.trim() ?
          capabilitiesInput.split(',').map(cap => cap.trim()).filter(cap => cap) : []
      };

      return agentData;
    } catch (error) {
      rl.close();
      throw error;
    }
  }

  static cli() {
    const args = process.argv.slice(2);
    const parsed = TaskManager.parseArgs(args);

    if (!parsed.command) {
      console.log('🚀 Task Manager CLI\n');
      console.log('Commands:');
      console.log('  init [--dir PATH] [--current]  - Initialize task manager');
      console.log('  list [--agent ID] [--status]   - List tasks');
      console.log('  create [--interactive]         - Create a new task');
      console.log('  update <ID> --status <STATUS>  - Update task status');
      console.log('  assign <TASK_ID> <AGENT_ID>    - Assign agent to task');
      console.log('  recommend [--agent <ID>]       - Get recommendations');
      console.log('  agents [add]                   - List or add agents');
      console.log('  status                         - Show project status');
      console.log('  workload [AGENT_ID]            - Show agent workload');
      console.log('  export                         - Export project data');
      console.log('\n🤖 Agent-Centric Commands (use TASK_MANAGER_AGENT_ID env var):');
      console.log('  my-tasks                       - List my tasks');
      console.log('  my-recommendations             - Get my recommendations');
      console.log('  my-workload                    - Show my workload');
      console.log('  check-in                       - Agent check-in status');
      console.log('  start <TASK_ID>                - Start working on my task');
      console.log('  complete <TASK_ID>             - Complete my task');
      console.log('  take <TASK_ID>                 - Self-assign to task');
      console.log('  notifications                  - Show my notifications');
      console.log('\nEnvironment Variables:');
      console.log('  TASK_MANAGER_AGENT_ID          - Set current agent ID');
      console.log('  TASK_MANAGER_DATA_DIR          - Set data directory');
      console.log('\nExamples:');
      console.log('  node task-manager.js init                    # Initialize in ./tasks-data');
      console.log('  node task-manager.js init --current          # Initialize in current directory');
      console.log('  node task-manager.js init --dir ./my-project # Initialize in specific directory');
      console.log('  export TASK_MANAGER_AGENT_ID=agent-1');
      console.log('  node task-manager.js my-tasks');
      console.log('  node task-manager.js start TASK-001');
      console.log('  node task-manager.js create --title "Fix bug" --priority high --assign agent-1');
      return;
    }

    const tm = new TaskManager();

    switch (parsed.command) {
      case 'init':
        const initOptions = {
          dataDir: parsed.options.dir,
          useCurrentDir: parsed.flags.includes('current') || parsed.options.dir === '.'
        };

        try {
          const results = tm.smartInit(initOptions);

          console.log('\n📊 Initialization Summary:');
          if (results.created.length > 0) {
            console.log(`   ✅ Created: ${results.created.join(', ')}`);
          }
          if (results.existed.length > 0) {
            console.log(`   📄 Already existed: ${results.existed.join(', ')}`);
          }
          if (results.updated.length > 0) {
            console.log(`   🔄 Updated: ${results.updated.join(', ')}`);
          }

          console.log('\n🎯 Next Steps:');
          console.log('   1. Set your agent ID in .env: TASK_MANAGER_AGENT_ID=your-agent-id');
          console.log('   2. Check status: node task-manager.js status');
          console.log('   3. Add agents: node task-manager.js agents add');
          console.log('   4. Create tasks: node task-manager.js create --title "First task"');

        } catch (error) {
          console.error('❌ Initialization failed:', error.message);
        }
        break;

      case 'list':
        const filters = {};
        if (parsed.options.agent) filters.agent = parsed.options.agent;
        if (parsed.options.status) filters.status = parsed.options.status;
        if (parsed.options.priority) filters.priority = parsed.options.priority;

        const tasks = tm.listTasks(filters);
        const filterDesc = Object.keys(filters).length > 0 ?
          ` (${Object.entries(filters).map(([k,v]) => `${k}=${v}`).join(', ')})` : '';

        console.log(`\n📋 Tasks${filterDesc}:`);
        if (tasks.length === 0) {
          console.log('  No tasks found');
        } else {
          tasks.forEach(task => {
            const assignees = task.assignees ? task.assignees.map(a => a.name).join(', ') : 'Unassigned';
            const priority = task.priority === 'critical' ? '🔴' :
                           task.priority === 'high' ? '🟠' :
                           task.priority === 'medium' ? '🟡' : '🟢';
            console.log(`  ${priority} ${task.id}: ${task.title} [${task.status}] - ${assignees}`);
          });
        }
        break;

      case 'create':
        if (parsed.flags.includes('interactive')) {
          TaskManager.promptForTask().then(taskData => {
            const task = tm.createTask(taskData);
            console.log(`\n✅ Task created: ${task.id} - ${task.title}`);
          }).catch(error => {
            console.error('❌ Error creating task:', error.message);
          });
        } else {
          const taskData = {
            title: parsed.options.title,
            category: parsed.options.category || 'general',
            priority: parsed.options.priority || 'medium',
            description: parsed.options.description,
            assignees: parsed.options.assign ? [parsed.options.assign] : [],
            dependencies: parsed.options.depends ? parsed.options.depends.split(',') : []
          };

          if (!taskData.title) {
            console.error('❌ --title is required');
            return;
          }

          try {
            const task = tm.createTask(taskData);
            console.log(`✅ Task created: ${task.id} - ${task.title}`);
          } catch (error) {
            console.error('❌ Error creating task:', error.message);
          }
        }
        break;

      case 'update':
        const taskId = args[1];
        if (!taskId) {
          console.error('❌ Task ID required');
          return;
        }

        const updates = {};
        if (parsed.options.status) updates.status = parsed.options.status;
        if (parsed.options.priority) updates.priority = parsed.options.priority;
        if (parsed.options.assign) {
          updates.assignees = [parsed.options.assign];
        }

        if (Object.keys(updates).length === 0) {
          console.error('❌ No updates specified. Use --status, --priority, or --assign');
          return;
        }

        try {
          const task = tm.updateTask(taskId, updates);
          console.log(`✅ Task ${taskId} updated: ${task.title}`);
        } catch (error) {
          console.error('❌', error.message);
        }
        break;

      case 'assign':
        const assignTaskId = args[1];
        const assignAgentId = args[2];

        if (!assignTaskId || !assignAgentId) {
          console.error('❌ Usage: assign <TASK_ID> <AGENT_ID>');
          return;
        }

        try {
          tm.assignAgentToTask(assignTaskId, { id: assignAgentId });
          console.log(`✅ Agent ${assignAgentId} assigned to task ${assignTaskId}`);
        } catch (error) {
          console.error('❌', error.message);
        }
        break;



      case 'agents':
        if (args[1] === 'add') {
          TaskManager.promptForAgent().then(agentData => {
            const agent = tm.addAgent(agentData);
            console.log(`\n✅ Agent added: ${agent.id} - ${agent.name}`);
          }).catch(error => {
            console.error('❌ Error adding agent:', error.message);
          });
        } else {
          const agents = tm.listAgents();
          console.log('\n👥 Agents:');
          if (agents.length === 0) {
            console.log('  No agents found');
          } else {
            agents.forEach(agent => {
              const icon = agent.type === 'ai' ? '🤖' : '👤';
              const status = agent.status === 'active' ? '✅' : '⏸️';
              console.log(`  ${status} ${icon} ${agent.name} (${agent.id})`);
              console.log(`     Type: ${agent.type}, Active: ${agent.workload.active_tasks}, Completed: ${agent.workload.completed_tasks}`);
              if (agent.capabilities && agent.capabilities.length > 0) {
                console.log(`     Capabilities: ${agent.capabilities.join(', ')}`);
              }
            });
          }
        }
        break;



      case 'status':
        const status = tm.getProjectStatus();
        console.log('\n📊 Project Status:');
        console.log(`  📈 Progress: ${status.progress.completion_percentage}% (${status.progress.completed}/${status.progress.total_tasks} tasks)`);
        console.log(`  👥 Agents: ${status.agents.total} (${status.agents.by_type.human} human, ${status.agents.by_type.ai} AI)`);
        console.log(`  📋 Tasks: ${status.tasks.by_status.in_progress} active, ${status.tasks.by_status.todo} todo, ${status.tasks.by_status.completed} completed`);

        if (status.tasks.by_priority.critical > 0) {
          console.log(`  🔴 Critical: ${status.tasks.by_priority.critical} tasks need immediate attention`);
        }
        break;

      case 'export':
        const exportData = {
          project: tm.taskTracker.project,
          agents: tm.agents,
          tasks: tm.taskTracker.tasks,
          progress: tm.taskTracker.progress,
          exported: new Date().toISOString()
        };

        const filename = `project-export-${new Date().toISOString().split('T')[0]}.json`;
        require('fs').writeFileSync(filename, JSON.stringify(exportData, null, 2));
        console.log(`✅ Project data exported to ${filename}`);
        break;

      case 'my-tasks':
        try {
          const myTasks = tm.getMyTasks();
          const currentAgent = tm.getCurrentAgent();
          console.log(`\n📋 Tasks for ${currentAgent.name} (${currentAgent.id}):`);

          if (myTasks.length === 0) {
            console.log('  No tasks assigned');
          } else {
            myTasks.forEach(task => {
              const priority = task.priority === 'critical' ? '🔴' :
                             task.priority === 'high' ? '🟠' :
                             task.priority === 'medium' ? '🟡' : '🟢';
              const statusIcon = task.status === 'completed' ? '✅' :
                               task.status === 'in-progress' ? '⚡' :
                               task.status === 'blocked' ? '🚫' : '📋';
              console.log(`  ${statusIcon} ${priority} ${task.id}: ${task.title} [${task.status}]`);
            });
          }
        } catch (error) {
          console.error('❌', error.message);
        }
        break;

      case 'my-recommendations':
        try {
          const recommendations = tm.getMyRecommendations();
          const currentAgent = tm.getCurrentAgent();
          console.log(`\n🎯 Recommendations for ${currentAgent.name}:`);

          if (recommendations.length === 0) {
            console.log('  No recommendations available');
          } else {
            recommendations.forEach((task, index) => {
              const priority = task.priority === 'critical' ? '🔴' :
                             task.priority === 'high' ? '🟠' :
                             task.priority === 'medium' ? '🟡' : '🟢';
              console.log(`  ${index + 1}. ${priority} ${task.id}: ${task.title} (Score: ${task.recommendation_score})`);
              console.log(`     ${task.recommendation_reason}`);
            });
          }
        } catch (error) {
          console.error('❌', error.message);
        }
        break;

      case 'my-workload':
        try {
          const workload = tm.getMyWorkload();
          console.log(`\n📊 My Workload:`);
          console.log(`  Active tasks: ${workload.workload.active_tasks}`);
          console.log(`  Completed tasks: ${workload.workload.completed_tasks}`);
          console.log(`  Total score: ${workload.workload.total_score}`);

          if (workload.tasks.active.length > 0) {
            console.log('\n  📋 My Active Tasks:');
            workload.tasks.active.forEach(task => {
              const priority = task.priority === 'critical' ? '🔴' :
                             task.priority === 'high' ? '🟠' :
                             task.priority === 'medium' ? '🟡' : '🟢';
              console.log(`    ${priority} ${task.id}: ${task.title} [${task.status}]`);
            });
          }
        } catch (error) {
          console.error('❌', error.message);
        }
        break;

      case 'check-in':
        try {
          const checkIn = tm.checkIn();
          const agent = checkIn.agent;
          const icon = agent.type === 'ai' ? '🤖' : '👤';

          console.log(`\n${icon} Check-in for ${agent.name} (${agent.id})`);
          console.log(`  Status: ${agent.status}`);
          console.log(`  Active tasks: ${checkIn.status.active_tasks}`);
          console.log(`  Todo tasks: ${checkIn.status.todo_tasks}`);
          console.log(`  Pending recommendations: ${checkIn.status.pending_recommendations}`);

          if (checkIn.recommendations.length > 0) {
            console.log('\n  🎯 Top Recommendations:');
            checkIn.recommendations.slice(0, 2).forEach((task, index) => {
              const priority = task.priority === 'critical' ? '🔴' :
                             task.priority === 'high' ? '🟠' :
                             task.priority === 'medium' ? '🟡' : '🟢';
              console.log(`    ${index + 1}. ${priority} ${task.id}: ${task.title}`);
            });
          }
        } catch (error) {
          console.error('❌', error.message);
        }
        break;

      case 'start':
        const startTaskId = args[1];
        if (!startTaskId) {
          console.error('❌ Task ID required');
          return;
        }

        try {
          const task = tm.startTask(startTaskId);
          console.log(`⚡ Started working on: ${task.title}`);
        } catch (error) {
          console.error('❌', error.message);
        }
        break;

      case 'complete':
        const completeTaskId = args[1];
        if (!completeTaskId) {
          console.error('❌ Task ID required');
          return;
        }

        try {
          const task = tm.completeTask(completeTaskId);
          console.log(`✅ Completed: ${task.title}`);
        } catch (error) {
          console.error('❌', error.message);
        }
        break;

      case 'take':
        const takeTaskId = args[1];
        if (!takeTaskId) {
          console.error('❌ Task ID required');
          return;
        }

        try {
          const task = tm.takeSelfAssignedTask(takeTaskId);
          console.log(`👍 Self-assigned to: ${task.title}`);
        } catch (error) {
          console.error('❌', error.message);
        }
        break;

      case 'notifications':
        try {
          const notifications = tm.getMyNotifications();
          console.log('\n🔔 My Notifications:');

          if (notifications.length === 0) {
            console.log('  No new notifications');
          } else {
            notifications.forEach((notification, index) => {
              console.log(`  ${index + 1}. ${notification.message}`);
              console.log(`     Assigned by: ${notification.assigned_by} at ${notification.assigned_at}`);
            });

            console.log('\nClear notifications with: node task-manager.js clear-notifications');
          }
        } catch (error) {
          console.error('❌', error.message);
        }
        break;

      case 'clear-notifications':
        try {
          tm.clearMyNotifications();
          console.log('✅ Notifications cleared');
        } catch (error) {
          console.error('❌', error.message);
        }
        break;

      case 'recommend':
        const recAgentId = parsed.options.agent || tm.currentAgentId;
        if (!recAgentId) {
          console.error('❌ --agent flag required or set TASK_MANAGER_AGENT_ID');
          return;
        }

        try {
          const recommendations = tm.getRecommendationsForAgent(recAgentId);
          console.log(`\n🎯 Recommendations for ${recAgentId}:`);

          if (recommendations.length === 0) {
            console.log('  No recommendations available');
          } else {
            recommendations.forEach((task, index) => {
              const priority = task.priority === 'critical' ? '🔴' :
                             task.priority === 'high' ? '🟠' :
                             task.priority === 'medium' ? '🟡' : '🟢';
              console.log(`  ${index + 1}. ${priority} ${task.id}: ${task.title} (Score: ${task.recommendation_score})`);
              console.log(`     ${task.recommendation_reason}`);
            });
          }
        } catch (error) {
          console.error('❌', error.message);
        }
        break;

      case 'workload':
        const workloadAgentId = args[1] || tm.currentAgentId;
        if (!workloadAgentId) {
          console.error('❌ Agent ID required or set TASK_MANAGER_AGENT_ID');
          return;
        }

        try {
          const workload = tm.getAgentWorkload(workloadAgentId);
          const icon = workload.agent.type === 'ai' ? '🤖' : '👤';

          console.log(`\n📊 Workload for ${icon} ${workload.agent.name}:`);
          console.log(`  Active tasks: ${workload.workload.active_tasks}`);
          console.log(`  Completed tasks: ${workload.workload.completed_tasks}`);
          console.log(`  Total score: ${workload.workload.total_score}`);

          if (workload.tasks.active.length > 0) {
            console.log('\n  📋 Active Tasks:');
            workload.tasks.active.forEach(task => {
              const priority = task.priority === 'critical' ? '🔴' :
                             task.priority === 'high' ? '🟠' :
                             task.priority === 'medium' ? '🟡' : '🟢';
              console.log(`    ${priority} ${task.id}: ${task.title} [${task.status}]`);
            });
          }
        } catch (error) {
          console.error('❌', error.message);
        }
        break;

      default:
        console.error(`❌ Unknown command: ${parsed.command}`);
        console.log('Run without arguments to see available commands');
    }
  }
}

// Export for use as module
module.exports = TaskManager;

// CLI interface when run directly
if (require.main === module) {
  TaskManager.cli();
}
