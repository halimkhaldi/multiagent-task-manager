#!/usr/bin/env node

/**
 * Project Templates - Pre-configured project setups
 *
 * This module provides ready-to-use project templates for common development scenarios.
 * Templates include pre-defined tasks, phases, and agent configurations.
 */

const TaskManager = require('./task-manager.js');

class ProjectTemplates {
  constructor(taskManager) {
    this.tm = taskManager || new TaskManager();
  }

  // ==================== WEB APPLICATION TEMPLATE ====================

  createWebAppProject(options = {}) {
    const config = {
      name: options.name || 'Web Application Project',
      description: options.description || 'Full-stack web application development',
      tech_stack: options.tech_stack || ['React', 'Node.js', 'PostgreSQL'],
      team_size: options.team_size || 'small',
      ...options
    };

    console.log(`🌐 Creating Web App Project: ${config.name}`);

    // Update project info
    if (this.tm.taskTracker && this.tm.taskTracker.project) {
      this.tm.taskTracker.project.name = config.name;
      this.tm.taskTracker.project.description = config.description;
    }

    // Add recommended agents
    const agents = this.getWebAppAgents(config.team_size);
    agents.forEach(agent => {
      try {
        this.tm.addAgent(agent);
      } catch (error) {
        console.log(`   Agent ${agent.id} already exists`);
      }
    });

    // Create phases
    const phases = this.getWebAppPhases();
    if (this.tm.taskTracker && this.tm.taskTracker.phases) {
      phases.forEach(phase => {
        this.tm.taskTracker.phases[phase.id] = phase;
      });
    }

    // Create tasks
    const tasks = this.getWebAppTasks(config);
    tasks.forEach(taskData => {
      this.tm.createTask(taskData);
    });

    this.tm.saveData();
    console.log(`✅ Web App Project created with ${tasks.length} tasks and ${agents.length} agents`);

    return {
      project: config,
      agents: agents.length,
      tasks: tasks.length,
      phases: phases.length
    };
  }

  getWebAppAgents(teamSize) {
    const baseAgents = [
      {
        id: 'frontend-dev',
        name: 'Frontend Developer',
        type: 'ai',
        capabilities: ['coding', 'testing', 'design']
      },
      {
        id: 'backend-dev',
        name: 'Backend Developer',
        type: 'ai',
        capabilities: ['coding', 'testing', 'database']
      },
      {
        id: 'qa-tester',
        name: 'QA Tester',
        type: 'ai',
        capabilities: ['testing', 'documentation']
      }
    ];

    if (teamSize === 'large') {
      baseAgents.push(
        {
          id: 'devops-engineer',
          name: 'DevOps Engineer',
          type: 'ai',
          capabilities: ['deployment', 'monitoring', 'security']
        },
        {
          id: 'ui-designer',
          name: 'UI Designer',
          type: 'ai',
          capabilities: ['design', 'documentation']
        }
      );
    }

    baseAgents.push({
      id: 'tech-lead',
      name: 'Tech Lead',
      type: 'human',
      capabilities: ['all']
    });

    return baseAgents;
  }

  getWebAppPhases() {
    return [
      {
        id: 'phase-1',
        name: 'Project Setup',
        status: 'active',
        priority: 'high',
        completion_percentage: 0,
        tasks: [],
        dependencies: [],
        deliverables: ['Project structure', 'Development environment', 'CI/CD pipeline']
      },
      {
        id: 'phase-2',
        name: 'Backend Development',
        status: 'todo',
        priority: 'high',
        completion_percentage: 0,
        tasks: [],
        dependencies: ['phase-1'],
        deliverables: ['API endpoints', 'Database schema', 'Authentication']
      },
      {
        id: 'phase-3',
        name: 'Frontend Development',
        status: 'todo',
        priority: 'high',
        completion_percentage: 0,
        tasks: [],
        dependencies: ['phase-2'],
        deliverables: ['User interface', 'API integration', 'Responsive design']
      },
      {
        id: 'phase-4',
        name: 'Testing & QA',
        status: 'todo',
        priority: 'medium',
        completion_percentage: 0,
        tasks: [],
        dependencies: ['phase-3'],
        deliverables: ['Test suite', 'Performance tests', 'Security audit']
      },
      {
        id: 'phase-5',
        name: 'Deployment',
        status: 'todo',
        priority: 'medium',
        completion_percentage: 0,
        tasks: [],
        dependencies: ['phase-4'],
        deliverables: ['Production deployment', 'Monitoring setup', 'Documentation']
      }
    ];
  }

  getWebAppTasks(config) {
    return [
      // Phase 1: Project Setup
      {
        title: 'Initialize project structure',
        category: 'setup',
        phase: 'phase-1',
        priority: 'critical',
        assignees: ['backend-dev'],
        completion_criteria: [
          'Create project directories',
          'Setup package.json',
          'Configure build tools',
          'Initialize git repository'
        ]
      },
      {
        title: 'Setup development environment',
        category: 'setup',
        phase: 'phase-1',
        priority: 'high',
        assignees: ['backend-dev'],
        completion_criteria: [
          'Install dependencies',
          'Configure environment variables',
          'Setup database connection',
          'Verify local development works'
        ]
      },
      {
        title: 'Configure CI/CD pipeline',
        category: 'devops',
        phase: 'phase-1',
        priority: 'high',
        assignees: ['devops-engineer'],
        completion_criteria: [
          'Setup GitHub Actions',
          'Configure automated testing',
          'Setup deployment pipeline',
          'Configure environment promotions'
        ]
      },

      // Phase 2: Backend Development
      {
        title: 'Design database schema',
        category: 'database',
        phase: 'phase-2',
        priority: 'critical',
        assignees: ['backend-dev'],
        dependencies: ['TASK-001'],
        completion_criteria: [
          'Create entity relationship diagram',
          'Define table structures',
          'Plan indexes and constraints',
          'Create migration scripts'
        ]
      },
      {
        title: 'Implement user authentication',
        category: 'coding',
        phase: 'phase-2',
        priority: 'high',
        assignees: ['backend-dev'],
        dependencies: ['TASK-004'],
        completion_criteria: [
          'JWT token implementation',
          'Password hashing',
          'Login/logout endpoints',
          'Authentication middleware'
        ]
      },
      {
        title: 'Create REST API endpoints',
        category: 'coding',
        phase: 'phase-2',
        priority: 'high',
        assignees: ['backend-dev'],
        dependencies: ['TASK-005'],
        completion_criteria: [
          'CRUD operations for main entities',
          'Input validation',
          'Error handling',
          'API documentation'
        ]
      },

      // Phase 3: Frontend Development
      {
        title: 'Setup frontend framework',
        category: 'coding',
        phase: 'phase-3',
        priority: 'high',
        assignees: ['frontend-dev'],
        dependencies: ['TASK-002'],
        completion_criteria: [
          'Initialize React project',
          'Setup routing',
          'Configure state management',
          'Setup UI component library'
        ]
      },
      {
        title: 'Implement user interface components',
        category: 'coding',
        phase: 'phase-3',
        priority: 'high',
        assignees: ['frontend-dev'],
        dependencies: ['TASK-007'],
        completion_criteria: [
          'Create reusable components',
          'Implement forms',
          'Add navigation',
          'Responsive design'
        ]
      },
      {
        title: 'Integrate with backend API',
        category: 'coding',
        phase: 'phase-3',
        priority: 'high',
        assignees: ['frontend-dev'],
        dependencies: ['TASK-006', 'TASK-008'],
        completion_criteria: [
          'API client setup',
          'Authentication integration',
          'Data fetching and display',
          'Error handling'
        ]
      },

      // Phase 4: Testing & QA
      {
        title: 'Write unit tests',
        category: 'testing',
        phase: 'phase-4',
        priority: 'medium',
        assignees: ['qa-tester'],
        dependencies: ['TASK-006', 'TASK-009'],
        completion_criteria: [
          'Backend API tests',
          'Frontend component tests',
          'Achieve 80% code coverage',
          'Setup test automation'
        ]
      },
      {
        title: 'Perform integration testing',
        category: 'testing',
        phase: 'phase-4',
        priority: 'medium',
        assignees: ['qa-tester'],
        dependencies: ['TASK-010'],
        completion_criteria: [
          'End-to-end test scenarios',
          'API integration tests',
          'User workflow testing',
          'Performance testing'
        ]
      },

      // Phase 5: Deployment
      {
        title: 'Deploy to production',
        category: 'deployment',
        phase: 'phase-5',
        priority: 'high',
        assignees: ['devops-engineer'],
        dependencies: ['TASK-011'],
        completion_criteria: [
          'Production environment setup',
          'Database migration',
          'Application deployment',
          'SSL certificate setup'
        ]
      },
      {
        title: 'Setup monitoring and logging',
        category: 'monitoring',
        phase: 'phase-5',
        priority: 'medium',
        assignees: ['devops-engineer'],
        dependencies: ['TASK-012'],
        completion_criteria: [
          'Application monitoring',
          'Error tracking',
          'Performance monitoring',
          'Alerting setup'
        ]
      }
    ];
  }

  // ==================== API PROJECT TEMPLATE ====================

  createApiProject(options = {}) {
    const config = {
      name: options.name || 'REST API Project',
      description: options.description || 'Backend API development',
      api_type: options.api_type || 'REST',
      database: options.database || 'PostgreSQL',
      ...options
    };

    console.log(`🔌 Creating API Project: ${config.name}`);

    if (this.tm.taskTracker && this.tm.taskTracker.project) {
      this.tm.taskTracker.project.name = config.name;
      this.tm.taskTracker.project.description = config.description;
    }

    // Add API-focused agents
    const agents = [
      {
        id: 'api-developer',
        name: 'API Developer',
        type: 'ai',
        capabilities: ['coding', 'testing', 'database', 'documentation']
      },
      {
        id: 'qa-engineer',
        name: 'QA Engineer',
        type: 'ai',
        capabilities: ['testing', 'security', 'performance']
      },
      {
        id: 'tech-architect',
        name: 'Technical Architect',
        type: 'human',
        capabilities: ['all']
      }
    ];

    agents.forEach(agent => {
      try {
        this.tm.addAgent(agent);
      } catch (error) {
        console.log(`   Agent ${agent.id} already exists`);
      }
    });

    // Create API-specific tasks
    const tasks = this.getApiTasks(config);
    tasks.forEach(taskData => {
      this.tm.createTask(taskData);
    });

    this.tm.saveData();
    console.log(`✅ API Project created with ${tasks.length} tasks and ${agents.length} agents`);

    return {
      project: config,
      agents: agents.length,
      tasks: tasks.length
    };
  }

  getApiTasks(config) {
    return [
      {
        title: 'Design API architecture',
        category: 'architecture',
        priority: 'critical',
        assignees: ['tech-architect'],
        completion_criteria: [
          'Define API endpoints',
          'Design data models',
          'Plan authentication strategy',
          'Document API specification'
        ]
      },
      {
        title: 'Setup project foundation',
        category: 'setup',
        priority: 'high',
        assignees: ['api-developer'],
        dependencies: ['TASK-001'],
        completion_criteria: [
          'Initialize project structure',
          'Setup framework and dependencies',
          'Configure database connection',
          'Setup development environment'
        ]
      },
      {
        title: 'Implement core API endpoints',
        category: 'coding',
        priority: 'high',
        assignees: ['api-developer'],
        dependencies: ['TASK-002'],
        completion_criteria: [
          'CRUD operations',
          'Input validation',
          'Error handling',
          'Response formatting'
        ]
      },
      {
        title: 'Add authentication & authorization',
        category: 'security',
        priority: 'critical',
        assignees: ['api-developer'],
        dependencies: ['TASK-003'],
        completion_criteria: [
          'JWT authentication',
          'Role-based access control',
          'API key management',
          'Security middleware'
        ]
      },
      {
        title: 'Write comprehensive tests',
        category: 'testing',
        priority: 'high',
        assignees: ['qa-engineer'],
        dependencies: ['TASK-004'],
        completion_criteria: [
          'Unit tests for all endpoints',
          'Integration tests',
          'Performance tests',
          'Security tests'
        ]
      },
      {
        title: 'Create API documentation',
        category: 'documentation',
        priority: 'medium',
        assignees: ['api-developer'],
        dependencies: ['TASK-003'],
        completion_criteria: [
          'OpenAPI specification',
          'Interactive documentation',
          'Usage examples',
          'SDKs or client libraries'
        ]
      }
    ];
  }

  // ==================== MOBILE APP TEMPLATE ====================

  createMobileAppProject(options = {}) {
    const config = {
      name: options.name || 'Mobile Application Project',
      description: options.description || 'Cross-platform mobile app development',
      platform: options.platform || 'React Native',
      target_platforms: options.target_platforms || ['iOS', 'Android'],
      ...options
    };

    console.log(`📱 Creating Mobile App Project: ${config.name}`);

    if (this.tm.taskTracker && this.tm.taskTracker.project) {
      this.tm.taskTracker.project.name = config.name;
      this.tm.taskTracker.project.description = config.description;
    }

    const agents = [
      {
        id: 'mobile-developer',
        name: 'Mobile Developer',
        type: 'ai',
        capabilities: ['coding', 'testing', 'mobile-design']
      },
      {
        id: 'ui-ux-designer',
        name: 'UI/UX Designer',
        type: 'ai',
        capabilities: ['design', 'prototyping', 'user-research']
      },
      {
        id: 'mobile-tester',
        name: 'Mobile QA Tester',
        type: 'ai',
        capabilities: ['testing', 'device-testing', 'performance']
      },
      {
        id: 'product-owner',
        name: 'Product Owner',
        type: 'human',
        capabilities: ['all']
      }
    ];

    agents.forEach(agent => {
      try {
        this.tm.addAgent(agent);
      } catch (error) {
        console.log(`   Agent ${agent.id} already exists`);
      }
    });

    const tasks = this.getMobileAppTasks(config);
    tasks.forEach(taskData => {
      this.tm.createTask(taskData);
    });

    this.tm.saveData();
    console.log(`✅ Mobile App Project created with ${tasks.length} tasks and ${agents.length} agents`);

    return {
      project: config,
      agents: agents.length,
      tasks: tasks.length
    };
  }

  getMobileAppTasks(config) {
    return [
      {
        title: 'Design app wireframes and mockups',
        category: 'design',
        priority: 'high',
        assignees: ['ui-ux-designer'],
        completion_criteria: [
          'User journey mapping',
          'Wireframe creation',
          'High-fidelity mockups',
          'Design system creation'
        ]
      },
      {
        title: 'Setup mobile development environment',
        category: 'setup',
        priority: 'critical',
        assignees: ['mobile-developer'],
        completion_criteria: [
          'React Native project initialization',
          'Development environment setup',
          'Simulator/emulator configuration',
          'Build pipeline setup'
        ]
      },
      {
        title: 'Implement core app navigation',
        category: 'coding',
        priority: 'high',
        assignees: ['mobile-developer'],
        dependencies: ['TASK-001', 'TASK-002'],
        completion_criteria: [
          'Navigation structure',
          'Screen transitions',
          'Tab navigation',
          'Stack navigation'
        ]
      },
      {
        title: 'Build user interface components',
        category: 'coding',
        priority: 'high',
        assignees: ['mobile-developer'],
        dependencies: ['TASK-003'],
        completion_criteria: [
          'Reusable UI components',
          'Form components',
          'List components',
          'Custom animations'
        ]
      },
      {
        title: 'Integrate with backend services',
        category: 'integration',
        priority: 'high',
        assignees: ['mobile-developer'],
        dependencies: ['TASK-004'],
        completion_criteria: [
          'API client setup',
          'Data synchronization',
          'Offline data handling',
          'Push notifications'
        ]
      },
      {
        title: 'Perform device testing',
        category: 'testing',
        priority: 'medium',
        assignees: ['mobile-tester'],
        dependencies: ['TASK-005'],
        completion_criteria: [
          'Testing on multiple devices',
          'Performance testing',
          'Battery usage optimization',
          'Network condition testing'
        ]
      },
      {
        title: 'Prepare for app store submission',
        category: 'deployment',
        priority: 'medium',
        assignees: ['mobile-developer'],
        dependencies: ['TASK-006'],
        completion_criteria: [
          'App store assets',
          'Release builds',
          'App store listings',
          'Compliance checks'
        ]
      }
    ];
  }

  // ==================== MICROSERVICES TEMPLATE ====================

  createMicroservicesProject(options = {}) {
    const config = {
      name: options.name || 'Microservices Architecture Project',
      description: options.description || 'Distributed microservices system',
      services_count: options.services_count || 3,
      orchestration: options.orchestration || 'Kubernetes',
      ...options
    };

    console.log(`🔧 Creating Microservices Project: ${config.name}`);

    if (this.tm.taskTracker && this.tm.taskTracker.project) {
      this.tm.taskTracker.project.name = config.name;
      this.tm.taskTracker.project.description = config.description;
    }

    const agents = [
      {
        id: 'backend-architect',
        name: 'Backend Architect',
        type: 'human',
        capabilities: ['architecture', 'coding', 'system-design']
      },
      {
        id: 'service-developer',
        name: 'Service Developer',
        type: 'ai',
        capabilities: ['coding', 'testing', 'microservices']
      },
      {
        id: 'devops-specialist',
        name: 'DevOps Specialist',
        type: 'ai',
        capabilities: ['deployment', 'monitoring', 'kubernetes', 'docker']
      },
      {
        id: 'reliability-engineer',
        name: 'Site Reliability Engineer',
        type: 'ai',
        capabilities: ['monitoring', 'performance', 'incident-response']
      }
    ];

    agents.forEach(agent => {
      try {
        this.tm.addAgent(agent);
      } catch (error) {
        console.log(`   Agent ${agent.id} already exists`);
      }
    });

    const tasks = this.getMicroservicesTasks(config);
    tasks.forEach(taskData => {
      this.tm.createTask(taskData);
    });

    this.tm.saveData();
    console.log(`✅ Microservices Project created with ${tasks.length} tasks and ${agents.length} agents`);

    return {
      project: config,
      agents: agents.length,
      tasks: tasks.length
    };
  }

  getMicroservicesTasks(config) {
    return [
      {
        title: 'Design microservices architecture',
        category: 'architecture',
        priority: 'critical',
        assignees: ['backend-architect'],
        completion_criteria: [
          'Service boundaries definition',
          'Communication patterns',
          'Data consistency strategy',
          'Architecture documentation'
        ]
      },
      {
        title: 'Setup container infrastructure',
        category: 'infrastructure',
        priority: 'high',
        assignees: ['devops-specialist'],
        dependencies: ['TASK-001'],
        completion_criteria: [
          'Docker containerization',
          'Kubernetes cluster setup',
          'Service mesh configuration',
          'Container registry setup'
        ]
      },
      {
        title: 'Implement core services',
        category: 'coding',
        priority: 'high',
        assignees: ['service-developer'],
        dependencies: ['TASK-002'],
        completion_criteria: [
          'User service implementation',
          'Order service implementation',
          'Inventory service implementation',
          'Service-to-service communication'
        ]
      },
      {
        title: 'Setup API gateway',
        category: 'infrastructure',
        priority: 'high',
        assignees: ['devops-specialist'],
        dependencies: ['TASK-003'],
        completion_criteria: [
          'Gateway configuration',
          'Route management',
          'Load balancing',
          'Rate limiting'
        ]
      },
      {
        title: 'Implement distributed monitoring',
        category: 'monitoring',
        priority: 'high',
        assignees: ['reliability-engineer'],
        dependencies: ['TASK-003'],
        completion_criteria: [
          'Distributed tracing',
          'Centralized logging',
          'Metrics collection',
          'Alerting setup'
        ]
      },
      {
        title: 'Setup CI/CD pipelines',
        category: 'devops',
        priority: 'medium',
        assignees: ['devops-specialist'],
        dependencies: ['TASK-004'],
        completion_criteria: [
          'Automated testing',
          'Containerized deployments',
          'Blue-green deployments',
          'Rollback strategies'
        ]
      }
    ];
  }

  // ==================== TEMPLATE UTILITIES ====================

  listTemplates() {
    return [
      {
        id: 'webapp',
        name: 'Web Application',
        description: 'Full-stack web application with frontend and backend',
        agents: 4,
        tasks: 13,
        phases: 5
      },
      {
        id: 'api',
        name: 'REST API',
        description: 'Backend API development project',
        agents: 3,
        tasks: 6,
        phases: 3
      },
      {
        id: 'mobile',
        name: 'Mobile Application',
        description: 'Cross-platform mobile app development',
        agents: 4,
        tasks: 7,
        phases: 4
      },
      {
        id: 'microservices',
        name: 'Microservices',
        description: 'Distributed microservices architecture',
        agents: 4,
        tasks: 6,
        phases: 3
      }
    ];
  }

  createFromTemplate(templateId, options = {}) {
    switch (templateId) {
      case 'webapp':
        return this.createWebAppProject(options);
      case 'api':
        return this.createApiProject(options);
      case 'mobile':
        return this.createMobileAppProject(options);
      case 'microservices':
        return this.createMicroservicesProject(options);
      default:
        throw new Error(`Unknown template: ${templateId}`);
    }
  }
}

// ==================== CLI INTERFACE ====================

function cli() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log('🏗️  Project Templates CLI\n');
    console.log('Commands:');
    console.log('  list                          - List available templates');
    console.log('  create <template> [options]   - Create project from template');
    console.log('  info <template>               - Show template information');
    console.log('\nTemplates:');
    console.log('  webapp        - Web Application');
    console.log('  api           - REST API');
    console.log('  mobile        - Mobile Application');
    console.log('  microservices - Microservices Architecture');
    console.log('\nExamples:');
    console.log('  node project-templates.js create webapp --name "My Web App"');
    console.log('  node project-templates.js create api --name "User API"');
    console.log('  node project-templates.js list');
    return;
  }

  const tm = new TaskManager();
  const templates = new ProjectTemplates(tm);

  switch (command) {
    case 'list':
      const templateList = templates.listTemplates();
      console.log('\n📋 Available Project Templates:\n');
      templateList.forEach(template => {
        console.log(`  ${template.id.padEnd(12)} - ${template.name}`);
        console.log(`    ${template.description}`);
        console.log(`    ${template.agents} agents, ${template.tasks} tasks, ${template.phases || 0} phases\n`);
      });
      break;

    case 'create':
      const templateId = args[1];
      if (!templateId) {
        console.error('❌ Template ID required');
        return;
      }

      const options = {};
      for (let i = 2; i < args.length; i += 2) {
        if (args[i].startsWith('--')) {
          const key = args[i].substring(2);
          const value = args[i + 1];
          options[key] = value;
        }
      }

      try {
        const result = templates.createFromTemplate(templateId, options);
        console.log('\n✅ Project created successfully!');
        console.log(`   Name: ${result.project.name}`);
        console.log(`   Agents: ${result.agents}`);
        console.log(`   Tasks: ${result.tasks}`);
        console.log(`   Phases: ${result.phases || 0}`);
        console.log('\nNext steps:');
        console.log('  node task-manager.js agents');
        console.log('  node task-manager.js status');
      } catch (error) {
        console.error('❌', error.message);
      }
      break;

    case 'info':
      const infoTemplateId = args[1];
      if (!infoTemplateId) {
        console.error('❌ Template ID required');
        return;
      }

      const templateList2 = templates.listTemplates();
      const template = templateList2.find(t => t.id === infoTemplateId);

      if (!template) {
        console.error(`❌ Template '${infoTemplateId}' not found`);
        return;
      }

      console.log(`\n📋 Template: ${template.name}\n`);
      console.log(`Description: ${template.description}`);
      console.log(`Agents: ${template.agents}`);
      console.log(`Tasks: ${template.tasks}`);
      console.log(`Phases: ${template.phases}`);
      console.log('\nTo create this project:');
      console.log(`  node project-templates.js create ${template.id} --name "Your Project Name"`);
      break;

    default:
      console.error(`❌ Unknown command: ${command}`);
  }
}

// Export for use as module
module.exports = ProjectTemplates;

// CLI interface when run directly
if (require.main === module) {
  cli();
}
