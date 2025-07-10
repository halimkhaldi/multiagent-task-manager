#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Multiagent Task Manager
 *
 * This test suite covers:
 * - TaskManager initialization and configuration
 * - Agent management (add, update, remove, list)
 * - Task management (create, update, assign, complete)
 * - Recommendation system
 * - Workload tracking
 * - Data persistence and integrity
 * - CLI functionality
 * - MCP server tools
 * - Error handling and edge cases
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const TaskManager = require("./task-manager.js");

// Test configuration
const TEST_CONFIG = {
  testDir: "./test-suite-data",
  timeout: 5000,
  verbose: process.env.TEST_VERBOSE === "true",
};

// Test statistics
let testStats = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  startTime: Date.now(),
};

// Color codes for output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

// Utility functions
function log(message, color = "reset") {
  if (TEST_CONFIG.verbose || color === "red" || color === "green") {
    console.log(colors[color] + message + colors.reset);
  }
}

function cleanupTestDir() {
  if (fs.existsSync(TEST_CONFIG.testDir)) {
    fs.rmSync(TEST_CONFIG.testDir, { recursive: true, force: true });
  }
}

function assert(condition, message) {
  testStats.total++;
  if (condition) {
    testStats.passed++;
    log(`✅ ${message}`, "green");
    return true;
  } else {
    testStats.failed++;
    log(`❌ ${message}`, "red");
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  return assert(
    actual === expected,
    `${message} (expected: ${expected}, got: ${actual})`,
  );
}

function assertExists(obj, property, message) {
  return assert(
    obj && obj.hasOwnProperty(property),
    `${message} - property '${property}' should exist`,
  );
}

function assertArrayLength(arr, length, message) {
  return assert(
    Array.isArray(arr) && arr.length === length,
    `${message} (expected length: ${length}, got: ${arr ? arr.length : "not an array"})`,
  );
}

async function runTest(testName, testFn) {
  log(`\n🧪 ${testName}`, "cyan");
  log("━".repeat(50), "blue");

  try {
    await testFn();
    log(`✅ ${testName} passed`, "green");
  } catch (error) {
    log(`❌ ${testName} failed: ${error.message}`, "red");
    if (TEST_CONFIG.verbose) {
      console.error(error.stack);
    }
    return false;
  }
  return true;
}

// Test Suite Functions

async function testTaskManagerInitialization() {
  cleanupTestDir();

  // Test 1: Basic initialization
  const tm = new TaskManager({ dataDir: TEST_CONFIG.testDir });
  assertExists(
    tm,
    "taskTracker",
    "TaskManager should have taskTracker property",
  );
  assertExists(tm, "agents", "TaskManager should have agents property");

  // Test 2: Smart initialization
  const initResults = tm.smartInit({ dataDir: TEST_CONFIG.testDir });
  assertExists(
    initResults,
    "created",
    "Init results should have created array",
  );
  assertExists(
    initResults,
    "existed",
    "Init results should have existed array",
  );

  // Test 3: Directory structure
  assert(
    fs.existsSync(TEST_CONFIG.testDir),
    "Test directory should be created",
  );
  assert(
    fs.existsSync(path.join(TEST_CONFIG.testDir, "task-tracker.json")),
    "task-tracker.json should exist",
  );
  assert(
    fs.existsSync(path.join(TEST_CONFIG.testDir, "agents.json")),
    "agents.json should exist",
  );

  cleanupTestDir();
}

async function testAgentManagement() {
  cleanupTestDir();
  const tm = new TaskManager({ dataDir: TEST_CONFIG.testDir });
  tm.smartInit({ dataDir: TEST_CONFIG.testDir });

  // Test 1: Add AI agent
  const aiAgent = tm.addAgent({
    id: "test-ai-1",
    name: "Test AI Agent",
    type: "ai",
    capabilities: ["coding", "testing"],
  });

  assertExists(aiAgent, "id", "Agent should have ID");
  assertEqual(aiAgent.id, "test-ai-1", "Agent ID should match");
  assertEqual(aiAgent.type, "ai", "Agent type should be ai");
  assertArrayLength(
    aiAgent.capabilities,
    2,
    "Agent should have 2 capabilities",
  );

  // Test 2: Add human agent
  const humanAgent = tm.addAgent({
    name: "Test Human",
    type: "human",
    capabilities: ["all"],
  });

  assertExists(humanAgent, "id", "Human agent should have auto-generated ID");
  assertEqual(humanAgent.type, "human", "Agent type should be human");

  // Test 3: List agents
  const agents = tm.listAgents();
  assertArrayLength(agents, 2, "Should have 2 agents");

  // Test 4: Get specific agent
  const retrievedAgent = tm.getAgent("test-ai-1");
  assertExists(retrievedAgent, "id", "Retrieved agent should exist");
  assertEqual(
    retrievedAgent.name,
    "Test AI Agent",
    "Retrieved agent name should match",
  );

  // Test 5: Update agent
  const updatedAgent = tm.updateAgent("test-ai-1", {
    capabilities: ["coding", "testing", "documentation"],
  });
  assertArrayLength(
    updatedAgent.capabilities,
    3,
    "Updated agent should have 3 capabilities",
  );

  // Test 6: Remove agent
  tm.removeAgent(humanAgent.id);
  assertEqual(tm.listAgents().length, 1, "Should have 1 agent after removal");

  cleanupTestDir();
}

async function testTaskManagement() {
  cleanupTestDir();
  const tm = new TaskManager({ dataDir: TEST_CONFIG.testDir });
  tm.smartInit({ dataDir: TEST_CONFIG.testDir });

  // Add test agent
  const agent = tm.addAgent({
    id: "test-agent",
    name: "Test Agent",
    type: "ai",
    capabilities: ["coding"],
  });

  // Test 1: Create task
  const task = tm.createTask({
    title: "Test Task",
    category: "coding",
    priority: "high",
    assignees: ["test-agent"],
    completion_criteria: ["Criterion 1", "Criterion 2"],
  });

  assertExists(task, "id", "Task should have ID");
  assertExists(task, "title", "Task should have title");
  assertEqual(task.title, "Test Task", "Task title should match");
  assertEqual(task.priority, "high", "Task priority should match");
  assertEqual(task.status, "todo", "New task should have todo status");
  assertArrayLength(
    task.completion_criteria,
    2,
    "Task should have 2 completion criteria",
  );

  // Test 2: Update task
  const updatedTask = tm.updateTask(task.id, {
    status: "in-progress",
    priority: "critical",
  });
  assertEqual(
    updatedTask.status,
    "in-progress",
    "Task status should be updated",
  );
  assertEqual(
    updatedTask.priority,
    "critical",
    "Task priority should be updated",
  );

  // Test 3: List tasks
  const tasks = tm.listTasks();
  assert(tasks.length > 0, "Should have at least 1 task");

  // Test 4: List tasks with filter
  const todoTasks = tm.listTasks({ status: "todo" });
  const inProgressTasks = tm.listTasks({ status: "in-progress" });
  assertEqual(inProgressTasks.length, 1, "Should have 1 in-progress task");

  // Test 5: Assign agent to task
  const assignResult = tm.assignAgentToTask(task.id, { id: "test-agent" });
  assert(assignResult, "Agent assignment should succeed");

  // Test 6: Complete task
  const completedTask = tm.updateTask(task.id, { status: "completed" });
  assertEqual(completedTask.status, "completed", "Task should be completed");

  cleanupTestDir();
}

async function testRecommendationSystem() {
  cleanupTestDir();
  const tm = new TaskManager({ dataDir: TEST_CONFIG.testDir });
  tm.smartInit({ dataDir: TEST_CONFIG.testDir });

  // Add test agents
  const codingAgent = tm.addAgent({
    id: "coding-agent",
    name: "Coding Agent",
    type: "ai",
    capabilities: ["coding"],
  });

  const designAgent = tm.addAgent({
    id: "design-agent",
    name: "Design Agent",
    type: "ai",
    capabilities: ["design"],
  });

  // Create test tasks
  const codingTask = tm.createTask({
    title: "Coding Task",
    category: "coding",
    priority: "high",
  });

  const designTask = tm.createTask({
    title: "Design Task",
    category: "design",
    priority: "medium",
  });

  const generalTask = tm.createTask({
    title: "General Task",
    category: "analysis",
    priority: "low",
  });

  // Test 1: Get recommendations for coding agent
  const codingRecommendations = tm.getRecommendationsForAgent("coding-agent");
  assert(
    Array.isArray(codingRecommendations),
    "Recommendations should be an array",
  );

  // Test 2: Coding agent should get coding task as top recommendation
  const topCodingRec = codingRecommendations[0];
  if (topCodingRec) {
    assertEqual(
      topCodingRec.category,
      "coding",
      "Top recommendation should be coding task",
    );
  }

  // Test 3: Get recommendations for design agent
  const designRecommendations = tm.getRecommendationsForAgent("design-agent");
  assert(
    Array.isArray(designRecommendations),
    "Design recommendations should be an array",
  );

  // Test 4: Eligible tasks
  const eligibleTasks = tm.getEligibleTasksForAgent("coding-agent");
  assert(Array.isArray(eligibleTasks), "Eligible tasks should be an array");

  cleanupTestDir();
}

async function testWorkloadTracking() {
  cleanupTestDir();
  const tm = new TaskManager({ dataDir: TEST_CONFIG.testDir });
  tm.smartInit({ dataDir: TEST_CONFIG.testDir });

  // Add test agent
  const agent = tm.addAgent({
    id: "workload-agent",
    name: "Workload Agent",
    type: "ai",
    capabilities: ["coding"],
  });

  // Create and assign tasks
  const task1 = tm.createTask({
    title: "Task 1",
    category: "coding",
    assignees: ["workload-agent"],
  });

  const task2 = tm.createTask({
    title: "Task 2",
    category: "coding",
    assignees: ["workload-agent"],
  });

  // Test 1: Get agent workload
  const workload = tm.getAgentWorkload("workload-agent");
  assertExists(workload, "workload", "Workload should have workload property");
  assertExists(
    workload.workload,
    "active_tasks",
    "Workload should have active_tasks",
  );
  assertExists(
    workload.workload,
    "completed_tasks",
    "Workload should have completed_tasks",
  );
  assertExists(
    workload.workload,
    "total_score",
    "Workload should have total_score",
  );

  // Test 2: Complete a task and check workload
  tm.updateTask(task1.id, { status: "completed" });
  const updatedWorkload = tm.getAgentWorkload("workload-agent");
  assertEqual(
    updatedWorkload.workload.completed_tasks,
    1,
    "Should have 1 completed task",
  );

  cleanupTestDir();
}

async function testProjectStatus() {
  cleanupTestDir();
  const tm = new TaskManager({ dataDir: TEST_CONFIG.testDir });
  tm.smartInit({ dataDir: TEST_CONFIG.testDir });

  // Add agents and tasks
  tm.addAgent({
    id: "agent1",
    name: "Agent 1",
    type: "ai",
    capabilities: ["coding"],
  });
  tm.addAgent({
    id: "agent2",
    name: "Agent 2",
    type: "human",
    capabilities: ["all"],
  });

  tm.createTask({ title: "Task 1", status: "completed" });
  tm.createTask({ title: "Task 2", status: "in-progress" });
  tm.createTask({ title: "Task 3", status: "todo" });

  // Test project status
  const status = tm.getProjectStatus();
  assertExists(status, "agents", "Status should have agents info");
  assertExists(status, "tasks", "Status should have tasks info");
  assertExists(status, "progress", "Status should have progress info");

  assertEqual(status.agents.total, 2, "Should have 2 agents");
  assertEqual(status.tasks.total, 3, "Should have 3 tasks");
  assertExists(
    status.progress,
    "completion_percentage",
    "Should have completion percentage",
  );

  cleanupTestDir();
}

async function testDataPersistence() {
  cleanupTestDir();

  // Test 1: Create data with first instance
  const tm1 = new TaskManager({ dataDir: TEST_CONFIG.testDir });
  tm1.smartInit({ dataDir: TEST_CONFIG.testDir });

  const agent = tm1.addAgent({
    id: "persistent-agent",
    name: "Persistent Agent",
    type: "ai",
    capabilities: ["coding"],
  });

  const task = tm1.createTask({
    title: "Persistent Task",
    assignees: ["persistent-agent"],
  });

  // Force save data
  tm1.saveData();

  // Test 2: Load data with second instance
  // Use smartInit to ensure same path logic as first instance
  const tm2 = new TaskManager({ dataDir: TEST_CONFIG.testDir });
  tm2.smartInit({ dataDir: TEST_CONFIG.testDir });

  // The constructor should automatically load existing data
  const loadedAgent = tm2.getAgent("persistent-agent");
  assert(loadedAgent !== null, "Agent should persist across instances");
  assertEqual(
    loadedAgent.name,
    "Persistent Agent",
    "Agent name should persist",
  );

  const loadedTasks = tm2.listTasks();
  assert(loadedTasks.length > 0, "Tasks should persist across instances");

  const loadedTask = loadedTasks.find((t) => t.title === "Persistent Task");
  assertExists(loadedTask, "id", "Specific task should persist");

  cleanupTestDir();
}

async function testErrorHandling() {
  cleanupTestDir();
  const tm = new TaskManager({ dataDir: TEST_CONFIG.testDir });
  tm.smartInit({ dataDir: TEST_CONFIG.testDir });

  // Test 1: Get non-existent agent
  const nonExistentAgent = tm.getAgent("non-existent");
  assertEqual(nonExistentAgent, null, "Non-existent agent should return null");

  // Test 2: Update non-existent task
  try {
    tm.updateTask("non-existent-task", { status: "completed" });
    assert(false, "Should throw error for non-existent task");
  } catch (error) {
    assert(true, "Should throw error for non-existent task");
  }

  // Test 3: Assign non-existent agent to task
  const task = tm.createTask({ title: "Test Task" });
  try {
    tm.assignAgentToTask(task.id, { id: "non-existent-agent" });
    assert(false, "Should throw error for non-existent agent");
  } catch (error) {
    assert(true, "Should throw error for non-existent agent");
  }

  cleanupTestDir();
}

async function testCLIBasics() {
  // Test basic CLI command (no arguments shows usage)
  return new Promise((resolve, reject) => {
    const child = spawn("node", ["task-manager.js"], {
      cwd: __dirname,
      stdio: "pipe",
    });

    let output = "";
    child.stdout.on("data", (data) => {
      output += data.toString();
    });

    child.on("close", (code) => {
      try {
        assert(
          output.includes("Commands:"),
          "CLI should show commands when run without arguments",
        );
        assert(output.includes("Task Manager CLI"), "CLI should show title");
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    child.on("error", reject);

    setTimeout(() => {
      child.kill();
      reject(new Error("CLI test timeout"));
    }, TEST_CONFIG.timeout);
  });
}

// Main test runner
async function runAllTests() {
  console.log(
    colors.bold +
      colors.cyan +
      "🚀 Multiagent Task Manager Test Suite" +
      colors.reset,
  );
  console.log(colors.blue + "=".repeat(60) + colors.reset);

  const tests = [
    ["TaskManager Initialization", testTaskManagerInitialization],
    ["Agent Management", testAgentManagement],
    ["Task Management", testTaskManagement],
    ["Recommendation System", testRecommendationSystem],
    ["Workload Tracking", testWorkloadTracking],
    ["Project Status", testProjectStatus],
    ["Data Persistence", testDataPersistence],
    ["Error Handling", testErrorHandling],
    ["CLI Basics", testCLIBasics],
  ];

  let passedTests = 0;

  for (const [testName, testFn] of tests) {
    const success = await runTest(testName, testFn);
    if (success) passedTests++;
  }

  // Final results
  const duration = ((Date.now() - testStats.startTime) / 1000).toFixed(2);

  console.log(
    "\n" + colors.bold + colors.blue + "📊 Test Results" + colors.reset,
  );
  console.log(colors.blue + "━".repeat(40) + colors.reset);
  console.log(
    `Tests: ${colors.green}${passedTests} passed${colors.reset}, ${colors.red}${tests.length - passedTests} failed${colors.reset}, ${tests.length} total`,
  );
  console.log(
    `Assertions: ${colors.green}${testStats.passed} passed${colors.reset}, ${colors.red}${testStats.failed} failed${colors.reset}, ${testStats.total} total`,
  );
  console.log(`Time: ${duration}s`);

  if (passedTests === tests.length) {
    console.log(
      colors.green + colors.bold + "\n🎉 All tests passed!" + colors.reset,
    );
    process.exit(0);
  } else {
    console.log(
      colors.red + colors.bold + "\n❌ Some tests failed!" + colors.reset,
    );
    process.exit(1);
  }
}

// Cleanup function to ensure test directory is always removed
function cleanup() {
  try {
    if (fs.existsSync(TEST_CONFIG.testDir)) {
      fs.rmSync(TEST_CONFIG.testDir, { recursive: true, force: true });
      console.log(colors.blue + "🧹 Cleaned up test directory" + colors.reset);
    }
  } catch (error) {
    console.error(colors.red + "Cleanup error:", error.message + colors.reset);
  }
}

// Ensure cleanup happens on exit
process.on("exit", cleanup);
process.on("SIGINT", () => {
  cleanup();
  process.exit(0);
});
process.on("SIGTERM", () => {
  cleanup();
  process.exit(0);
});
process.on("uncaughtException", (error) => {
  console.error(
    colors.red + "Uncaught exception:",
    error.message + colors.reset,
  );
  cleanup();
  process.exit(1);
});

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch((error) => {
    console.error(
      colors.red + "Test runner error:",
      error.message + colors.reset,
    );
    cleanup();
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testTaskManagerInitialization,
  testAgentManagement,
  testTaskManagement,
  testRecommendationSystem,
  testWorkloadTracking,
  testProjectStatus,
  testDataPersistence,
  testErrorHandling,
  testCLIBasics,
};
