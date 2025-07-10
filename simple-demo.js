#!/usr/bin/env node

/**
 * Simple TaskManager Demo
 * A straightforward demonstration of the TaskManager system
 */

const TaskManager = require('./task-manager.js');

async function runSimpleDemo() {
  console.log('🚀 TaskManager Simple Demo\n');

  try {
    // 1. Initialize TaskManager
    console.log('1. 🏗️  Initializing TaskManager...');
    const tm = new TaskManager({ dataDir: './simple-demo-data' });
    console.log('   ✅ TaskManager initialized\n');

    // 2. Add some agents
    console.log('2. 👥 Adding agents...');

    const codeAgent = tm.addAgent({
      id: 'ai-coder',
      name: 'AI Coder',
      type: 'ai',
      capabilities: ['coding', 'testing']
    });

    const humanLead = tm.addAgent({
      id: 'team-lead',
      name: 'Team Lead',
      type: 'human',
      capabilities: ['all']
    });

    console.log('   ✅ Added AI Coder and Team Lead\n');

    // 3. Create some tasks
    console.log('3. 📝 Creating tasks...');

    const task1 = tm.createTask({
      title: 'Setup project structure',
      category: 'setup',
      priority: 'critical',
      assignees: ['ai-coder'],
      completion_criteria: [
        'Create directory structure',
        'Initialize package.json',
        'Setup basic configuration'
      ]
    });

    const task2 = tm.createTask({
      title: 'Implement core functionality',
      category: 'coding',
      priority: 'high',
      assignees: ['ai-coder'],
      dependencies: [task1.id],
      completion_criteria: [
        'Write main functions',
        'Add error handling',
        'Include documentation'
      ]
    });

    const task3 = tm.createTask({
      title: 'Review and test',
      category: 'review',
      priority: 'medium',
      assignees: ['team-lead'],
      dependencies: [task2.id],
      completion_criteria: [
        'Code review',
        'Test execution',
        'Quality assurance'
      ]
    });

    console.log(`   ✅ Created 3 tasks: ${task1.id}, ${task2.id}, ${task3.id}\n`);

    // 4. Show project status
    console.log('4. 📊 Project status:');
    const status = tm.getProjectStatus();
    console.log(`   Progress: ${status.progress.completion_percentage}%`);
    console.log(`   Tasks: ${status.progress.total_tasks} total, ${status.progress.todo} todo`);
    console.log(`   Agents: ${status.agents.total} (${status.agents.by_type.ai} AI, ${status.agents.by_type.human} human)\n`);

    // 5. Get recommendations for AI Coder
    console.log('5. 🎯 Getting recommendations for AI Coder...');
    try {
      const recommendations = tm.getRecommendationsForAgent('ai-coder');
      console.log(`   Found ${recommendations.length} recommendations:`);
      recommendations.forEach((task, index) => {
        console.log(`   ${index + 1}. ${task.id}: ${task.title} (Score: ${task.recommendation_score})`);
        console.log(`      Reason: ${task.recommendation_reason}`);
      });
    } catch (error) {
      console.log(`   ⚠️  ${error.message}`);
    }
    console.log('');

    // 6. Simulate work by AI Coder
    console.log('6. ⚡ Simulating AI Coder working...');

    // AI Coder checks their tasks
    tm.setCurrentAgent('ai-coder');
    const myTasks = tm.getMyTasks();
    console.log(`   AI Coder has ${myTasks.length} assigned tasks`);

    // Start working on first task
    if (myTasks.length > 0) {
      const firstTask = myTasks[0];
      tm.startTask(firstTask.id);
      console.log(`   Started: ${firstTask.title}`);

      // Simulate completion after a moment
      setTimeout(() => {
        tm.completeTask(firstTask.id);
        console.log(`   ✅ Completed: ${firstTask.title}`);

        // Show updated status
        console.log('\n7. 📈 Updated project status:');
        const newStatus = tm.getProjectStatus();
        console.log(`   Progress: ${newStatus.progress.completion_percentage}%`);
        console.log(`   Completed: ${newStatus.progress.completed}/${newStatus.progress.total_tasks}`);

        // Check what's next
        const nextRecommendations = tm.getRecommendationsForAgent('ai-coder');
        if (nextRecommendations.length > 0) {
          console.log(`\n8. 🎯 Next recommendation: ${nextRecommendations[0].title}`);
        }

        console.log('\n🎉 Demo completed successfully!');
        console.log('\n💡 Try these commands:');
        console.log('   export TASK_MANAGER_AGENT_ID=ai-coder');
        console.log('   export TASK_MANAGER_DATA_DIR=./simple-demo-data');
        console.log('   node task-manager.js my-tasks');
        console.log('   node task-manager.js check-in');
        console.log('   node task-manager.js my-recommendations');

      }, 1500);
    }

    // 7. Show agent workloads
    console.log('\n👥 Agent workloads:');
    const agents = tm.listAgents();
    agents.forEach(agent => {
      try {
        const workload = tm.getAgentWorkload(agent.id);
        const icon = agent.type === 'ai' ? '🤖' : '👤';
        console.log(`   ${icon} ${agent.name}: ${workload.workload.active_tasks} active, ${workload.workload.completed_tasks} completed`);
      } catch (error) {
        console.log(`   ${agent.name}: Workload unavailable`);
      }
    });

  } catch (error) {
    console.error('\n❌ Demo failed:', error.message);
    process.exit(1);
  }
}

// CLI Commands demonstration
function showCliExamples() {
  console.log('\n🖥️  CLI Commands you can try:');
  console.log('');
  console.log('Basic commands:');
  console.log('  node task-manager.js status');
  console.log('  node task-manager.js agents');
  console.log('  node task-manager.js list');
  console.log('');
  console.log('Agent-specific commands (set TASK_MANAGER_AGENT_ID first):');
  console.log('  export TASK_MANAGER_AGENT_ID=ai-coder');
  console.log('  export TASK_MANAGER_DATA_DIR=./simple-demo-data');
  console.log('  node task-manager.js my-tasks');
  console.log('  node task-manager.js my-recommendations');
  console.log('  node task-manager.js check-in');
  console.log('');
  console.log('Task management:');
  console.log('  node task-manager.js create --title "New task" --priority high');
  console.log('  node task-manager.js update TASK-001 --status completed');
  console.log('  node task-manager.js assign TASK-002 ai-coder');
  console.log('');
  console.log('Project templates:');
  console.log('  node project-templates.js list');
  console.log('  node project-templates.js create webapp --name "My App"');
  console.log('');
  console.log('Automated agents:');
  console.log('  node agent-bot.js --once --verbose');
  console.log('  node agent-bot.js --help');
}

// Main execution
if (require.main === module) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log('🎯 TaskManager Simple Demo');
    console.log('');
    console.log('This script demonstrates basic TaskManager functionality:');
    console.log('• Agent creation and management');
    console.log('• Task creation with dependencies');
    console.log('• Task recommendations and scoring');
    console.log('• Agent workflow simulation');
    console.log('• Progress tracking');
    console.log('');
    console.log('Usage:');
    console.log('  node simple-demo.js          # Run the demo');
    console.log('  node simple-demo.js --cli    # Show CLI examples');
    console.log('  node simple-demo.js --help   # Show this help');
  } else if (process.argv.includes('--cli')) {
    showCliExamples();
  } else {
    runSimpleDemo();
  }
}

module.exports = { runSimpleDemo, showCliExamples };
