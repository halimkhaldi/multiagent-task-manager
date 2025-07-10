#!/usr/bin/env node

const TaskManager = require('./task-manager.js');

async function demo() {
  console.log('🚀 Task Manager Demo\n');

  // Initialize task manager
  const tm = new TaskManager({ dataDir: './demo-data' });

  try {
    // Add some agents
    console.log('1. Adding agents...');

    const codeAgent = tm.addAgent({
      id: 'agent-1',
      name: 'Code Assistant',
      type: 'ai',
      capabilities: ['coding', 'testing', 'documentation']
    });

    const designAgent = tm.addAgent({
      id: 'agent-2',
      name: 'Design Assistant',
      type: 'ai',
      capabilities: ['design', 'documentation']
    });

    const humanDev = tm.addAgent({
      id: 'john.doe',
      name: 'John Doe',
      type: 'human',
      capabilities: ['all']
    });

    console.log('   ✅ Added 3 agents\n');

    // Create some tasks
    console.log('2. Creating tasks...');

    const task1 = tm.createTask({
      title: 'Implement user authentication',
      category: 'coding',
      priority: 'high',
      description: 'Add login/logout functionality with JWT tokens',
      assignees: ['agent-1'],
      completion_criteria: [
        'JWT token generation',
        'Login endpoint',
        'Logout endpoint',
        'Authentication middleware'
      ]
    });

    const task2 = tm.createTask({
      title: 'Design user interface mockups',
      category: 'design',
      priority: 'medium',
      description: 'Create wireframes and mockups for the dashboard',
      assignees: ['agent-2'],
      completion_criteria: [
        'Dashboard wireframe',
        'User profile mockup',
        'Navigation design'
      ]
    });

    const task3 = tm.createTask({
      title: 'Write API documentation',
      category: 'documentation',
      priority: 'medium',
      description: 'Document all API endpoints with examples',
      dependencies: [task1.id],
      completion_criteria: [
        'Authentication endpoints documented',
        'API examples provided',
        'Error responses documented'
      ]
    });

    const task4 = tm.createTask({
      title: 'Setup CI/CD pipeline',
      category: 'devops',
      priority: 'high',
      description: 'Configure automated testing and deployment',
      assignees: ['john.doe']
    });

    console.log('   ✅ Created 4 tasks\n');

    // Show current status
    console.log('3. Current project status:');
    const status = tm.getProjectStatus();
    console.log(`   📊 Progress: ${status.progress.completion_percentage}% (${status.progress.completed}/${status.progress.total_tasks} tasks)`);
    console.log(`   👥 Agents: ${status.agents.total} (${status.agents.by_type.human} human, ${status.agents.by_type.ai} AI)`);
    console.log(`   📋 Tasks: ${status.tasks.total} total, ${status.tasks.by_status.todo} todo, ${status.tasks.by_status.in_progress} in progress\n`);

    // Get recommendations for each agent
    console.log('4. Getting recommendations for agents...\n');

    const agents = tm.listAgents();
    for (const agent of agents) {
      try {
        const recommendations = tm.getRecommendationsForAgent(agent.id, 2);
        console.log(`   🎯 Recommendations for ${agent.name} (${agent.id}):`);

        if (recommendations.length === 0) {
          console.log('      No tasks available\n');
          continue;
        }

        recommendations.forEach((task, index) => {
          console.log(`      ${index + 1}. ${task.id}: ${task.title}`);
          console.log(`         Priority: ${task.priority}, Score: ${task.recommendation_score}`);
          console.log(`         Reason: ${task.recommendation_reason}`);
        });
        console.log('');
      } catch (error) {
        console.log(`      ⚠️  ${error.message}\n`);
      }
    }

    // Simulate some work progress
    console.log('5. Simulating work progress...');

    // Start working on a task
    tm.updateTask(task1.id, { status: 'in-progress' });
    console.log(`   ⚡ Started work on: ${task1.title}`);

    // Complete a task
    tm.updateTask(task2.id, { status: 'completed' });
    console.log(`   ✅ Completed: ${task2.title}`);

    // Assign additional agent to a task
    tm.assignAgentToTask(task4.id, {
      id: 'agent-1',
      name: 'Code Assistant',
      type: 'ai',
      role: 'support'
    });
    console.log(`   👥 Assigned Code Assistant to help with: ${task4.title}\n`);

    // Show updated status
    console.log('6. Updated project status:');
    const newStatus = tm.getProjectStatus();
    console.log(`   📊 Progress: ${newStatus.progress.completion_percentage}% (${newStatus.progress.completed}/${newStatus.progress.total_tasks} tasks)`);
    console.log(`   📋 Active: ${newStatus.tasks.by_status.in_progress}, Todo: ${newStatus.tasks.by_status.todo}, Completed: ${newStatus.tasks.by_status.completed}\n`);

    // Show agent workloads
    console.log('7. Agent workloads:');
    agents.forEach(agent => {
      const workload = tm.getAgentWorkload(agent.id);
      const icon = agent.type === 'ai' ? '🤖' : '👤';
      console.log(`   ${icon} ${agent.name}:`);
      console.log(`      Active tasks: ${workload.workload.active_tasks}`);
      console.log(`      Completed tasks: ${workload.workload.completed_tasks}`);
      console.log(`      Total score: ${workload.workload.total_score}`);
    });

    console.log('\n8. Task listing by agent:');

    // List tasks for specific agent
    const agent1Tasks = tm.listTasks({ agent: 'agent-1' });
    console.log(`   📋 Tasks for Code Assistant (${agent1Tasks.length}):`);
    agent1Tasks.forEach(task => {
      console.log(`      ${task.id}: ${task.title} [${task.status}]`);
    });

    console.log('\n🎉 Demo completed successfully!');
    console.log('\nYou can now use the CLI:');
    console.log('  node task-manager.js agents');
    console.log('  node task-manager.js list --agent agent-1');
    console.log('  node task-manager.js recommend --agent agent-1');
    console.log('  node task-manager.js status');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.error(error.stack);
  }
}

// Run demo if called directly
if (require.main === module) {
  demo();
}

module.exports = demo;
