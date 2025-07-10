#!/usr/bin/env node

/**
 * TaskManager API Usage Examples
 * Demonstrates how to use the TaskManager programmatically
 */

const TaskManager = require('./task-manager.js');

// Example 1: Basic Setup and Agent Management
function example1_BasicSetup() {
  console.log('🚀 Example 1: Basic Setup and Agent Management\n');

  const tm = new TaskManager({ dataDir: './example-data' });

  // Add different types of agents
  const aiAgent = tm.addAgent({
    id: 'ai-dev-1',
    name: 'AI Developer',
    type: 'ai',
    capabilities: ['coding', 'testing', 'documentation']
  });

  const humanManager = tm.addAgent({
    id: 'sarah.manager',
    name: 'Sarah Manager',
    type: 'human',
    capabilities: ['all']
  });

  console.log('✅ Agents created');
  console.log('📊 Project status:', tm.getProjectStatus());
  console.log();
}

// Example 2: Task Creation and Dependencies
function example2_TaskManagement() {
  console.log('🚀 Example 2: Task Creation and Dependencies\n');

  const tm = new TaskManager({ dataDir: './example-data' });

  // Create a dependency chain
  const task1 = tm.createTask({
    title: 'Database Schema Design',
    category: 'design',
    priority: 'high',
    assignees: ['sarah.manager'],
    completion_criteria: [
      'User table defined',
      'Relationships mapped',
      'Indexes planned'
    ]
  });

  const task2 = tm.createTask({
    title: 'Database Implementation',
    category: 'coding',
    priority: 'high',
    assignees: ['ai-dev-1'],
    dependencies: [task1.id],
    completion_criteria: [
      'Tables created',
      'Migrations written',
      'Seeds added'
    ]
  });

  const task3 = tm.createTask({
    title: 'API Endpoints',
    category: 'coding',
    priority: 'medium',
    assignees: ['ai-dev-1'],
    dependencies: [task2.id],
    blocks: ['TASK-999'], // This task blocks a future task
    completion_criteria: [
      'CRUD endpoints',
      'Authentication middleware',
      'Error handling'
    ]
  });

  console.log('✅ Created task dependency chain');
  console.log(`   ${task1.id} → ${task2.id} → ${task3.id}`);
  console.log();
}

// Example 3: Smart Recommendations
function example3_Recommendations() {
  console.log('🚀 Example 3: Smart Recommendations\n');

  const tm = new TaskManager({ dataDir: './example-data' });

  // Get recommendations for different agents
  const agents = tm.listAgents();

  agents.forEach(agent => {
    console.log(`🎯 Recommendations for ${agent.name}:`);

    try {
      const recommendations = tm.getRecommendationsForAgent(agent.id, 3);

      if (recommendations.length === 0) {
        console.log('   No tasks available');
      } else {
        recommendations.forEach((task, index) => {
          console.log(`   ${index + 1}. ${task.id}: ${task.title}`);
          console.log(`      Score: ${task.recommendation_score}, Reason: ${task.recommendation_reason}`);
        });
      }
    } catch (error) {
      console.log(`   ⚠️ ${error.message}`);
    }
    console.log();
  });
}

// Example 4: Workflow Simulation
function example4_WorkflowSimulation() {
  console.log('🚀 Example 4: Workflow Simulation\n');

  const tm = new TaskManager({ dataDir: './example-data' });

  console.log('📋 Starting workflow simulation...');

  // Simulate starting work on database schema
  const schemaTask = tm.listTasks().find(t => t.title.includes('Schema'));
  if (schemaTask) {
    tm.updateTask(schemaTask.id, { status: 'in-progress' });
    console.log(`⚡ Started: ${schemaTask.title}`);
  }

  // Complete the schema task
  setTimeout(() => {
    if (schemaTask) {
      tm.updateTask(schemaTask.id, { status: 'completed' });
      console.log(`✅ Completed: ${schemaTask.title}`);

      // Check what's now available
      const aiAgent = tm.getAgent('ai-dev-1');
      if (aiAgent) {
        const newRecommendations = tm.getRecommendationsForAgent('ai-dev-1');
        console.log(`\n🎯 New recommendations for ${aiAgent.name}:`);
        newRecommendations.forEach(task => {
          console.log(`   📌 ${task.id}: ${task.title} (${task.recommendation_reason})`);
        });
      }
    }
  }, 1000);
}

// Example 5: Multi-Agent Collaboration
function example5_MultiAgentCollaboration() {
  console.log('🚀 Example 5: Multi-Agent Collaboration\n');

  const tm = new TaskManager({ dataDir: './example-data' });

  // Create a task that requires multiple agents
  const complexTask = tm.createTask({
    title: 'Full-Stack Feature Implementation',
    category: 'feature',
    priority: 'critical',
    description: 'Implement user profile management with frontend and backend',
    completion_criteria: [
      'Backend API endpoints',
      'Frontend components',
      'Database integration',
      'Testing suite',
      'Documentation'
    ]
  });

  // Assign multiple agents with different roles
  tm.assignAgentToTask(complexTask.id, {
    id: 'ai-dev-1',
    name: 'AI Developer',
    type: 'ai',
    role: 'backend-lead'
  });

  tm.assignAgentToTask(complexTask.id, {
    id: 'sarah.manager',
    name: 'Sarah Manager',
    type: 'human',
    role: 'reviewer'
  });

  console.log(`✅ Created collaborative task: ${complexTask.id}`);
  console.log('👥 Assigned multiple agents with different roles');

  // Show agent workloads
  console.log('\n📊 Updated workloads:');
  ['ai-dev-1', 'sarah.manager'].forEach(agentId => {
    try {
      const workload = tm.getAgentWorkload(agentId);
      console.log(`   ${workload.agent.name}: ${workload.workload.active_tasks} active tasks`);
    } catch (error) {
      console.log(`   ${agentId}: Agent not found`);
    }
  });
  console.log();
}

// Example 6: Task Filtering and Reporting
function example6_FilteringAndReporting() {
  console.log('🚀 Example 6: Task Filtering and Reporting\n');

  const tm = new TaskManager({ dataDir: './example-data' });

  // Different filtering examples
  console.log('📋 Filtering examples:');

  const highPriorityTasks = tm.listTasks({ priority: 'high' });
  console.log(`   High priority tasks: ${highPriorityTasks.length}`);

  const todoTasks = tm.listTasks({ status: 'todo' });
  console.log(`   Todo tasks: ${todoTasks.length}`);

  const aiTasks = tm.listTasks({ agent: 'ai-dev-1' });
  console.log(`   AI Developer tasks: ${aiTasks.length}`);

  // Generate comprehensive report
  console.log('\n📊 Project Report:');
  const status = tm.getProjectStatus();

  console.log(`   📈 Overall Progress: ${status.progress.completion_percentage}%`);
  console.log(`   👥 Team Size: ${status.agents.total} agents`);
  console.log(`   🎯 Completion Rate: ${status.progress.completed}/${status.progress.total_tasks}`);

  if (status.tasks.by_priority.critical > 0) {
    console.log(`   🚨 Critical Tasks: ${status.tasks.by_priority.critical} need immediate attention`);
  }
  console.log();
}

// Example 7: Dynamic Task Creation Based on Agent Capabilities
function example7_DynamicTaskCreation() {
  console.log('🚀 Example 7: Dynamic Task Creation Based on Agent Capabilities\n');

  const tm = new TaskManager({ dataDir: './example-data' });

  // Get available agents and their capabilities
  const agents = tm.listAgents();

  console.log('🤖 Creating tasks based on agent capabilities:');

  agents.forEach(agent => {
    if (agent.capabilities.includes('testing')) {
      const testTask = tm.createTask({
        title: `Test Suite for ${agent.name}`,
        category: 'testing',
        priority: 'medium',
        assignees: [agent.id],
        description: `Automated tests assigned to ${agent.name} based on testing capability`
      });
      console.log(`   ✅ Created testing task ${testTask.id} for ${agent.name}`);
    }

    if (agent.capabilities.includes('documentation')) {
      const docTask = tm.createTask({
        title: `Documentation by ${agent.name}`,
        category: 'documentation',
        priority: 'low',
        assignees: [agent.id],
        description: `Documentation task for ${agent.name}`
      });
      console.log(`   📝 Created documentation task ${docTask.id} for ${agent.name}`);
    }
  });
  console.log();
}

// Example 8: Advanced Task Management Operations
function example8_AdvancedOperations() {
  console.log('🚀 Example 8: Advanced Task Management Operations\n');

  const tm = new TaskManager({ dataDir: './example-data' });

  // Task transfer between agents
  const tasks = tm.listTasks({ agent: 'ai-dev-1' });
  if (tasks.length > 0) {
    const taskToTransfer = tasks[0];
    console.log(`🔄 Transferring task ${taskToTransfer.id} from ai-dev-1 to sarah.manager`);

    try {
      tm.transferTask(taskToTransfer.id, 'ai-dev-1', {
        id: 'sarah.manager',
        name: 'Sarah Manager',
        type: 'human',
        role: 'assignee'
      });
      console.log('   ✅ Transfer completed');
    } catch (error) {
      console.log(`   ❌ Transfer failed: ${error.message}`);
    }
  }

  // Bulk status updates
  const todoTasks = tm.listTasks({ status: 'todo' });
  console.log(`\n📋 Bulk operations on ${todoTasks.length} todo tasks:`);

  todoTasks.slice(0, 2).forEach(task => {
    tm.updateTask(task.id, { status: 'in-progress' });
    console.log(`   ⚡ Started: ${task.title}`);
  });

  // Agent workload balancing check
  console.log('\n⚖️  Workload balancing:');
  tm.listAgents().forEach(agent => {
    const workload = tm.getAgentWorkload(agent.id);
    const loadLevel = workload.workload.active_tasks > 3 ? '🔴 High' :
                     workload.workload.active_tasks > 1 ? '🟡 Medium' : '🟢 Low';
    console.log(`   ${agent.name}: ${loadLevel} (${workload.workload.active_tasks} active)`);
  });
  console.log();
}

// Main execution
async function runExamples() {
  console.log('🎯 TaskManager API Examples\n');
  console.log('=' .repeat(50));

  try {
    example1_BasicSetup();
    example2_TaskManagement();
    example3_Recommendations();
    example4_WorkflowSimulation();
    example5_MultiAgentCollaboration();
    example6_FilteringAndReporting();
    example7_DynamicTaskCreation();
    example8_AdvancedOperations();

    console.log('🎉 All examples completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   - Explore the generated example-data/ directory');
    console.log('   - Try the CLI: node task-manager.js --help');
    console.log('   - Integrate TaskManager into your own projects');

  } catch (error) {
    console.error('❌ Error running examples:', error.message);
    console.error(error.stack);
  }
}

// Export individual examples for selective use
module.exports = {
  runExamples,
  example1_BasicSetup,
  example2_TaskManagement,
  example3_Recommendations,
  example4_WorkflowSimulation,
  example5_MultiAgentCollaboration,
  example6_FilteringAndReporting,
  example7_DynamicTaskCreation,
  example8_AdvancedOperations
};

// Run all examples if called directly
if (require.main === module) {
  runExamples();
}
