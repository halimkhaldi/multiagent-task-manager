#!/usr/bin/env node

/**
 * Agent Bot - Automated Agent Script Template
 *
 * This is a template for creating automated agents that can work with the TaskManager system.
 * Agents can run this script periodically (via cron or task scheduler) to automatically:
 * - Check for new task assignments
 * - Get recommendations and self-assign work
 * - Update task progress
 * - Report status
 */

const TaskManager = require('./task-manager.js');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class AgentBot {
  constructor(config = {}) {
    this.agentId = config.agentId || process.env.TASK_MANAGER_AGENT_ID;
    this.dataDir = config.dataDir || process.env.TASK_MANAGER_DATA_DIR || './tasks-data';
    this.logFile = config.logFile || path.join(this.dataDir, `${this.agentId}-bot.log`);
    this.config = {
      checkInterval: config.checkInterval || 30000, // 30 seconds
      maxConcurrentTasks: config.maxConcurrentTasks || 2,
      autoAssign: config.autoAssign !== false,
      autoStart: config.autoStart !== false,
      capabilities: config.capabilities || [],
      verbose: config.verbose || false,
      ...config
    };

    if (!this.agentId) {
      throw new Error('Agent ID is required. Set TASK_MANAGER_AGENT_ID or pass agentId in config.');
    }

    this.tm = new TaskManager({
      dataDir: this.dataDir,
      agentId: this.agentId
    });

    this.running = false;
    this.lastCheckIn = null;
  }

  // ==================== LOGGING ====================

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      agent: this.agentId,
      message,
      data
    };

    const logLine = `[${timestamp}] [${level.toUpperCase()}] [${this.agentId}] ${message}`;

    if (this.config.verbose) {
      console.log(logLine);
      if (data) {
        console.log('  Data:', JSON.stringify(data, null, 2));
      }
    }

    // Append to log file
    try {
      fs.appendFileSync(this.logFile, logLine + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }

  info(message, data) { this.log('info', message, data); }
  warn(message, data) { this.log('warn', message, data); }
  error(message, data) { this.log('error', message, data); }
  debug(message, data) { this.log('debug', message, data); }

  // ==================== CORE BOT FUNCTIONALITY ====================

  async checkIn() {
    try {
      this.lastCheckIn = new Date();
      const checkInData = this.tm.checkIn();

      this.info('Agent check-in completed', {
        activeTasks: checkInData.status.active_tasks,
        todoTasks: checkInData.status.todo_tasks,
        recommendations: checkInData.status.pending_recommendations
      });

      return checkInData;
    } catch (error) {
      this.error('Check-in failed', { error: error.message });
      throw error;
    }
  }

  async processNotifications() {
    try {
      const notifications = this.tm.getMyNotifications();

      if (notifications.length > 0) {
        this.info(`Processing ${notifications.length} notifications`);

        for (const notification of notifications) {
          this.info('New assignment notification', {
            taskId: notification.task_id,
            taskTitle: notification.task_title,
            assignedBy: notification.assigned_by,
            priority: notification.priority
          });
        }

        // Clear notifications after processing
        this.tm.clearMyNotifications();
        this.info('Notifications processed and cleared');
      }

      return notifications;
    } catch (error) {
      this.error('Failed to process notifications', { error: error.message });
      return [];
    }
  }

  async autoAssignTasks() {
    if (!this.config.autoAssign) {
      return [];
    }

    try {
      const workload = this.tm.getMyWorkload();
      const currentActiveCount = workload.workload.active_tasks;

      if (currentActiveCount >= this.config.maxConcurrentTasks) {
        this.debug('Skipping auto-assign - at max concurrent tasks', {
          current: currentActiveCount,
          max: this.config.maxConcurrentTasks
        });
        return [];
      }

      const recommendations = this.tm.getMyRecommendations(3);
      const tasksToAssign = [];

      for (const task of recommendations) {
        if (currentActiveCount + tasksToAssign.length >= this.config.maxConcurrentTasks) {
          break;
        }

        // Check if task matches our capabilities
        if (this.config.capabilities.length > 0) {
          const requiredCaps = this.tm.getRequiredCapabilities(task);
          const hasRequiredCap = requiredCaps.length === 0 ||
            requiredCaps.some(cap => this.config.capabilities.includes(cap));

          if (!hasRequiredCap) {
            this.debug('Skipping task - capability mismatch', {
              taskId: task.id,
              required: requiredCaps,
              available: this.config.capabilities
            });
            continue;
          }
        }

        try {
          this.tm.takeSelfAssignedTask(task.id);
          tasksToAssign.push(task);

          this.info('Auto-assigned to task', {
            taskId: task.id,
            title: task.title,
            priority: task.priority,
            score: task.recommendation_score
          });
        } catch (error) {
          this.warn('Failed to auto-assign task', {
            taskId: task.id,
            error: error.message
          });
        }
      }

      return tasksToAssign;
    } catch (error) {
      this.error('Auto-assign process failed', { error: error.message });
      return [];
    }
  }

  async autoStartTasks() {
    if (!this.config.autoStart) {
      return [];
    }

    try {
      const todoTasks = this.tm.getMyTodoTasks();
      const startedTasks = [];

      for (const task of todoTasks) {
        try {
          this.tm.startTask(task.id);
          startedTasks.push(task);

          this.info('Auto-started task', {
            taskId: task.id,
            title: task.title,
            priority: task.priority
          });
        } catch (error) {
          this.warn('Failed to auto-start task', {
            taskId: task.id,
            error: error.message
          });
        }
      }

      return startedTasks;
    } catch (error) {
      this.error('Auto-start process failed', { error: error.message });
      return [];
    }
  }

  async simulateWork(taskId, duration = 5000) {
    this.info('Simulating work on task', { taskId, duration });

    return new Promise(resolve => {
      setTimeout(() => {
        try {
          this.tm.completeTask(taskId);
          this.info('Simulated work completed', { taskId });
          resolve(true);
        } catch (error) {
          this.error('Failed to complete simulated work', {
            taskId,
            error: error.message
          });
          resolve(false);
        }
      }, duration);
    });
  }

  async runCycle() {
    this.info('Starting bot cycle');

    try {
      // 1. Check in and get status
      const checkInData = await this.checkIn();

      // 2. Process any notifications
      await this.processNotifications();

      // 3. Auto-assign new tasks if below capacity
      const newTasks = await this.autoAssignTasks();

      // 4. Auto-start todo tasks
      const startedTasks = await this.autoStartTasks();

      // 5. Report cycle summary
      this.info('Bot cycle completed', {
        activeTasks: checkInData.status.active_tasks,
        newAssignments: newTasks.length,
        startedTasks: startedTasks.length,
        recommendations: checkInData.status.pending_recommendations
      });

      return {
        checkIn: checkInData,
        newTasks,
        startedTasks
      };

    } catch (error) {
      this.error('Bot cycle failed', { error: error.message });
      throw error;
    }
  }

  // ==================== BOT LIFECYCLE ====================

  start() {
    if (this.running) {
      this.warn('Bot is already running');
      return;
    }

    this.running = true;
    this.info('Starting agent bot', {
      agentId: this.agentId,
      checkInterval: this.config.checkInterval,
      maxConcurrentTasks: this.config.maxConcurrentTasks,
      autoAssign: this.config.autoAssign,
      autoStart: this.config.autoStart
    });

    // Run initial cycle
    this.runCycle().catch(error => {
      this.error('Initial cycle failed', { error: error.message });
    });

    // Set up interval for continuous operation
    this.intervalId = setInterval(() => {
      if (this.running) {
        this.runCycle().catch(error => {
          this.error('Cycle failed', { error: error.message });
        });
      }
    }, this.config.checkInterval);

    // Graceful shutdown handling
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
  }

  stop() {
    if (!this.running) {
      this.warn('Bot is not running');
      return;
    }

    this.running = false;
    this.info('Stopping agent bot');

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.info('Agent bot stopped');
    process.exit(0);
  }

  // ==================== STATUS AND REPORTING ====================

  getStatus() {
    return {
      agentId: this.agentId,
      running: this.running,
      lastCheckIn: this.lastCheckIn,
      config: this.config,
      uptime: this.lastCheckIn ? Date.now() - this.lastCheckIn.getTime() : 0
    };
  }

  async generateReport() {
    try {
      const checkIn = await this.checkIn();
      const workload = this.tm.getMyWorkload();
      const notifications = this.tm.getMyNotifications();

      const report = {
        timestamp: new Date().toISOString(),
        agent: checkIn.agent,
        status: this.getStatus(),
        workload: workload.workload,
        tasks: {
          active: workload.tasks.active.length,
          completed: workload.tasks.completed.length,
          blocked: workload.tasks.blocked.length
        },
        notifications: notifications.length,
        recommendations: checkIn.recommendations.length
      };

      this.info('Generated status report', report);
      return report;
    } catch (error) {
      this.error('Failed to generate report', { error: error.message });
      throw error;
    }
  }
}

// ==================== CLI INTERFACE ====================

async function runBot() {
  const config = {
    verbose: process.argv.includes('--verbose') || process.argv.includes('-v'),
    autoAssign: !process.argv.includes('--no-auto-assign'),
    autoStart: !process.argv.includes('--no-auto-start'),
    maxConcurrentTasks: parseInt(process.argv.find(arg => arg.startsWith('--max-tasks='))?.split('=')[1]) || 2,
    checkInterval: parseInt(process.argv.find(arg => arg.startsWith('--interval='))?.split('=')[1]) || 30000
  };

  try {
    const bot = new AgentBot(config);

    if (process.argv.includes('--once')) {
      // Run once and exit
      console.log('🤖 Running bot cycle once...');
      const result = await bot.runCycle();
      console.log('✅ Bot cycle completed');
      console.log(`   New assignments: ${result.newTasks.length}`);
      console.log(`   Started tasks: ${result.startedTasks.length}`);
      process.exit(0);
    } else if (process.argv.includes('--report')) {
      // Generate report and exit
      console.log('📊 Generating agent report...');
      const report = await bot.generateReport();
      console.log(JSON.stringify(report, null, 2));
      process.exit(0);
    } else {
      // Run continuously
      console.log('🤖 Starting agent bot in continuous mode...');
      console.log('   Press Ctrl+C to stop');
      bot.start();
    }

  } catch (error) {
    console.error('❌ Bot failed to start:', error.message);
    process.exit(1);
  }
}

// Export for use as module
module.exports = { AgentBot };

// CLI interface when run directly
if (require.main === module) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log('🤖 Agent Bot - Automated Task Management');
    console.log('');
    console.log('Usage:');
    console.log('  node agent-bot.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --once              Run one cycle and exit');
    console.log('  --report            Generate status report and exit');
    console.log('  --verbose, -v       Enable verbose logging');
    console.log('  --no-auto-assign    Disable auto task assignment');
    console.log('  --no-auto-start     Disable auto task starting');
    console.log('  --max-tasks=N       Max concurrent tasks (default: 2)');
    console.log('  --interval=MS       Check interval in milliseconds (default: 30000)');
    console.log('  --help, -h          Show this help');
    console.log('');
    console.log('Environment Variables:');
    console.log('  TASK_MANAGER_AGENT_ID   Agent identifier (required)');
    console.log('  TASK_MANAGER_DATA_DIR   Data directory (default: ./tasks-data)');
    console.log('');
    console.log('Examples:');
    console.log('  export TASK_MANAGER_AGENT_ID=ai-dev-1');
    console.log('  node agent-bot.js --once');
    console.log('  node agent-bot.js --verbose --max-tasks=3');
    console.log('  node agent-bot.js --report');
  } else {
    runBot();
  }
}
