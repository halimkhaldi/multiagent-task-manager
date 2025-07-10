#!/usr/bin/env node

/**
 * Task Recommendation Algorithm Implementation
 *
 * This script calculates the next recommended tasks for the n8n Privacy & Performance
 * Enhancement Project based on priorities, dependencies, critical path, and risk factors.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  weights: {
    priority: 0.4,
    dependency: 0.3,
    critical_path: 0.2,
    risk: 0.05,
    phase: 0.05
  },
  max_recommendations: 3,
  max_parallel_high_risk: 1,
  require_current_phase: true
};

// Scoring tables
const SCORING = {
  priority: {
    'high': 100,
    'medium': 60,
    'low': 20
  },
  risk: {
    'low': 100,
    'medium': 70,
    'high': 40
  }
};

/**
 * Load task tracker data
 */
function loadTaskTracker() {
  const trackerPath = path.join(__dirname, 'task-tracker.json');
  try {
    const data = fs.readFileSync(trackerPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading task-tracker.json:', error.message);
    process.exit(1);
  }
}

/**
 * Save updated task tracker data
 */
function saveTaskTracker(data) {
  const trackerPath = path.join(__dirname, 'task-tracker.json');
  try {
    fs.writeFileSync(trackerPath, JSON.stringify(data, null, 2));
    console.log('✅ Task tracker updated successfully');
  } catch (error) {
    console.error('Error saving task-tracker.json:', error.message);
    process.exit(1);
  }
}

/**
 * Get priority score
 */
function getPriorityScore(priority) {
  return SCORING.priority[priority.toLowerCase()] || 20;
}

/**
 * Get dependency score based on number of blockers
 */
function getDependencyScore(dependencies, allTasks) {
  const uncompletedBlockers = dependencies.filter(depId => {
    const task = allTasks[depId];
    return task && task.status !== 'completed';
  });

  const blockerCount = uncompletedBlockers.length;

  if (blockerCount === 0) return 100;
  if (blockerCount === 1) return 80;
  if (blockerCount === 2) return 60;
  return 20;
}

/**
 * Get critical path score based on number of tasks blocked
 */
function getCriticalPathScore(blocks) {
  const blockCount = blocks ? blocks.length : 0;

  if (blockCount >= 5) return 100;
  if (blockCount >= 3) return 80;
  if (blockCount >= 1) return 60;
  return 40;
}

/**
 * Get risk score
 */
function getRiskScore(riskLevel) {
  return SCORING.risk[riskLevel.toLowerCase()] || 70;
}

/**
 * Get phase score
 */
function getPhaseScore(taskPhase, currentPhase) {
  if (taskPhase === currentPhase) return 100;

  // Simple phase ordering (could be made more sophisticated)
  const phaseOrder = ['phase-1', 'phase-2', 'phase-3', 'phase-4', 'phase-5', 'phase-6'];
  const currentIndex = phaseOrder.indexOf(currentPhase);
  const taskIndex = phaseOrder.indexOf(taskPhase);

  if (taskIndex === currentIndex + 1) return 60;
  return 20;
}

/**
 * Calculate overall task score
 */
function calculateTaskScore(task, allTasks, currentPhase) {
  const priorityScore = getPriorityScore(task.priority);
  const dependencyScore = getDependencyScore(task.dependencies || [], allTasks);
  const criticalPathScore = getCriticalPathScore(task.blocks);
  const riskScore = getRiskScore(task.risk_level || 'medium');
  const phaseScore = getPhaseScore(task.phase, currentPhase);

  const totalScore =
    (priorityScore * CONFIG.weights.priority) +
    (dependencyScore * CONFIG.weights.dependency) +
    (criticalPathScore * CONFIG.weights.critical_path) +
    (riskScore * CONFIG.weights.risk) +
    (phaseScore * CONFIG.weights.phase);

  return {
    total: Math.round(totalScore * 10) / 10,
    breakdown: {
      priority_score: priorityScore * CONFIG.weights.priority,
      dependency_score: dependencyScore * CONFIG.weights.dependency,
      critical_path_score: criticalPathScore * CONFIG.weights.critical_path,
      risk_score: riskScore * CONFIG.weights.risk,
      phase_score: phaseScore * CONFIG.weights.phase
    }
  };
}

/**
 * Get all tasks from both tasks object and top-level tasks
 */
function getAllTasks(taskTracker) {
  const allTasks = { ...taskTracker.tasks };

  // Add top-level tasks (TASK-040+)
  Object.keys(taskTracker).forEach(key => {
    if (key.startsWith('TASK-') && typeof taskTracker[key] === 'object' && taskTracker[key].id) {
      allTasks[key] = taskTracker[key];
    }
  });

  return allTasks;
}

/**
 * Get eligible tasks (TODO status with completed dependencies)
 */
function getEligibleTasks(tasks) {
  return Object.values(tasks).filter(task => {
    if (task.status !== 'todo') return false;

    // Check if all dependencies are completed
    if (task.dependencies && task.dependencies.length > 0) {
      return task.dependencies.every(depId => {
        const depTask = tasks[depId];
        return depTask && depTask.status === 'completed';
      });
    }

    return true;
  });
}

/**
 * Apply business rules to task selection
 */
function applyBusinessRules(scoredTasks, currentPhase) {
  let recommendations = [];
  let highRiskCount = 0;

  // Sort by score (highest first)
  const sortedTasks = scoredTasks.sort((a, b) => b.score.total - a.score.total);

  for (const task of sortedTasks) {
    if (recommendations.length >= CONFIG.max_recommendations) break;

    // Rule 1: Limit high-risk tasks
    if (task.risk_level === 'high') {
      if (highRiskCount >= CONFIG.max_parallel_high_risk) continue;
      highRiskCount++;
    }

    // Rule 2: Prefer current phase (if enabled)
    if (CONFIG.require_current_phase && task.phase !== currentPhase) {
      // Only skip if we have tasks from current phase
      const hasCurrentPhaseTasks = sortedTasks.some(t =>
        t.phase === currentPhase &&
        !recommendations.find(r => r.id === t.id)
      );
      if (hasCurrentPhaseTasks) continue;
    }

    recommendations.push(task);
  }

  return recommendations;
}

/**
 * Generate task recommendations
 */
function generateRecommendations(taskTracker) {
  const currentPhase = taskTracker.current_state.active_phase;
  const allTasks = getAllTasks(taskTracker);

  // Get eligible tasks
  const eligibleTasks = getEligibleTasks(allTasks);

  if (eligibleTasks.length === 0) {
    return {
      recommendations: [],
      metadata: {
        eligible_count: 0,
        message: "No eligible tasks found. All tasks may be blocked or completed."
      }
    };
  }

  // Calculate scores for eligible tasks
  const scoredTasks = eligibleTasks.map(task => {
    const score = calculateTaskScore(task, allTasks, currentPhase);
    return {
      ...task,
      score: score,
      scoring_breakdown: score.breakdown
    };
  });

  // Apply business rules and get final recommendations
  const recommendations = applyBusinessRules(scoredTasks, currentPhase);

  return {
    recommendations: recommendations.map((task, index) => ({
      task_id: task.id,
      score: task.score.total,
      rank: index + 1,
      reason: generateReasonText(task),
      risk_level: task.risk_level,
      phase: task.phase,
      estimated_hours: task.estimated_hours
    })),
    metadata: {
      eligible_count: eligibleTasks.length,
      algorithm_version: "1.0.0",
      calculated_at: new Date().toISOString(),
      weights_used: CONFIG.weights
    }
  };
}

/**
 * Generate human-readable reason for recommendation
 */
function generateReasonText(task) {
  const reasons = [];

  if (task.priority === 'high') reasons.push('HIGH priority');
  if (task.dependencies.length === 0) reasons.push('0 blockers');
  if (task.blocks && task.blocks.length >= 3) reasons.push(`blocks ${task.blocks.length} tasks`);
  if (task.risk_level === 'low') reasons.push('LOW risk');
  if (task.risk_level === 'high') reasons.push('HIGH risk');

  const category = task.category;
  if (category === 'analytics') reasons.push('privacy-critical');
  if (category === 'license') reasons.push('critical path');

  return reasons.join(', ');
}

/**
 * Display task details with scoring breakdown
 */
function explainTask(taskId, taskTracker) {
  const allTasks = getAllTasks(taskTracker);
  const task = allTasks[taskId];
  if (!task) {
    console.error(`❌ Task ${taskId} not found`);
    return;
  }

  const currentPhase = taskTracker.current_state.active_phase;
  const score = calculateTaskScore(task, allTasks, currentPhase);

  console.log(`\n📋 Task: ${task.title} (${taskId})`);
  console.log(`Category: ${task.category}`);
  console.log(`Phase: ${task.phase}`);
  console.log(`Status: ${task.status}`);
  console.log(`Priority: ${task.priority}`);
  console.log(`Risk Level: ${task.risk_level || 'medium'}`);
  console.log(`Estimated Hours: ${task.estimated_hours}`);

  console.log(`\n📊 Scoring Breakdown:`);
  console.log(`├─ Priority Score: ${score.breakdown.priority_score.toFixed(1)} (${task.priority})`);
  console.log(`├─ Dependency Score: ${score.breakdown.dependency_score.toFixed(1)} (${task.dependencies?.length || 0} blockers)`);
  console.log(`├─ Critical Path Score: ${score.breakdown.critical_path_score.toFixed(1)} (blocks ${task.blocks?.length || 0} tasks)`);
  console.log(`├─ Risk Score: ${score.breakdown.risk_score.toFixed(1)} (${task.risk_level || 'medium'} risk)`);
  console.log(`├─ Phase Score: ${score.breakdown.phase_score.toFixed(1)} (${task.phase})`);
  console.log(`└─ Total Score: ${score.total}`);

  if (task.dependencies && task.dependencies.length > 0) {
    console.log(`\n🔗 Dependencies:`);
    task.dependencies.forEach(depId => {
      const depTask = taskTracker.tasks[depId];
      if (depTask) {
        const status = depTask.status === 'completed' ? '✅' : '⏳';
        console.log(`  ${status} ${depTask.title} (${depId})`);
      }
    });
  }

  if (task.blocks && task.blocks.length > 0) {
    console.log(`\n🚧 Blocks:`);
    task.blocks.forEach(blockId => {
      console.log(`  🔒 ${blockId}`);
    });
  }
}

/**
 * Update task tracker with new recommendations
 */
function updateTaskTracker(taskTracker) {
  const result = generateRecommendations(taskTracker);

  // Update current state
  taskTracker.current_state.next_recommended_tasks = result.recommendations;
  taskTracker.current_state.latest_update = new Date().toISOString();
  taskTracker.current_state.recommendation_algorithm = {
    version: result.metadata.algorithm_version,
    last_calculated: result.metadata.calculated_at,
    weights: result.metadata.weights_used,
    max_recommendations: CONFIG.max_recommendations
  };

  // Add to recommendation history
  if (!taskTracker.recommendation_history) {
    taskTracker.recommendation_history = [];
  }

  taskTracker.recommendation_history.unshift({
    date: result.metadata.calculated_at,
    algorithm_version: result.metadata.algorithm_version,
    recommendations: result.recommendations.map(r => ({
      task_id: r.task_id,
      score: r.score,
      selected: false
    })),
    rationale: generateRecommendationRationale(result.recommendations)
  });

  // Keep only last 10 history entries
  taskTracker.recommendation_history = taskTracker.recommendation_history.slice(0, 10);

  return result;
}

/**
 * Generate rationale for recommendations
 */
function generateRecommendationRationale(recommendations) {
  if (recommendations.length === 0) {
    return "No eligible tasks available.";
  }

  const top = recommendations[0];
  const reasons = [];

  if (recommendations.length > 1) {
    const second = recommendations[1];
    reasons.push(`${top.task_id} scored highest (${top.score}) vs ${second.task_id} (${second.score})`);
  }

  return reasons.join(' ') || `${top.task_id} is the highest priority eligible task.`;
}

/**
 * Analyze current project status and identify gaps
 */
function analyzeProjectStatus(taskTracker) {
  // Get all tasks from both tasks object and top-level tasks
  const allTasks = { ...taskTracker.tasks };

  // Add top-level tasks that are outside the tasks object
  Object.keys(taskTracker).forEach(key => {
    if (key.startsWith('TASK-') && typeof taskTracker[key] === 'object' && taskTracker[key].id) {
      allTasks[key] = taskTracker[key];
    }
  });

  const phases = taskTracker.phases;

  console.log('\n📊 Project Status Analysis');
  console.log('=' .repeat(50));

  // Overall statistics
  const taskStats = {
    total: Object.keys(allTasks).length,
    completed: 0,
    in_progress: 0,
    todo: 0
  };

  Object.values(allTasks).forEach(task => {
    taskStats[task.status]++;
  });

  console.log(`\n🎯 Overall Progress:`);
  console.log(`  Total Tasks: ${taskStats.total}`);
  console.log(`  Completed: ${taskStats.completed} (${Math.round(taskStats.completed/taskStats.total*100)}%)`);
  console.log(`  In Progress: ${taskStats.in_progress}`);
  console.log(`  Todo: ${taskStats.todo}`);

  // Phase analysis
  console.log(`\n📋 Phase Breakdown:`);
  Object.entries(phases).forEach(([phaseId, phase]) => {
    const phaseTasks = phase.tasks || [];
    const phaseTaskObjects = phaseTasks.map(id => allTasks[id]).filter(Boolean);

    const phaseStats = {
      completed: phaseTaskObjects.filter(t => t.status === 'completed').length,
      in_progress: phaseTaskObjects.filter(t => t.status === 'in_progress').length,
      todo: phaseTaskObjects.filter(t => t.status === 'todo').length,
      total: phaseTaskObjects.length
    };

    const percentage = phaseStats.total > 0 ? Math.round(phaseStats.completed/phaseStats.total*100) : 0;
    const statusIcon = percentage === 100 ? '✅' : percentage > 50 ? '🔄' : '⏳';

    console.log(`  ${statusIcon} ${phase.name}: ${phaseStats.completed}/${phaseStats.total} (${percentage}%)`);

    if (phaseStats.in_progress > 0) {
      console.log(`      In Progress: ${phaseStats.in_progress} tasks`);
    }
    if (phaseStats.todo > 0) {
      console.log(`      Todo: ${phaseStats.todo} tasks`);
    }
  });

  // Critical analysis based on actual work done
  console.log(`\n🔍 Critical Analysis:`);

  // Check for database migration completion
  const migrationTasks = Object.values(allTasks).filter(task =>
    task.category === 'database' ||
    task.title.toLowerCase().includes('migration') ||
    task.title.toLowerCase().includes('database')
  );

  const migrationCompleted = migrationTasks.filter(t => t.status === 'completed').length;
  if (migrationCompleted === migrationTasks.length) {
    console.log(`  ✅ Database migration work appears complete`);
  } else {
    console.log(`  ⚠️  Database migration: ${migrationCompleted}/${migrationTasks.length} tasks completed`);
  }

  // Check for license removal
  const licenseTasks = Object.values(allTasks).filter(task =>
    task.category === 'license' ||
    task.title.toLowerCase().includes('license')
  );

  const licenseCompleted = licenseTasks.filter(t => t.status === 'completed').length;
  if (licenseCompleted === licenseTasks.length) {
    console.log(`  ✅ License removal work appears complete`);
  } else {
    console.log(`  ⚠️  License removal: ${licenseCompleted}/${licenseTasks.length} tasks completed`);
  }

  // Check for frontend work
  const frontendTasks = Object.values(allTasks).filter(task =>
    task.category === 'frontend' ||
    task.phase === 'phase-3'
  );

  const frontendCompleted = frontendTasks.filter(t => t.status === 'completed').length;
  if (frontendCompleted === frontendTasks.length) {
    console.log(`  ✅ Frontend work appears complete`);
  } else {
    console.log(`  ⚠️  Frontend work: ${frontendCompleted}/${frontendTasks.length} tasks completed`);
  }

  // Recommendations for next steps
  console.log(`\n🚀 Recommendations:`);

  const todoTasks = Object.values(allTasks).filter(t => t.status === 'todo');
  const eligibleTasks = getEligibleTasks(allTasks);

  if (todoTasks.length === 0) {
    console.log(`  🎉 All tasks appear to be completed! Project may be ready for final verification.`);
  } else if (eligibleTasks.length === 0) {
    console.log(`  ⚠️  ${todoTasks.length} tasks remain but none are eligible (blocked by dependencies)`);
    console.log(`  📋 Consider reviewing task dependencies and completion status`);
  } else {
    console.log(`  📋 ${eligibleTasks.length} tasks are ready to work on`);
    console.log(`  🎯 Run './task-recommender.js calculate' for specific recommendations`);
  }

  // Gap analysis
  console.log(`\n🔧 Potential Status Gaps:`);
  console.log(`  • If database migration is actually complete, mark related tasks as 'completed'`);
  console.log(`  • If frontend privacy work is done, update frontend task statuses`);
  console.log(`  • If license removal is complete, update license task statuses`);
  console.log(`  • Consider running './task-recommender.js update' to refresh recommendations`);
}

/**
 * Advance to the next phase when current phase is complete
 */
function advancePhase(taskTracker) {
  const phaseOrder = ['phase-1', 'phase-2', 'phase-3', 'phase-4', 'phase-5', 'phase-6'];
  const currentPhase = taskTracker.current_state.active_phase;
  const currentIndex = phaseOrder.indexOf(currentPhase);

  // Check if current phase is complete
  const phase = taskTracker.phases[currentPhase];
  if (phase && phase.completion_percentage === 100) {
    // Move to next phase
    if (currentIndex < phaseOrder.length - 1) {
      const nextPhase = phaseOrder[currentIndex + 1];
      taskTracker.current_state.active_phase = nextPhase;
      taskTracker.phases[nextPhase].status = 'in_progress';
      taskTracker.phases[nextPhase].start_date = new Date().toISOString();

      console.log(`✅ Phase ${currentPhase} completed! Moving to ${nextPhase}`);
      return nextPhase;
    } else {
      console.log(`🎉 All phases completed! Project finished!`);
      return null;
    }
  }

  return currentPhase;
}

/**
 * Detect completed work from filesystem and update task statuses
 */
function updateTaskStatuses(taskTracker) {
  const updates = [];
  const fs = require('fs');
  const path = require('path');

  // Get all tasks from both tasks object and top-level tasks
  const allTasks = { ...taskTracker.tasks };

  // Add top-level tasks that are outside the tasks object
  Object.keys(taskTracker).forEach(key => {
    if (key.startsWith('TASK-') && typeof taskTracker[key] === 'object' && taskTracker[key].id) {
      allTasks[key] = taskTracker[key];
    }
  });

  // Check for actual completed work based on filesystem
  const completionChecks = [
    {
      category: 'database',
      check: () => {
        // Check if privacy-first migration exists
        try {
          const migrationPath = path.join(__dirname, '../packages/@n8n/db/src/migrations/common/1743000000000-PrivacyFirstDataCleanup.ts');
          return fs.existsSync(migrationPath);
        } catch { return false; }
      },
      reason: 'Privacy-first database migration file exists'
    },
    {
      category: 'configuration',
      check: () => {
        // Check if privacy-first environment config exists
        try {
          const envPath = path.join(__dirname, '../.env.privacy-first');
          return fs.existsSync(envPath);
        } catch { return false; }
      },
      reason: 'Privacy-first environment configuration exists'
    },
    {
      category: 'documentation',
      check: () => {
        // Check if privacy documentation exists
        try {
          const docPath = path.join(__dirname, '../PRIVACY_FIRST_MODIFICATIONS.md');
          return fs.existsSync(docPath);
        } catch { return false; }
      },
      reason: 'Privacy-first documentation exists'
    },
    {
      category: 'frontend',
      check: () => {
        // Check if frontend telemetry has been modified
        try {
          const telemetryPath = path.join(__dirname, '../packages/frontend/editor-ui/src/plugins/telemetry/index.ts');
          if (fs.existsSync(telemetryPath)) {
            const content = fs.readFileSync(telemetryPath, 'utf8');
            return content.includes('Privacy-first') || content.includes('no-op');
          }
          return false;
        } catch { return false; }
      },
      reason: 'Frontend telemetry has been modified for privacy'
    },
    {
      category: 'license',
      check: () => {
        // Check if license metrics service has been modified
        try {
          const licensePath = path.join(__dirname, '../packages/cli/src/metrics/license-metrics.service.ts');
          if (fs.existsSync(licensePath)) {
            const content = fs.readFileSync(licensePath, 'utf8');
            return content.includes('Privacy-first') || content.includes('Returns empty');
          }
          return false;
        } catch { return false; }
      },
      reason: 'License metrics service has been modified for privacy'
    },
    {
      category: 'testing',
      check: () => {
        // Check if verification script exists
        try {
          const scriptPath = path.join(__dirname, '../packages/@n8n/db/scripts/verify-privacy-migration.js');
          return fs.existsSync(scriptPath);
        } catch { return false; }
      },
      reason: 'Privacy migration verification script exists'
    },
    {
      category: 'cleanup',
      check: () => {
        // Check if setup script exists
        try {
          const setupPath = path.join(__dirname, '../scripts/setup-privacy-first.sh');
          return fs.existsSync(setupPath);
        } catch { return false; }
      },
      reason: 'Privacy-first setup script exists'
    }
  ];

  // Update tasks based on actual filesystem checks
  Object.values(allTasks).forEach(task => {
    if (task.status === 'completed') return; // Already completed

    // Find relevant completion check
    const relevantCheck = completionChecks.find(check =>
      task.category === check.category ||
      task.title.toLowerCase().includes(check.category)
    );

    if (relevantCheck && relevantCheck.check()) {
      const oldStatus = task.status;

      // Update in the correct location (tasks object or top-level)
      if (taskTracker.tasks[task.id]) {
        taskTracker.tasks[task.id].status = 'completed';
        taskTracker.tasks[task.id].completed = new Date().toISOString();
        taskTracker.tasks[task.id].updated = new Date().toISOString();
      } else if (taskTracker[task.id]) {
        taskTracker[task.id].status = 'completed';
        taskTracker[task.id].completed = new Date().toISOString();
        taskTracker[task.id].updated = new Date().toISOString();
      }

      updates.push({
        taskId: task.id,
        title: task.title,
        oldStatus: oldStatus,
        newStatus: 'completed',
        reason: relevantCheck.reason
      });
    }
  });

  // Update phase completion percentages
  Object.entries(taskTracker.phases).forEach(([phaseId, phase]) => {
    const phaseTasks = phase.tasks || [];
    const phaseTaskObjects = phaseTasks.map(id => taskTracker.tasks[id]).filter(Boolean);
    const completed = phaseTaskObjects.filter(t => t.status === 'completed').length;
    const total = phaseTaskObjects.length;

    if (total > 0) {
      phase.completion_percentage = Math.round((completed / total) * 100);
      if (phase.completion_percentage === 100) {
        phase.status = 'completed';
      } else if (phase.completion_percentage > 0) {
        phase.status = 'in_progress';
      }
    }
  });

  // Update overall progress - include both tasks object and top-level tasks
  const allTasksForProgress = { ...taskTracker.tasks };
  Object.keys(taskTracker).forEach(key => {
    if (key.startsWith('TASK-') && typeof taskTracker[key] === 'object' && taskTracker[key].id) {
      allTasksForProgress[key] = taskTracker[key];
    }
  });

  const allTasksList = Object.values(allTasksForProgress);
  const completedCount = allTasksList.filter(t => t.status === 'completed').length;
  const inProgressCount = allTasksList.filter(t => t.status === 'in_progress').length;
  const todoCount = allTasksList.filter(t => t.status === 'todo').length;

  taskTracker.progress = {
    total_tasks: allTasksList.length,
    completed: completedCount,
    in_progress: inProgressCount,
    todo: todoCount,
    completion_percentage: Math.round((completedCount / allTasksList.length) * 100)
  };

  return updates;
}

/**
 * Main CLI interface
 */
function main() {
  const command = process.argv[2];
  const arg = process.argv[3];

  switch (command) {
    case 'calculate':
      const taskTracker = loadTaskTracker();
      const result = generateRecommendations(taskTracker);

      console.log('\n🎯 Next Recommended Tasks:');
      if (result.recommendations.length === 0) {
        console.log('  No eligible tasks found.');
      } else {
        result.recommendations.forEach((rec, index) => {
          console.log(`  ${index + 1}. ${rec.task_id} (Score: ${rec.score})`);
          console.log(`     ${rec.reason}`);
        });
      }

      console.log(`\n📈 Algorithm Metadata:`);
      console.log(`  Eligible Tasks: ${result.metadata.eligible_count}`);
      console.log(`  Algorithm Version: ${result.metadata.algorithm_version}`);
      console.log(`  Calculated: ${result.metadata.calculated_at}`);
      break;

    case 'explain':
      if (!arg) {
        console.error('❌ Please provide a task ID to explain');
        console.log('Usage: ./task-recommender.js explain TASK-001');
        process.exit(1);
      }

      const tracker = loadTaskTracker();
      explainTask(arg, tracker);
      break;

    case 'update':
      const trackerData = loadTaskTracker();
      const updateResult = updateTaskTracker(trackerData);

      console.log('\n🔄 Updating task tracker...');
      console.log(`📊 Generated ${updateResult.recommendations.length} recommendations`);

      saveTaskTracker(trackerData);

      console.log('\n🎯 New Recommendations:');
      updateResult.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec.task_id} (Score: ${rec.score})`);
      });
      break;

    case 'status':
      const statusTracker = loadTaskTracker();
      analyzeProjectStatus(statusTracker);
      break;

    case 'advance':
      const advanceTracker = loadTaskTracker();
      const newPhase = advancePhase(advanceTracker);

      if (newPhase) {
        saveTaskTracker(advanceTracker);
        console.log(`\n📋 Now working on: ${advanceTracker.phases[newPhase].name}`);

        // Show next available tasks
        const nextTasks = getEligibleTasks(advanceTracker.tasks);
        if (nextTasks.length > 0) {
          console.log(`\n🎯 Available tasks:`);
          nextTasks.slice(0, 3).forEach((task, index) => {
            console.log(`  ${index + 1}. ${task.id}: ${task.title}`);
          });
        }
      }
      break;

    case 'update-status':
      const updateTracker = loadTaskTracker();
      const updates = updateTaskStatuses(updateTracker);

      console.log('\n🔄 Updating task statuses based on actual filesystem completion...');
      console.log(`📊 Updated ${updates.length} tasks:`);

      updates.forEach(update => {
        console.log(`  ✅ ${update.taskId}: ${update.oldStatus} → ${update.newStatus}`);
        console.log(`     ${update.title}`);
        console.log(`     Reason: ${update.reason}`);
      });

      saveTaskTracker(updateTracker);

      console.log('\n📈 New Project Status:');
      console.log(`  Completion: ${updateTracker.progress.completion_percentage}%`);
      console.log(`  Completed: ${updateTracker.progress.completed}/${updateTracker.progress.total_tasks} tasks`);
      break;

    case 'mark-complete':
      if (!arg) {
        console.error('❌ Please provide a task ID to mark as complete');
        console.log('Usage: ./task-recommender.js mark-complete TASK-040');
        process.exit(1);
      }

      const markTracker = loadTaskTracker();
      const taskId = arg;

      // Check both tasks object and top-level tasks
      let taskFound = false;
      let taskObj = null;
      let oldStatus = '';

      if (markTracker.tasks && markTracker.tasks[taskId]) {
        taskObj = markTracker.tasks[taskId];
        oldStatus = taskObj.status;
        markTracker.tasks[taskId].status = 'completed';
        markTracker.tasks[taskId].completed = new Date().toISOString();
        markTracker.tasks[taskId].updated = new Date().toISOString();
        taskFound = true;
      } else if (markTracker[taskId] && typeof markTracker[taskId] === 'object' && markTracker[taskId].id) {
        taskObj = markTracker[taskId];
        oldStatus = taskObj.status;
        markTracker[taskId].status = 'completed';
        markTracker[taskId].completed = new Date().toISOString();
        markTracker[taskId].updated = new Date().toISOString();
        taskFound = true;
      }

      if (taskFound) {
        console.log(`✅ Task ${taskId} marked as completed`);
        console.log(`   ${taskObj.title}`);
        console.log(`   Status: ${oldStatus} → completed`);
        saveTaskTracker(markTracker);
      } else {
        console.error(`❌ Task ${taskId} not found`);
      }
      break;

    case 'help':
    default:
      console.log(`
📋 Task Recommendation Algorithm CLI

Usage:
  ./task-recommender.js calculate    # Calculate and display recommendations
  ./task-recommender.js explain TASK-ID  # Show detailed scoring for a task
  ./task-recommender.js update       # Update task-tracker.json with new recommendations
  ./task-recommender.js status       # Analyze current project status and gaps
  ./task-recommender.js update-status # Mark completed tasks based on actual work done
  ./task-recommender.js advance      # Advance to next phase when current phase is complete
  ./task-recommender.js mark-complete TASK-ID # Mark a specific task as completed
  ./task-recommender.js help         # Show this help message

Examples:
  ./task-recommender.js calculate
  ./task-recommender.js explain TASK-001
  ./task-recommender.js update
  ./task-recommender.js status
  ./task-recommender.js update-status
  ./task-recommender.js advance
  ./task-recommender.js mark-complete TASK-040

Algorithm Configuration:
  Priority Weight: ${CONFIG.weights.priority * 100}%
  Dependency Weight: ${CONFIG.weights.dependency * 100}%
  Critical Path Weight: ${CONFIG.weights.critical_path * 100}%
  Risk Weight: ${CONFIG.weights.risk * 100}%
  Phase Weight: ${CONFIG.weights.phase * 100}%
      `);
      break;
  }
}

// Run the CLI
if (require.main === module) {
  main();
}

module.exports = {
  generateRecommendations,
  calculateTaskScore,
  getEligibleTasks,
  CONFIG
};
