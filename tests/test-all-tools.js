#!/usr/bin/env node
/**
 * End-to-end test for all MCP tools
 * Tests orchestrator + 7 new semantic tools
 */

import { TaskOrchestrator } from '../build/lib.js';
import { TaskEvaluator } from '../build/evaluator.js';
import { TaskAdherenceMonitor } from '../build/adherence.js';
import { ContextManager } from '../build/context-manager.js';
import { DependencyResolver } from '../build/dependency-resolver.js';
import { ProgressAnalyzer } from '../build/progress-analyzer.js';
import { CheckpointManager } from '../build/checkpoint-manager.js';
import { ConstraintChecker } from '../build/constraint-checker.js';

// Test helper
function testTool(name, testFn) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${name}`);
  console.log('='.repeat(60));
  
  try {
    const result = testFn();
    console.log('✅ PASSED');
    if (result && typeof result === 'object') {
      console.log('Result:', JSON.stringify(result, null, 2).substring(0, 500));
    } else if (result) {
      console.log('Result:', String(result).substring(0, 500));
    }
    return true;
  } catch (error) {
    console.log('❌ FAILED');
    console.log('Error:', error.message);
    if (error.stack) {
      console.log('Stack:', error.stack.split('\n').slice(0, 3).join('\n'));
    }
    return false;
  }
}

function runTests() {
  console.log('Starting MCP Tools End-to-End Tests\n');
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Initialize all managers
  const orchestrator = new TaskOrchestrator();
  const evaluator = new TaskEvaluator();
  const adherenceMonitor = new TaskAdherenceMonitor();
  const contextManager = new ContextManager();
  const dependencyResolver = new DependencyResolver();
  const progressAnalyzer = new ProgressAnalyzer(orchestrator);
  const checkpointManager = new CheckpointManager(orchestrator);
  const constraintChecker = new ConstraintChecker();

  // Test 1: Task Orchestrator - Create Plan
  results.tests.push(testTool('Task Orchestrator - Create Plan', () => {
    const result = orchestrator.createPlan('Build a REST API with authentication');
    if (!result.includes('Plan created')) throw new Error('Plan creation failed');
    return result;
  }));

  // Test 2: Task Orchestrator - Add Tasks
  results.tests.push(testTool('Task Orchestrator - Add Tasks', () => {
    const result1 = orchestrator.addTask('Set up database schema', '1');
    const result2 = orchestrator.addTask('Create API endpoints', '1');
    const result3 = orchestrator.addTask('Build frontend', '1');
    if (!result1.includes('Added task')) throw new Error('Task addition failed');
    return { result1, result2, result3 };
  }));

  // Test 3: Task Orchestrator - Update Task
  results.tests.push(testTool('Task Orchestrator - Update Task', () => {
    const result = orchestrator.updateTask('2', {
      status: 'in_progress',
      notes: 'Working on schema design'
    });
    if (!result.includes('Updated task')) throw new Error('Task update failed');
    return result;
  }));

  // Test 4: Task Orchestrator - Format Plan
  results.tests.push(testTool('Task Orchestrator - Format Plan', () => {
    const plan = orchestrator.formatPlan();
    if (!plan.includes('Current Plan Status')) throw new Error('Plan formatting failed');
    return plan.substring(0, 200);
  }));

  // Test 5: Task Evaluator
  results.tests.push(testTool('Task Evaluator', () => {
    const result = evaluator.evaluateTask(
      'Create a secure login endpoint',
      'Created POST /login endpoint with JWT authentication. Used bcrypt for password hashing.',
      'This is for a banking application'
    );
    if (typeof result.passed !== 'boolean') throw new Error('Invalid evaluation result');
    if (!result.assessment || !result.reasoning) throw new Error('Missing evaluation fields');
    return result;
  }));

  // Test 6: Task Adherence Monitor
  results.tests.push(testTool('Task Adherence Monitor', () => {
    const result = adherenceMonitor.checkAlignment(
      'Build a REST API for user management',
      'I am creating REST API endpoints for user CRUD operations',
      'Working on the backend'
    );
    if (typeof result.aligned !== 'boolean') throw new Error('Invalid alignment result');
    if (typeof result.confidence !== 'number') throw new Error('Missing confidence score');
    if (!result.reasoning) throw new Error('Missing reasoning');
    return result;
  }));

  // Test 7: Context Manager - Remember
  results.tests.push(testTool('Context Manager - Remember', () => {
    const result = contextManager.remember(
      'We decided to use PostgreSQL for the database',
      'Team prefers it over MySQL for JSON support'
    );
    if (!result.remembered || !result.id) throw new Error('Remember failed');
    return result;
  }));

  // Test 8: Context Manager - Recall
  results.tests.push(testTool('Context Manager - Recall', () => {
    const result = contextManager.recall('What database are we using?', 3);
    if (!Array.isArray(result.results)) throw new Error('Recall failed');
    if (result.results.length === 0) throw new Error('Recall found no results');
    const foundPostgres = result.results.some(r => r.what.includes('PostgreSQL'));
    if (!foundPostgres) throw new Error('Recall did not find the stored fact');
    return result;
  }));

  // Test 9: Dependency Resolver - Infer Dependencies
  results.tests.push(testTool('Dependency Resolver - Infer Dependencies', () => {
    const result = dependencyResolver.inferDependencies([
      { id: '1', description: 'Set up database schema' },
      { id: '2', description: 'Create API endpoints that query the database' },
      { id: '3', description: 'Build frontend that calls the API' }
    ]);
    if (!result.dependencies || !Array.isArray(result.dependencies)) {
      throw new Error('Invalid dependencies result');
    }
    if (!result.ready_tasks || !Array.isArray(result.ready_tasks)) {
      throw new Error('Invalid ready_tasks result');
    }
    return result;
  }));

  // Test 10: Dependency Resolver - Get Next Tasks
  results.tests.push(testTool('Dependency Resolver - Get Next Tasks', () => {
    const result = dependencyResolver.getNextTasks(['1']);
    if (!result.ready || !Array.isArray(result.ready)) {
      throw new Error('Invalid ready tasks result');
    }
    if (!result.blocked || !Array.isArray(result.blocked)) {
      throw new Error('Invalid blocked tasks result');
    }
    return result;
  }));

  // Test 11: Progress Analyzer
  results.tests.push(testTool('Progress Analyzer', () => {
    const result = progressAnalyzer.analyzeProgress('Build a REST API with authentication');
    if (!result.summary) throw new Error('Missing summary');
    if (!Array.isArray(result.insights)) throw new Error('Missing insights');
    return result;
  }));

  // Test 12: Checkpoint Manager - Create Checkpoint
  results.tests.push(testTool('Checkpoint Manager - Create Checkpoint', () => {
    const result = checkpointManager.createCheckpoint(
      'Before refactoring',
      'All tests passing, ready to refactor authentication'
    );
    if (!result.checkpoint_id) throw new Error('Checkpoint creation failed');
    return result;
  }));

  // Test 13: Checkpoint Manager - List Checkpoints
  results.tests.push(testTool('Checkpoint Manager - List Checkpoints', () => {
    const result = checkpointManager.listCheckpoints();
    if (!result.checkpoints || !Array.isArray(result.checkpoints)) {
      throw new Error('Invalid checkpoints list');
    }
    if (result.checkpoints.length === 0) {
      throw new Error('No checkpoints found');
    }
    const found = result.checkpoints.find(cp => cp.name === 'Before refactoring');
    if (!found) throw new Error('Checkpoint not found in list');
    return result;
  }));

  // Test 14: Checkpoint Manager - Restore Checkpoint
  results.tests.push(testTool('Checkpoint Manager - Restore Checkpoint', () => {
    const listResult = checkpointManager.listCheckpoints();
    const checkpointId = listResult.checkpoints[0].id;
    const result = checkpointManager.restoreCheckpoint(checkpointId);
    if (!result.success) throw new Error('Checkpoint restoration failed');
    return result;
  }));

  // Test 15: Constraint Checker
  results.tests.push(testTool('Constraint Checker', () => {
    const result = constraintChecker.checkConstraints(
      'Must use TypeScript, no external API calls, include error handling',
      'Created login.ts file with JWT authentication. Uses try-catch for error handling.',
      'This is for a banking application'
    );
    if (typeof result.passed !== 'boolean') throw new Error('Invalid constraint check result');
    if (!Array.isArray(result.violations)) throw new Error('Missing violations array');
    if (!result.reasoning) throw new Error('Missing reasoning');
    return result;
  }));

  // Test 16: Integration Test - Complete workflow
  results.tests.push(testTool('Integration - Complete Workflow', () => {
    // Create a new orchestrator for clean state
    const testOrch = new TaskOrchestrator();
    testOrch.createPlan('Test integration workflow');
    testOrch.addTask('Task 1: Setup', '1');
    testOrch.addTask('Task 2: Implementation', '1');
    testOrch.updateTask('2', { status: 'completed', result: 'Done' });
    
    // Evaluate the completed task
    const evalResult = evaluator.evaluateTask(
      'Task 2: Implementation',
      'Done'
    );
    
    // Check alignment
    const alignResult = adherenceMonitor.checkAlignment(
      'Test integration workflow',
      'Completed task 2 implementation',
      'Working through the plan'
    );
    
    // Analyze progress
    const progressAnalyzer2 = new ProgressAnalyzer(testOrch);
    const progressResult = progressAnalyzer2.analyzeProgress('Test integration workflow');
    
    if (!evalResult || !alignResult || !progressResult) {
      throw new Error('Integration test failed');
    }
    
    return {
      evaluation: evalResult.passed,
      alignment: alignResult.aligned,
      progress: progressResult.summary.substring(0, 100)
    };
  }));

  // Summary
  results.passed = results.tests.filter(t => t === true).length;
  results.failed = results.tests.filter(t => t === false).length;

  console.log(`\n${'='.repeat(60)}`);
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.tests.length}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.tests.length) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));

  return results.failed === 0;
}

// Run tests
const success = runTests();
process.exit(success ? 0 : 1);
