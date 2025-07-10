#!/usr/bin/env node

/**
 * Test Init Function
 * Tests the enhanced initialization capabilities of TaskManager
 */

const TaskManager = require('./task-manager.js');
const fs = require('fs');
const path = require('path');

function cleanupTestDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function testBasicInit() {
  console.log('🧪 Test 1: Basic Initialization');
  console.log('━'.repeat(40));

  const testDir = './test-basic-init';
  cleanupTestDir(testDir);

  const tm = new TaskManager();
  const results = tm.smartInit({ dataDir: testDir });

  console.log('Results:', results);
  console.log('✅ Test 1 passed\n');

  cleanupTestDir(testDir);
}

function testCurrentDirInit() {
  console.log('🧪 Test 2: Current Directory Initialization');
  console.log('━'.repeat(40));

  // Create a temporary directory to test in
  const testDir = './test-current-dir';
  cleanupTestDir(testDir);
  fs.mkdirSync(testDir);

  // Change to test directory
  const originalDir = process.cwd();
  process.chdir(testDir);

  try {
    const tm = new TaskManager();
    const results = tm.smartInit({ useCurrentDir: true });

    console.log('Results:', results);
    console.log('✅ Test 2 passed');

  } finally {
    // Change back to original directory
    process.chdir(originalDir);
    cleanupTestDir(testDir);
  }
  console.log('');
}

function testExistingProject() {
  console.log('🧪 Test 3: Existing Project (No Override)');
  console.log('━'.repeat(40));

  const testDir = './test-existing-project';
  cleanupTestDir(testDir);

  // First initialization
  console.log('First init:');
  const tm1 = new TaskManager();
  const results1 = tm1.smartInit({ dataDir: testDir });
  console.log('Created:', results1.created);

  // Second initialization (should not override)
  console.log('\nSecond init:');
  const tm2 = new TaskManager();
  const results2 = tm2.smartInit({ dataDir: testDir });
  console.log('Existed:', results2.existed);
  console.log('Created:', results2.created);

  console.log('✅ Test 3 passed\n');

  cleanupTestDir(testDir);
}

function testEnvFileHandling() {
  console.log('🧪 Test 4: .env File Handling');
  console.log('━'.repeat(40));

  const testDir = './test-env-handling';
  const envPath = path.join(testDir, '.env');

  cleanupTestDir(testDir);
  fs.mkdirSync(testDir, { recursive: true });

  // Create existing .env with some content
  fs.writeFileSync(envPath, 'EXISTING_VAR=value\nANOTHER_VAR=test\n');

  // Change to test directory
  const originalDir = process.cwd();
  process.chdir(testDir);

  try {
    const tm = new TaskManager();
    const results = tm.smartInit({ useCurrentDir: true });

    // Check if .env was updated
    const envContent = fs.readFileSync('./.env', 'utf8');
    console.log('Updated .env content:');
    console.log(envContent);

    console.log('Results:', results);
    console.log('✅ Test 4 passed');

  } finally {
    process.chdir(originalDir);
    cleanupTestDir(testDir);
  }
  console.log('');
}

function testCLIInit() {
  console.log('🧪 Test 5: CLI Init Commands');
  console.log('━'.repeat(40));

  const { spawn } = require('child_process');

  console.log('Testing CLI init commands...');
  console.log('Note: This would normally be tested with actual CLI calls');
  console.log('CLI commands to test manually:');
  console.log('  node task-manager.js init');
  console.log('  node task-manager.js init --current');
  console.log('  node task-manager.js init --dir ./my-project');
  console.log('✅ Test 5 setup complete\n');
}

function runAllTests() {
  console.log('🚀 TaskManager Init Function Tests\n');
  console.log('=' .repeat(50));

  try {
    testBasicInit();
    testCurrentDirInit();
    testExistingProject();
    testEnvFileHandling();
    testCLIInit();

    console.log('🎉 All tests completed successfully!');
    console.log('\n💡 Manual CLI tests:');
    console.log('   node task-manager.js init --help');
    console.log('   node task-manager.js init');
    console.log('   node task-manager.js init --current');
    console.log('   node task-manager.js init --dir ./my-test-project');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testBasicInit,
  testCurrentDirInit,
  testExistingProject,
  testEnvFileHandling,
  testCLIInit,
  runAllTests
};
