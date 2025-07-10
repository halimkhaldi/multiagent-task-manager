#!/usr/bin/env node

/**
 * Complete Workflow Showcase
 *
 * This script demonstrates the complete TaskManager system workflow from start to finish.
 * It shows how to set up projects, manage agents, create tasks, and run automated workflows.
 */

const TaskManager = require('./task-manager.js');
const ProjectTemplates = require('./project-templates.js');
const { AgentBot } = require('./agent-bot.js');
const fs = require('fs');
const path = require('path');

class WorkflowShowcase {
  constructor() {
    this.showcaseDir = './showcase-data';
    this.setupShowcaseEnvironment();
  }

  setupShowcaseEnvironment() {
    console.log('🎯 Setting up Complete Workflow Showcase\n');

    // Clean up any existing showcase data
    if (fs.existsSync(this.showcaseDir)) {
      fs.rmSync(this.showcaseDir, { recursive: true, force: true });
    }

    fs.mkdirSync(this.showcaseDir, { recursive: true });
    console.log(`✅ Created showcase environment: ${this.showcaseDir}`);
  }

  async runCompleteWorkflow() {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 COMPLETE TASKMANAGER WORKFLOW SHOWCASE');
    console.log('='.repeat(60));

    try {
      await this.step1_ProjectInitialization();
      await this.step2_AgentSetup();
      await this.step3_TaskCreation();
      await this.step4_ManualWorkflow();
      await this.step5_AutomatedAgents();
      await this.step6_ProjectProgress();
      await this.step7_ReportsAndAnalytics();

      console.log('\n🎉 SHOWCASE COMPLETED SUCCESSFULLY!');
      this.printNextSteps();

    } catch (error) {
      console.error('\n❌ Showcase failed:', error.message);
      throw error;
    }
  }

  async step1_ProjectInitialization() {
    console.log('\n📋 STEP 1: Project Initialization');
    console.log('━'.repeat(40));

    // Initialize TaskManager
    const tm = new TaskManager({ dataDir: this.showcaseDir });
    console.log('✅ TaskManager initialized');

    // Create project from template
    const templates = new ProjectTemplates(tm);
    const project = templates.createWebAppProject({
      name: 'Advanced E-Commerce Platform',
      description: 'Full-featured e-commerce platform with AI recommendations',
      tech_stack: ['React', 'Node.js', 'PostgreSQL', 'Redis'],
      team_size: 'large'
    });

    console.log(`✅ Project created with ${project.tasks} tasks and ${project.agents} agents`);

    // Show project status
    const status = tm.getProjectStatus();
    console.log(`📊 Initial status: ${status.progress.completion_percentage}% complete`);

    this.tm = tm;
  }

  async step2_AgentSetup() {
    console.log('\n👥 STEP 2: Agent Setup and Configuration');
    console.log('━'.repeat(40));

    // Add specialized agents for the e-commerce platform
    const specializedAgents = [
      {
        id: 'ai-security-specialist',
        name: 'AI Security Specialist',
        type: 'ai',
        capabilities: ['security', 'encryption', 'audit', 'compliance']
      },
      {
        id: 'ai-performance-optimizer',
        name: 'AI Performance Optimizer',
        type: 'ai',
        capabilities: ['performance', 'caching', 'optimization', 'monitoring']
      },
      {
        id: 'product-manager',
        name: 'Product Manager',
        type: 'human',
        capabilities: ['all', 'strategy', 'planning', 'stakeholder-management']
      }
    ];

    specializedAgents.forEach(agent => {
      this.tm.addAgent(agent);
      console.log(`✅ Added ${agent.name} (${agent.type})`);
    });

    // Create specialized tasks for new agents
    const securityTask = this.tm.createTask({
      title: 'Implement advanced security measures',
      category: 'security',
      priority: 'critical',
      assignees: ['ai-security-specialist'],
      completion_criteria: [
        'Data encryption at rest and in transit',
        'Multi-factor authentication',
        'Security audit logging',
        'GDPR compliance measures'
      ]
    });

    const performanceTask = this.tm.createTask({
      title: 'Optimize platform performance',
      category: 'performance',
      priority: 'high',
      assignees: ['ai-performance-optimizer'],
      completion_criteria: [
        'Database query optimization',
        'Redis caching implementation',
        'CDN integration',
        'Performance monitoring setup'
      ]
    });

    console.log(`✅ Created specialized tasks: ${securityTask.id}, ${performanceTask.id}`);

    // Show agent overview
    const agents = this.tm.listAgents();
    console.log(`📊 Total agents: ${agents.length} (${agents.filter(a => a.type === 'ai').length} AI, ${agents.filter(a => a.type === 'human').length} human)`);
  }

  async step3_TaskCreation() {
    console.log('\n📝 STEP 3: Advanced Task Creation and Dependencies');
    console.log('━'.repeat(40));

    // Create complex task dependencies for e-commerce features
    const productCatalogTask = this.tm.createTask({
      title: 'Build product catalog system',
      category: 'feature',
      priority: 'high',
      assignees: ['backend-dev'],
      completion_criteria: [
        'Product data model',
        'Category management',
        'Search functionality',
        'Inventory tracking'
      ]
    });

    const shoppingCartTask = this.tm.createTask({
      title: 'Implement shopping cart functionality',
      category: 'feature',
      priority: 'high',
      assignees: ['frontend-dev'],
      dependencies: [productCatalogTask.id],
      completion_criteria: [
        'Add to cart functionality',
        'Cart persistence',
        'Quantity management',
        'Price calculations'
      ]
    });

    const paymentTask = this.tm.createTask({
      title: 'Integrate payment processing',
      category: 'integration',
      priority: 'critical',
      assignees: ['backend-dev'],
      dependencies: [shoppingCartTask.id],
      completion_criteria: [
        'Stripe integration',
        'PayPal integration',
        'Payment security',
        'Refund processing'
      ]
    });

    const orderManagementTask = this.tm.createTask({
      title: 'Build order management system',
      category: 'feature',
      priority: 'high',
      assignees: ['backend-dev'],
      dependencies: [paymentTask.id],
      completion_criteria: [
        'Order workflow',
        'Status tracking',
        'Email notifications',
        'Admin dashboard'
      ]
    });

    console.log('✅ Created e-commerce feature chain:');
    console.log(`   ${productCatalogTask.id} → ${shoppingCartTask.id} → ${paymentTask.id} → ${orderManagementTask.id}`);

    // Show task distribution
    const allTasks = this.tm.listTasks();
    const tasksByPriority = {
      critical: allTasks.filter(t => t.priority === 'critical').length,
      high: allTasks.filter(t => t.priority === 'high').length,
      medium: allTasks.filter(t => t.priority === 'medium').length,
      low: allTasks.filter(t => t.priority === 'low').length
    };

    console.log(`📊 Task distribution: ${tasksByPriority.critical} critical, ${tasksByPriority.high} high, ${tasksByPriority.medium} medium, ${tasksByPriority.low} low`);
  }

  async step4_ManualWorkflow() {
    console.log('\n🎯 STEP 4: Manual Agent Workflow Simulation');
    console.log('━'.repeat(40));

    // Simulate human manager reviewing and assigning tasks
    this.tm.setCurrentAgent('tech-lead');
    console.log('👔 Tech Lead reviewing project...');

    const recommendations = this.tm.getRecommendationsForAgent('backend-dev', 5);
    console.log(`🎯 Found ${recommendations.length} recommendations for Backend Developer`);

    if (recommendations.length > 0) {
      const topRecommendation = recommendations[0];
      console.log(`📌 Top recommendation: ${topRecommendation.id} - ${topRecommendation.title}`);
      console.log(`   Score: ${topRecommendation.recommendation_score}, Reason: ${topRecommendation.recommendation_reason}`);
    }

    // Simulate starting work on critical tasks
    this.tm.setCurrentAgent('backend-dev');
    console.log('\n🤖 Backend Developer starting work...');

    const myTasks = this.tm.getMyTasks({ status: 'todo' });
    const criticalTasks = myTasks.filter(t => t.priority === 'critical');

    if (criticalTasks.length > 0) {
      const taskToStart = criticalTasks[0];
      this.tm.startTask(taskToStart.id);
      console.log(`⚡ Started: ${taskToStart.title}`);

      // Simulate work progress (complete after a short time)
      setTimeout(() => {
        try {
          this.tm.completeTask(taskToStart.id);
          console.log(`✅ Completed: ${taskToStart.title}`);
        } catch (error) {
          console.log(`⚠️  Could not complete task: ${error.message}`);
        }
      }, 1000);
    }

    // Show multiple agent perspectives
    const agentPerspectives = ['frontend-dev', 'devops-engineer', 'qa-tester'];

    console.log('\n👥 Multi-agent perspectives:');
    agentPerspectives.forEach(agentId => {
      try {
        this.tm.setCurrentAgent(agentId);
        const agent = this.tm.getCurrentAgent();
        const workload = this.tm.getMyWorkload();

        console.log(`   ${agent.name}: ${workload.workload.active_tasks} active, ${workload.workload.completed_tasks} completed`);
      } catch (error) {
        console.log(`   ${agentId}: Not available`);
      }
    });
  }

  async step5_AutomatedAgents() {
    console.log('\n🤖 STEP 5: Automated Agent Bot Demonstration');
    console.log('━'.repeat(40));

    // Set up automated agents
    const automatedAgents = [
      {
        agentId: 'frontend-dev',
        config: {
          dataDir: this.showcaseDir,
          agentId: 'frontend-dev',
          maxConcurrentTasks: 3,
          autoAssign: true,
          autoStart: true,
          capabilities: ['coding', 'testing', 'design'],
          verbose: false
        }
      },
      {
        agentId: 'qa-tester',
        config: {
          dataDir: this.showcaseDir,
          agentId: 'qa-tester',
          maxConcurrentTasks: 2,
          autoAssign: true,
          autoStart: true,
          capabilities: ['testing', 'documentation'],
          verbose: false
        }
      }
    ];

    console.log('🚀 Starting automated agent bots...');

    const botPromises = automatedAgents.map(async ({ agentId, config }) => {
      try {
        const bot = new AgentBot(config);
        console.log(`🤖 ${agentId} bot: Running automated cycle...`);

        const result = await bot.runCycle();

        console.log(`   ✅ ${agentId} cycle complete:`);
        console.log(`      New assignments: ${result.newTasks.length}`);
        console.log(`      Started tasks: ${result.startedTasks.length}`);
        console.log(`      Active tasks: ${result.checkIn.status.active_tasks}`);

        return { agentId, result };
      } catch (error) {
        console.log(`   ❌ ${agentId} bot failed: ${error.message}`);
        return { agentId, error: error.message };
      }
    });

    const botResults = await Promise.all(botPromises);

    console.log('\n📊 Automated bot results summary:');
    botResults.forEach(({ agentId, result, error }) => {
      if (error) {
        console.log(`   ${agentId}: Failed - ${error}`);
      } else {
        console.log(`   ${agentId}: ${result.startedTasks.length} tasks started, ${result.checkIn.status.active_tasks} active`);
      }
    });
  }

  async step6_ProjectProgress() {
    console.log('\n📈 STEP 6: Project Progress and Metrics');
    console.log('━'.repeat(40));

    // Wait a moment for any async operations to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate comprehensive project status
    const status = this.tm.getProjectStatus();

    console.log('📊 Current Project Metrics:');
    console.log(`   Overall Progress: ${status.progress.completion_percentage}%`);
    console.log(`   Tasks Completed: ${status.progress.completed}/${status.progress.total_tasks}`);
    console.log(`   Active Tasks: ${status.tasks.by_status.in_progress}`);
    console.log(`   Todo Tasks: ${status.tasks.by_status.todo}`);
    console.log(`   Blocked Tasks: ${status.tasks.by_status.blocked}`);

    console.log('\n🎯 Priority Breakdown:');
    console.log(`   Critical: ${status.tasks.by_priority.critical} tasks`);
    console.log(`   High: ${status.tasks.by_priority.high} tasks`);
    console.log(`   Medium: ${status.tasks.by_priority.medium} tasks`);
    console.log(`   Low: ${status.tasks.by_priority.low} tasks`);

    console.log('\n👥 Team Performance:');
    const agents = this.tm.listAgents();
    agents.forEach(agent => {
      try {
        const workload = this.tm.getAgentWorkload(agent.id);
        const efficiency = workload.workload.completed_tasks > 0 ?
          Math.round((workload.workload.completed_tasks / (workload.workload.completed_tasks + workload.workload.active_tasks)) * 100) : 0;

        console.log(`   ${agent.name}: ${efficiency}% efficiency (${workload.workload.completed_tasks} completed, ${workload.workload.active_tasks} active)`);
      } catch (error) {
        console.log(`   ${agent.name}: Metrics unavailable`);
      }
    });

    // Identify bottlenecks
    console.log('\n🚧 Potential Bottlenecks:');
    const blockedTasks = this.tm.listTasks({ status: 'blocked' });
    const overloadedAgents = agents.filter(agent => {
      try {
        const workload = this.tm.getAgentWorkload(agent.id);
        return workload.workload.active_tasks > 3;
      } catch {
        return false;
      }
    });

    if (blockedTasks.length > 0) {
      console.log(`   ⚠️  ${blockedTasks.length} blocked tasks need attention`);
    }

    if (overloadedAgents.length > 0) {
      console.log(`   ⚠️  ${overloadedAgents.length} agents are overloaded`);
      overloadedAgents.forEach(agent => {
        const workload = this.tm.getAgentWorkload(agent.id);
        console.log(`      ${agent.name}: ${workload.workload.active_tasks} active tasks`);
      });
    }

    if (blockedTasks.length === 0 && overloadedAgents.length === 0) {
      console.log('   ✅ No bottlenecks detected - healthy workflow');
    }
  }

  async step7_ReportsAndAnalytics() {
    console.log('\n📋 STEP 7: Reports and Analytics');
    console.log('━'.repeat(40));

    // Generate comprehensive project report
    const reportData = {
      timestamp: new Date().toISOString(),
      project: this.tm.taskTracker.project,
      summary: this.tm.getProjectStatus(),
      detailed_metrics: {
        task_distribution: this.getTaskDistribution(),
        agent_performance: this.getAgentPerformance(),
        workflow_health: this.getWorkflowHealth(),
        recommendations: this.getProjectRecommendations()
      }
    };

    // Save report to file
    const reportPath = path.join(this.showcaseDir, 'project-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

    console.log('📊 Generated Comprehensive Report:');
    console.log(`   File: ${reportPath}`);
    console.log(`   Report includes:`);
    console.log(`      📈 Project progress metrics`);
    console.log(`      👥 Agent performance analysis`);
    console.log(`      🔄 Workflow health indicators`);
    console.log(`      💡 Strategic recommendations`);

    // Display key insights
    console.log('\n💡 Key Insights:');
    const insights = this.generateInsights(reportData);
    insights.forEach((insight, index) => {
      console.log(`   ${index + 1}. ${insight}`);
    });

    // Export data for external use
    const exportData = {
      tasks: Object.values(this.tm.taskTracker.tasks),
      agents: Object.values(this.tm.agents.registry),
      project: this.tm.taskTracker.project,
      timestamp: new Date().toISOString()
    };

    const exportPath = path.join(this.showcaseDir, 'data-export.json');
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    console.log(`📤 Data exported to: ${exportPath}`);
  }

  getTaskDistribution() {
    const tasks = Object.values(this.tm.taskTracker.tasks);
    return {
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
      },
      by_category: tasks.reduce((acc, task) => {
        acc[task.category] = (acc[task.category] || 0) + 1;
        return acc;
      }, {})
    };
  }

  getAgentPerformance() {
    const agents = Object.values(this.tm.agents.registry);
    return agents.map(agent => {
      try {
        const workload = this.tm.getAgentWorkload(agent.id);
        return {
          id: agent.id,
          name: agent.name,
          type: agent.type,
          capabilities: agent.capabilities,
          workload: workload.workload,
          efficiency: workload.workload.completed_tasks > 0 ?
            Math.round((workload.workload.completed_tasks / (workload.workload.completed_tasks + workload.workload.active_tasks)) * 100) : 0
        };
      } catch (error) {
        return {
          id: agent.id,
          name: agent.name,
          type: agent.type,
          error: error.message
        };
      }
    });
  }

  getWorkflowHealth() {
    const tasks = Object.values(this.tm.taskTracker.tasks);
    const agents = Object.values(this.tm.agents.registry);

    const blockedTasks = tasks.filter(t => t.status === 'blocked').length;
    const overdueTasks = 0; // Would need due dates to calculate
    const unassignedTasks = tasks.filter(t => !t.assignees || t.assignees.length === 0).length;

    const overloadedAgents = agents.filter(agent => {
      try {
        const workload = this.tm.getAgentWorkload(agent.id);
        return workload.workload.active_tasks > 3;
      } catch {
        return false;
      }
    }).length;

    return {
      blocked_tasks: blockedTasks,
      overdue_tasks: overdueTasks,
      unassigned_tasks: unassignedTasks,
      overloaded_agents: overloadedAgents,
      health_score: Math.max(0, 100 - (blockedTasks * 10) - (unassignedTasks * 5) - (overloadedAgents * 15))
    };
  }

  getProjectRecommendations() {
    const health = this.getWorkflowHealth();
    const recommendations = [];

    if (health.blocked_tasks > 0) {
      recommendations.push(`Address ${health.blocked_tasks} blocked tasks to improve workflow`);
    }

    if (health.unassigned_tasks > 0) {
      recommendations.push(`Assign ${health.unassigned_tasks} unassigned tasks to appropriate agents`);
    }

    if (health.overloaded_agents > 0) {
      recommendations.push(`Rebalance workload for ${health.overloaded_agents} overloaded agents`);
    }

    if (health.health_score < 70) {
      recommendations.push('Consider adding more agents or adjusting task priorities');
    }

    if (recommendations.length === 0) {
      recommendations.push('Project workflow is healthy - continue current approach');
    }

    return recommendations;
  }

  generateInsights(reportData) {
    const insights = [];
    const summary = reportData.summary;
    const health = reportData.detailed_metrics.workflow_health;

    // Progress insights
    if (summary.progress.completion_percentage < 10) {
      insights.push('Project is in early stages - focus on foundation tasks');
    } else if (summary.progress.completion_percentage > 80) {
      insights.push('Project is nearing completion - prioritize testing and deployment');
    } else {
      insights.push('Project is in active development phase');
    }

    // Team insights
    const aiAgents = summary.agents.by_type.ai;
    const humanAgents = summary.agents.by_type.human;
    insights.push(`Team composition: ${aiAgents} AI agents and ${humanAgents} human agents providing good automation balance`);

    // Priority insights
    if (summary.tasks.by_priority.critical > 0) {
      insights.push(`${summary.tasks.by_priority.critical} critical tasks require immediate attention`);
    }

    // Health insights
    if (health.health_score > 80) {
      insights.push('Workflow health is excellent - well-balanced team and task distribution');
    } else if (health.health_score > 60) {
      insights.push('Workflow health is good with minor optimization opportunities');
    } else {
      insights.push('Workflow health needs attention - consider rebalancing resources');
    }

    return insights;
  }

  printNextSteps() {
    console.log('\n🎯 NEXT STEPS & PRACTICAL USAGE:');
    console.log('━'.repeat(40));

    console.log('\n1. 🤖 Agent Development Workflow:');
    console.log('   export TASK_MANAGER_AGENT_ID=your-agent-id');
    console.log('   export TASK_MANAGER_DATA_DIR=./your-project-data');
    console.log('   node task-manager.js my-tasks');
    console.log('   node task-manager.js check-in');

    console.log('\n2. 🏗️  Project Setup:');
    console.log('   node project-templates.js create webapp --name "Your Project"');
    console.log('   node task-manager.js agents add');
    console.log('   node task-manager.js status');

    console.log('\n3. 🔄 Automated Workflows:');
    console.log('   node agent-bot.js --once --verbose');
    console.log('   node agent-bot.js --max-tasks=3 --interval=60000');

    console.log('\n4. 📊 Monitoring & Reports:');
    console.log('   node task-manager.js status');
    console.log('   node task-manager.js export');
    console.log('   node agent-bot.js --report');

    console.log('\n5. 🔧 Integration Examples:');
    console.log('   # In your AI agent script:');
    console.log('   const TaskManager = require("./task-manager.js");');
    console.log('   const tm = new TaskManager({ agentId: "my-agent" });');
    console.log('   const tasks = tm.getMyRecommendations();');

    console.log('\n6. 📁 Files Created:');
    console.log(`   ${this.showcaseDir}/task-tracker.json - Main project data`);
    console.log(`   ${this.showcaseDir}/agents.json - Agent registry`);
    console.log(`   ${this.showcaseDir}/project-report.json - Analytics report`);
    console.log(`   ${this.showcaseDir}/data-export.json - Exportable data`);

    console.log('\n🌟 The TaskManager system is now ready for production use!');
    console.log('   Customize agents, tasks, and workflows for your specific needs.');
  }
}

// ==================== MAIN EXECUTION ====================

async function runShowcase() {
  console.log('🎭 TaskManager Complete Workflow Showcase');
  console.log('This demonstration will show you the full capabilities of the system\n');

  try {
    const showcase = new WorkflowShowcase();
    await showcase.runCompleteWorkflow();
  } catch (error) {
    console.error('\n💥 Showcase failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Export for use as module
module.exports = { WorkflowShowcase };

// Run showcase if called directly
if (require.main === module) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log('🎭 Complete Workflow Showcase');
    console.log('');
    console.log('This script demonstrates the entire TaskManager system workflow:');
    console.log('');
    console.log('• Project initialization from templates');
    console.log('• Multi-agent setup and configuration');
    console.log('• Complex task creation with dependencies');
    console.log('• Manual workflow simulation');
    console.log('• Automated agent bot operations');
    console.log('• Progress tracking and metrics');
    console.log('• Comprehensive reporting and analytics');
    console.log('');
    console.log('Usage:');
    console.log('  node complete-workflow-showcase.js');
    console.log('');
    console.log('Output:');
    console.log('  ./showcase-data/ - Complete project with all data files');
    console.log('  Comprehensive demonstration of all system features');
  } else {
    runShowcase();
  }
}
