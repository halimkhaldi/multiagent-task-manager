#!/usr/bin/env node

/**
 * Agent Workflow Examples
 * Demonstrates how agents would actually interact with the TaskManager system
 */

const TaskManager = require('./task-manager.js');

// ==================== EXAMPLE 1: AI Agent Daily Workflow ====================
async function aiAgentWorkflow() {
  console.log('🤖 AI Agent Daily Workflow Example\n');

  // Agent starts their day by checking in
  const tm = new TaskManager({
    dataDir: './workflow-data',
    agentId: 'ai-dev-1' // This would normally come from environment
  });

  try {
    // 1. Agent checks in to see their status
    console.log('1. 🔍 Agent checking in...');
    const checkIn = tm.checkIn();
    console.log(`   Agent: ${checkIn.agent.name}`);
    console.log(`   Active tasks: ${checkIn.status.active_tasks}`);
    console.log(`   Todo tasks: ${checkIn.status.todo_tasks}`);
    console.log(`   Pending recommendations: ${checkIn.status.pending_recommendations}`);

    // 2. Review current tasks
    console.log('\n2. 📋 Reviewing my current tasks...');
    const myTasks = tm.getMyTasks();
    myTasks.forEach(task => {
      console.log(`   ${task.id}: ${task.title} [${task.status}]`);
    });

    // 3. Get recommendations for new work
    console.log('\n3. 🎯 Getting recommendations...');
    const recommendations = tm.getMyRecommendations();
    if (recommendations.length > 0) {
      const topTask = recommendations[0];
      console.log(`   Top recommendation: ${topTask.id} - ${topTask.title}`);
      console.log(`   Reason: ${topTask.recommendation_reason}`);

      // 4. Self-assign to recommended task
      console.log('\n4. 👍 Self-assigning to recommended task...');
      tm.takeSelfAssignedTask(topTask.id);
    }

    // 5. Start working on a task
    const todoTasks = tm.getMyTodoTasks();
    if (todoTasks.length > 0) {
      console.log('\n5. ⚡ Starting work on a task...');
      const taskToStart = todoTasks[0];
      tm.startTask(taskToStart.id);
      console.log(`   Started: ${taskToStart.title}`);
    }

    // 6. Simulate completing previous work
    const activeTasks = tm.getMyActiveTasks();
    if (activeTasks.length > 1) {
      console.log('\n6. ✅ Completing previous task...');
      const taskToComplete = activeTasks[activeTasks.length - 1];
      tm.completeTask(taskToComplete.id);
      console.log(`   Completed: ${taskToComplete.title}`);
    }

    console.log('\n✅ AI Agent workflow completed successfully!');

  } catch (error) {
    console.error('❌ AI Agent workflow failed:', error.message);
  }
}

// ==================== EXAMPLE 2: Human Manager Workflow ====================
async function humanManagerWorkflow() {
  console.log('\n👤 Human Manager Workflow Example\n');

  const tm = new TaskManager({
    dataDir: './workflow-data',
    agentId: 'tech.lead'
  });

  try {
    // 1. Manager reviews overall project status
    console.log('1. 📊 Reviewing project status...');
    const status = tm.getProjectStatus();
    console.log(`   Progress: ${status.progress.completion_percentage}%`);
    console.log(`   Team size: ${status.agents.total} agents`);
    console.log(`   Critical tasks: ${status.tasks.by_priority.critical}`);

    // 2. Check team workloads
    console.log('\n2. ⚖️  Checking team workloads...');
    const agents = tm.listAgents().filter(a => a.id !== 'tech.lead');
    agents.forEach(agent => {
      const workload = tm.getAgentWorkload(agent.id);
      const loadLevel = workload.workload.active_tasks > 3 ? 'High' :
                       workload.workload.active_tasks > 1 ? 'Medium' : 'Low';
      console.log(`   ${agent.name}: ${loadLevel} (${workload.workload.active_tasks} tasks)`);
    });

    // 3. Create new high-priority task
    console.log('\n3. 📝 Creating urgent task...');
    const urgentTask = tm.createTask({
      title: 'Critical Security Patch',
      category: 'security',
      priority: 'critical',
      description: 'Apply security updates immediately',
      completion_criteria: [
        'Update dependencies',
        'Run security scan',
        'Deploy to production'
      ]
    });

    // 4. Assign to best available agent
    console.log('\n4. 👥 Assigning to best available agent...');
    const availableAgents = agents.filter(a => {
      const workload = tm.getAgentWorkload(a.id);
      return workload.workload.active_tasks < 3; // Not overloaded
    });

    if (availableAgents.length > 0) {
      const bestAgent = availableAgents[0];
      tm.assignAgentToTask(urgentTask.id, bestAgent);
      console.log(`   Assigned to: ${bestAgent.name}`);
    }

    // 5. Review blocked tasks
    console.log('\n5. 🚫 Checking for blocked tasks...');
    const blockedTasks = tm.listTasks({ status: 'blocked' });
    if (blockedTasks.length > 0) {
      console.log(`   Found ${blockedTasks.length} blocked tasks - need attention`);
    } else {
      console.log('   No blocked tasks - good workflow health');
    }

    console.log('\n✅ Human Manager workflow completed successfully!');

  } catch (error) {
    console.error('❌ Human Manager workflow failed:', error.message);
  }
}

// ==================== EXAMPLE 3: Multi-Agent Collaboration ====================
async function multiAgentCollaboration() {
  console.log('\n🤝 Multi-Agent Collaboration Example\n');

  const tm = new TaskManager({ dataDir: './workflow-data' });

  try {
    // Setup: Ensure we have agents
    const agents = tm.listAgents();
    if (agents.length < 2) {
      console.log('Setting up demo agents...');

      tm.addAgent({
        id: 'ai-dev-1',
        name: 'AI Developer',
        type: 'ai',
        capabilities: ['coding', 'testing']
      });

      tm.addAgent({
        id: 'ai-reviewer-1',
        name: 'AI Reviewer',
        type: 'ai',
        capabilities: ['review', 'documentation']
      });

      tm.addAgent({
        id: 'tech.lead',
        name: 'Tech Lead',
        type: 'human',
        capabilities: ['all']
      });
    }

    // 1. Create a complex task requiring collaboration
    console.log('1. 📋 Creating collaborative task...');
    const complexTask = tm.createTask({
      title: 'Full-Stack User Management Feature',
      category: 'feature',
      priority: 'high',
      description: 'Complete user management with backend API and frontend UI',
      completion_criteria: [
        'Backend API endpoints',
        'Database migrations',
        'Frontend components',
        'Unit tests',
        'Integration tests',
        'Documentation',
        'Code review completed'
      ]
    });

    // 2. Assign primary developer
    console.log('\n2. 👨‍💻 Assigning primary developer...');
    tm.assignAgentToTask(complexTask.id, {
      id: 'ai-dev-1',
      role: 'primary-developer'
    });

    // 3. Assign reviewer
    console.log('\n3. 👀 Assigning reviewer...');
    tm.assignAgentToTask(complexTask.id, {
      id: 'ai-reviewer-1',
      role: 'reviewer'
    });

    // 4. Assign tech lead as supervisor
    console.log('\n4. 👔 Assigning tech lead as supervisor...');
    tm.assignAgentToTask(complexTask.id, {
      id: 'tech.lead',
      role: 'supervisor'
    });

    // 5. Simulate workflow progression
    console.log('\n5. 🔄 Simulating collaborative workflow...');

    // Developer starts the task
    tm.setCurrentAgent('ai-dev-1');
    tm.startTask(complexTask.id);
    console.log('   📝 Developer started working on task');

    // Create subtasks for different aspects
    const backendSubtask = tm.createTask({
      title: 'Backend API for User Management',
      category: 'coding',
      priority: 'high',
      dependencies: [complexTask.id],
      assignees: ['ai-dev-1']
    });

    const frontendSubtask = tm.createTask({
      title: 'Frontend UI for User Management',
      category: 'coding',
      priority: 'high',
      dependencies: [backendSubtask.id],
      assignees: ['ai-dev-1']
    });

    const reviewSubtask = tm.createTask({
      title: 'Code Review for User Management',
      category: 'review',
      priority: 'high',
      dependencies: [frontendSubtask.id],
      assignees: ['ai-reviewer-1']
    });

    console.log('   📋 Created subtasks for backend, frontend, and review');

    // 6. Show agent-specific views
    console.log('\n6. 👥 Agent-specific task views:');

    ['ai-dev-1', 'ai-reviewer-1', 'tech.lead'].forEach(agentId => {
      try {
        tm.setCurrentAgent(agentId);
        const agent = tm.getCurrentAgent();
        const myTasks = tm.getMyTasks();
        console.log(`   ${agent.name}: ${myTasks.length} tasks assigned`);
      } catch (error) {
        console.log(`   ${agentId}: Not available`);
      }
    });

    console.log('\n✅ Multi-agent collaboration setup completed successfully!');

  } catch (error) {
    console.error('❌ Multi-agent collaboration failed:', error.message);
  }
}

// ==================== EXAMPLE 4: Environment-Based Agent Usage ====================
function environmentBasedUsage() {
  console.log('\n🌍 Environment-Based Agent Usage Example\n');

  console.log('This example shows how agents would use environment variables:');
  console.log('');

  console.log('1. 📁 Create .env file for each agent:');
  console.log('   Agent 1 (.env):');
  console.log('   TASK_MANAGER_AGENT_ID=ai-dev-1');
  console.log('   TASK_MANAGER_DATA_DIR=./project-data');
  console.log('');

  console.log('   Agent 2 (.env):');
  console.log('   TASK_MANAGER_AGENT_ID=ai-reviewer-1');
  console.log('   TASK_MANAGER_DATA_DIR=./project-data');
  console.log('');

  console.log('2. 🚀 Each agent can then use personalized commands:');
  console.log('   $ node task-manager.js my-tasks');
  console.log('   $ node task-manager.js my-recommendations');
  console.log('   $ node task-manager.js check-in');
  console.log('');

  console.log('3. 🔄 Typical agent workflow:');
  console.log('   $ node task-manager.js check-in                    # See status');
  console.log('   $ node task-manager.js my-recommendations          # Get suggestions');
  console.log('   $ node task-manager.js take TASK-001               # Self-assign');
  console.log('   $ node task-manager.js start TASK-001              # Start work');
  console.log('   $ node task-manager.js complete TASK-001           # Complete work');
  console.log('');

  console.log('4. 🤖 For automated agents (scripts/cron jobs):');
  console.log('   #!/bin/bash');
  console.log('   export TASK_MANAGER_AGENT_ID=automated-agent-1');
  console.log('   export TASK_MANAGER_DATA_DIR=/var/project-data');
  console.log('   ');
  console.log('   # Check for new assignments');
  console.log('   node task-manager.js notifications');
  console.log('   ');
  console.log('   # Get and start recommended work');
  console.log('   RECOMMENDED=$(node task-manager.js my-recommendations | head -1)');
  console.log('   if [ ! -z "$RECOMMENDED" ]; then');
  console.log('     TASK_ID=$(echo $RECOMMENDED | cut -d: -f1)');
  console.log('     node task-manager.js take $TASK_ID');
  console.log('     node task-manager.js start $TASK_ID');
  console.log('   fi');
  console.log('');

  console.log('✅ Environment-based usage examples completed!');
}

// ==================== EXAMPLE 5: Agent Notification System ====================
async function notificationSystemExample() {
  console.log('\n🔔 Agent Notification System Example\n');

  const tm = new TaskManager({ dataDir: './workflow-data' });

  try {
    // 1. Manager assigns tasks to agents
    console.log('1. 👔 Manager assigning tasks...');
    tm.setCurrentAgent('tech.lead');

    const taskForDev = tm.createTask({
      title: 'Implement API rate limiting',
      category: 'security',
      priority: 'high'
    });

    // Assignment creates notification
    tm.assignAgentToTask(taskForDev.id, {
      id: 'ai-dev-1',
      name: 'AI Developer'
    });

    console.log('   ✅ Task assigned with notification');

    // 2. Agent checks notifications
    console.log('\n2. 🤖 Agent checking notifications...');
    tm.setCurrentAgent('ai-dev-1');

    const notifications = tm.getMyNotifications();
    console.log(`   📬 ${notifications.length} new notifications`);

    notifications.forEach((notif, index) => {
      console.log(`   ${index + 1}. ${notif.message}`);
      console.log(`      From: ${notif.assigned_by} at ${notif.assigned_at}`);
    });

    // 3. Agent acknowledges and starts work
    console.log('\n3. ✅ Agent acknowledging notifications...');
    tm.clearMyNotifications();

    if (notifications.length > 0) {
      const firstNotification = notifications[0];
      tm.startTask(firstNotification.task_id);
      console.log(`   🚀 Started work on: ${firstNotification.task_title}`);
    }

    console.log('\n✅ Notification system example completed!');

  } catch (error) {
    console.error('❌ Notification system example failed:', error.message);
  }
}

// ==================== MAIN EXECUTION ====================
async function runWorkflowExamples() {
  console.log('🔧 TaskManager Agent Workflow Examples\n');
  console.log('=' .repeat(60));

  try {
    await aiAgentWorkflow();
    await humanManagerWorkflow();
    await multiAgentCollaboration();
    environmentBasedUsage();
    await notificationSystemExample();

    console.log('\n🎉 All workflow examples completed successfully!');
    console.log('\n💡 Next Steps:');
    console.log('   1. Copy .env.example to .env and set your agent ID');
    console.log('   2. Run: node task-manager.js my-tasks');
    console.log('   3. Try: node task-manager.js check-in');
    console.log('   4. Explore: node task-manager.js --help');

  } catch (error) {
    console.error('❌ Workflow examples failed:', error.message);
    console.error(error.stack);
  }
}

// Export for individual use
module.exports = {
  runWorkflowExamples,
  aiAgentWorkflow,
  humanManagerWorkflow,
  multiAgentCollaboration,
  environmentBasedUsage,
  notificationSystemExample
};

// Run examples if called directly
if (require.main === module) {
  runWorkflowExamples();
}
