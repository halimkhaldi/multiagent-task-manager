# TaskManager - Multi-Agent Task Management System

A comprehensive JavaScript package for managing tasks across multiple AI agents and human team members. Features intelligent task recommendations, dependency tracking, workload balancing, and seamless collaboration between different types of agents.

## 🚀 Features

- **Multi-Agent Support**: Manage both AI agents and human team members
- **Intelligent Recommendations**: Smart task suggestions based on capabilities and workload
- **Dependency Management**: Handle complex task dependencies and blocking relationships
- **Workload Balancing**: Track and optimize task distribution across agents
- **Priority & Risk Scoring**: Advanced scoring algorithms for task prioritization
- **CLI Interface**: Command-line tools for quick task management
- **Progress Tracking**: Real-time project progress and completion metrics
- **Export/Import**: Data portability and backup capabilities

## 📦 Installation

```bash
npm install
```

## 🎯 Quick Start

### Programmatic Usage

```javascript
const TaskManager = require('./task-manager.js');

// Initialize
const tm = new TaskManager({ dataDir: './my-project-data' });

// Add agents
tm.addAgent({
  id: 'ai-dev-1',
  name: 'AI Developer',
  type: 'ai',
  capabilities: ['coding', 'testing', 'documentation']
});

tm.addAgent({
  id: 'john.doe',
  name: 'John Doe',
  type: 'human',
  capabilities: ['all']
});

// Create tasks
const task = tm.createTask({
  title: 'Implement user authentication',
  category: 'coding',
  priority: 'high',
  assignees: ['ai-dev-1'],
  completion_criteria: [
    'JWT token generation',
    'Login endpoint',
    'Authentication middleware'
  ]
});

// Get recommendations
const recommendations = tm.getRecommendationsForAgent('ai-dev-1');
console.log('Recommended tasks:', recommendations);
```

### CLI Usage

```bash
# Initialize a new project
node task-manager.js init

# List all agents
node task-manager.js agents

# Create a new task
node task-manager.js create --title "Fix bug" --priority high --assign ai-dev-1

# Get recommendations for an agent
node task-manager.js recommend --agent ai-dev-1

# List tasks with filters
node task-manager.js list --agent ai-dev-1 --status todo

# Update task status
node task-manager.js update TASK-001 --status completed

# Show project status
node task-manager.js status
```

## 🤖 Agent Management

### Agent Types

- **AI Agents**: Automated agents with specific capabilities
- **Human Agents**: Human team members with full or specialized capabilities

### Agent Structure

```javascript
{
  id: 'agent-1',
  name: 'Code Assistant',
  type: 'ai', // 'ai' or 'human'
  capabilities: ['coding', 'testing', 'documentation'],
  status: 'active',
  workload: {
    active_tasks: 2,
    completed_tasks: 5,
    total_score: 47
  }
}
```

### Capabilities

- `coding`: Software development tasks
- `testing`: Quality assurance and testing
- `documentation`: Writing and maintaining docs
- `design`: UI/UX and system design
- `analysis`: Data analysis and research
- `all`: Can handle any type of task (typically for humans)

## 📋 Task Management

### Task Structure

```javascript
{
  id: 'TASK-001',
  title: 'Implement user authentication',
  category: 'coding',
  phase: 'phase-1',
  status: 'todo',
  priority: 'high',
  assignees: [
    {
      id: 'agent-1',
      name: 'Code Assistant',
      type: 'ai',
      role: 'primary',
      assigned_date: '2024-01-15T10:00:00.000Z'
    }
  ],
  dependencies: ['TASK-000'],
  blocks: ['TASK-002'],
  completion_criteria: [
    'JWT token generation',
    'Login endpoint',
    'Authentication middleware'
  ],
  recommendation_score: 23,
  risk_level: 'medium'
}
```

### Task Statuses

- `todo`: Ready to start
- `in-progress`: Currently being worked on
- `blocked`: Waiting for dependencies
- `review`: Ready for review
- `completed`: Finished
- `cancelled`: Cancelled

### Priority Levels

- `critical`: Must be done immediately (🔴)
- `high`: Important and urgent (🟠)
- `medium`: Normal priority (🟡)
- `low`: Can be deferred (🟢)

## 🎯 Intelligent Recommendations

The system uses advanced scoring algorithms to recommend the best tasks for each agent:

### Scoring Factors

1. **Priority Score**: Based on task priority level
2. **Dependency Score**: Higher for tasks that block others
3. **Risk Score**: Prioritizes high-risk tasks
4. **Phase Score**: Active phase tasks get higher scores
5. **Capability Match**: Tasks matching agent capabilities

### Getting Recommendations

```javascript
// Get top 3 recommendations for an agent
const recommendations = tm.getRecommendationsForAgent('agent-1', 3);

recommendations.forEach(task => {
  console.log(`${task.id}: ${task.title}`);
  console.log(`Score: ${task.recommendation_score}`);
  console.log(`Reason: ${task.recommendation_reason}`);
});
```

## 🔧 API Reference

### TaskManager Class

#### Constructor
```javascript
new TaskManager(options)
```

Options:
- `dataDir`: Directory for storing data files (default: './tasks-data')
- `maxRecommendations`: Maximum recommendations to return (default: 3)
- `autoSave`: Auto-save changes (default: true)

#### Agent Methods

```javascript
// Add a new agent
addAgent(agentInfo)

// Get agent by ID
getAgent(agentId)

// List all agents
listAgents()

// Update agent
updateAgent(agentId, updates)

// Remove agent
removeAgent(agentId)
```

#### Task Methods

```javascript
// Create a new task
createTask(taskData)

// Update task
updateTask(taskId, updates)

// Delete task
deleteTask(taskId)

// Get task by ID
getTask(taskId)

// List tasks with filters
listTasks(filters)
```

#### Assignment Methods

```javascript
// Assign agent to task
assignAgentToTask(taskId, agentInfo)

// Unassign agent from task
unassignAgentFromTask(taskId, agentId)

// Transfer task between agents
transferTask(taskId, fromAgentId, toAgentInfo)
```

#### Recommendation Methods

```javascript
// Get recommendations for agent
getRecommendationsForAgent(agentId, limit)

// Get eligible tasks for agent
getEligibleTasksForAgent(agentId)
```

#### Reporting Methods

```javascript
// Get project status
getProjectStatus()

// Get agent workload
getAgentWorkload(agentId)
```

## 🖥️ CLI Commands

### Project Management
```bash
# Initialization (smart, won't override existing files)
node task-manager.js init                    # Initialize in ./tasks-data
node task-manager.js init --current          # Initialize in current directory
node task-manager.js init --dir PATH         # Initialize in specific directory

# Status and reporting
node task-manager.js status                  # Show project status
node task-manager.js export                  # Export project data
```

### Agent Management
```bash
node task-manager.js agents                  # List all agents
node task-manager.js agents add              # Add new agent (interactive)
node task-manager.js workload <AGENT_ID>     # Show agent workload
```

### Task Management
```bash
# Create tasks
node task-manager.js create --interactive           # Interactive task creation
node task-manager.js create --title "Task" --priority high --assign agent-1

# List tasks
node task-manager.js list                           # List all tasks
node task-manager.js list --agent agent-1           # Tasks for specific agent
node task-manager.js list --status todo             # Filter by status
node task-manager.js list --priority high           # Filter by priority

# Update tasks
node task-manager.js update TASK-001 --status completed
node task-manager.js update TASK-001 --priority critical
node task-manager.js assign TASK-001 agent-2        # Assign agent to task
```

### Recommendations
```bash
node task-manager.js recommend --agent agent-1      # Get recommendations
```

## 📊 Project Structure

```
tasks/
├── task-manager.js          # Main package file
├── package.json            # Package configuration
├── README.md               # This documentation
├── examples.js             # Usage examples
├── test-demo.js            # Demo script
├── .env.example            # Environment template
└── tasks-data/             # Default data directory (or current dir if --current)
    ├── task-tracker.json   # Task and project data
    ├── agents.json         # Agent registry
    └── README.md           # Usage guide
```

## 🔄 Workflow Examples

### Basic Workflow

1. **Initialize**: Set up the project structure (smart init won't override existing files)
2. **Configure**: Set your agent ID in .env file
3. **Add Agents**: Register AI agents and human team members
4. **Create Tasks**: Define work items with dependencies
5. **Get Recommendations**: Let the system suggest optimal task assignments
6. **Track Progress**: Monitor completion and adjust as needed

### Advanced Workflow

```javascript
// 1. Setup project with multiple agent types
const tm = new TaskManager({ dataDir: './my-project' });

// 2. Add specialized agents
tm.addAgent({
  id: 'backend-ai',
  name: 'Backend AI',
  type: 'ai',
  capabilities: ['coding', 'testing']
});

tm.addAgent({
  id: 'frontend-ai',
  name: 'Frontend AI', 
  type: 'ai',
  capabilities: ['coding', 'design']
});

tm.addAgent({
  id: 'tech-lead',
  name: 'Tech Lead',
  type: 'human',
  capabilities: ['all']
});

// 3. Create task hierarchy with dependencies
const designTask = tm.createTask({
  title: 'System Architecture Design',
  priority: 'critical',
  assignees: ['tech-lead']
});

const backendTask = tm.createTask({
  title: 'API Implementation',
  dependencies: [designTask.id],
  assignees: ['backend-ai']
});

const frontendTask = tm.createTask({
  title: 'UI Implementation',
  dependencies: [backendTask.id],
  assignees: ['frontend-ai']
});

// 4. Monitor and adjust
setInterval(() => {
  const status = tm.getProjectStatus();
  console.log(`Progress: ${status.progress.completion_percentage}%`);
  
  // Get recommendations for available agents
  tm.listAgents().forEach(agent => {
    const recommendations = tm.getRecommendationsForAgent(agent.id);
    if (recommendations.length > 0) {
      console.log(`${agent.name} should work on: ${recommendations[0].title}`);
    }
  });
}, 30000); // Check every 30 seconds
```

## 🧪 Testing & Examples

Run the included examples to see the system in action:

```bash
# Run all examples
node examples.js

# Run demo with sample data
node test-demo.js

# Test CLI with demo data
TASK_MANAGER_DATA_DIR=./demo-data node task-manager.js status
```

## Environment Variables

- `TASK_MANAGER_AGENT_ID`: Your agent identifier for personalized commands
- `TASK_MANAGER_DATA_DIR`: Override default data directory
- `TASK_MANAGER_USE_CURRENT_DIR`: Set to 'true' to use current directory by default

## 📈 Extending the System

### Custom Scoring Algorithms

```javascript
class CustomTaskManager extends TaskManager {
  calculateTaskScore(task) {
    let score = super.calculateTaskScore(task);
    
    // Add custom scoring logic
    if (task.tags && task.tags.includes('urgent')) {
      score += 10;
    }
    
    return score;
  }
}
```

### Custom Agent Capabilities

```javascript
// Add custom capability checking
tm.getRequiredCapabilities = function(task) {
  const capabilities = [];
  
  if (task.title.includes('ML') || task.title.includes('AI')) {
    capabilities.push('machine-learning');
  }
  
  return capabilities;
};
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For questions and support:
- Check the examples in `examples.js`
- Review the test scenarios in `test-demo.js`
- Use the CLI help: `node task-manager.js`

## 🔮 Future Enhancements

- [ ] Web dashboard interface
- [ ] Integration with external project management tools
- [ ] Advanced analytics and reporting
- [ ] Team collaboration features
- [ ] Custom notification systems
- [ ] API server mode
- [ ] Plugin architecture
- [ ] Machine learning for better recommendations