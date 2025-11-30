#!/usr/bin/env node
/**
 * Demo script showing all 11 MCP tools in action
 * This demonstrates a realistic workflow using all tools together
 */

import { TaskOrchestrator } from '../build/lib.js';
import { TaskEvaluator } from '../build/evaluator.js';
import { TaskAdherenceMonitor } from '../build/adherence.js';
import { ContextManager } from '../build/context-manager.js';
import { DependencyResolver } from '../build/dependency-resolver.js';
import { ProgressAnalyzer } from '../build/progress-analyzer.js';
import { CheckpointManager } from '../build/checkpoint-manager.js';
import { ConstraintChecker } from '../build/constraint-checker.js';

console.log('🚀 MCP Tools Demo - All 11 Tools in Action\n');
console.log('='.repeat(70));

// Initialize all tools
const orchestrator = new TaskOrchestrator();
const evaluator = new TaskEvaluator();
const adherenceMonitor = new TaskAdherenceMonitor();
const contextManager = new ContextManager();
const dependencyResolver = new DependencyResolver();
const progressAnalyzer = new ProgressAnalyzer(orchestrator);
const checkpointManager = new CheckpointManager(orchestrator);
const constraintChecker = new ConstraintChecker();

// ============================================================================
// TOOL 1: Task Orchestrator - Create Plan
// ============================================================================
console.log('\n📋 TOOL 1: task_orchestrator (create_plan)');
console.log('-'.repeat(70));
const planResult = orchestrator.createPlan('Build a secure e-commerce API with user authentication');
console.log(planResult);

// ============================================================================
// TOOL 2: Task Orchestrator - Add Tasks
// ============================================================================
console.log('\n📋 TOOL 2: task_orchestrator (add_task)');
console.log('-'.repeat(70));
orchestrator.addTask('Design database schema for users and products', '1');
orchestrator.addTask('Set up PostgreSQL database', '1');
orchestrator.addTask('Create user authentication endpoints (login, register)', '1');
orchestrator.addTask('Implement JWT token generation and validation', '1');
orchestrator.addTask('Create product CRUD endpoints', '1');
orchestrator.addTask('Add input validation and error handling', '1');
console.log('Added 6 tasks to the plan');

// ============================================================================
// TOOL 3: Context Manager - Remember
// ============================================================================
console.log('\n🧠 TOOL 3: remember');
console.log('-'.repeat(70));
contextManager.remember('We are using PostgreSQL version 15', 'Required for JSONB support');
contextManager.remember('API base URL will be https://api.example.com/v1', 'Configured in environment variables');
contextManager.remember('We decided to use TypeScript for type safety', 'Team consensus');
console.log('Stored 3 important facts in context memory');

// ============================================================================
// TOOL 4: Context Manager - Recall
// ============================================================================
console.log('\n🧠 TOOL 4: recall');
console.log('-'.repeat(70));
const recallResult = contextManager.recall('What database are we using?', 2);
console.log('Query: "What database are we using?"');
recallResult.results.forEach((r, i) => {
  console.log(`  ${i + 1}. ${r.what} (Relevance: ${(r.relevance * 100).toFixed(0)}%)`);
});

// ============================================================================
// TOOL 5: Dependency Resolver - Infer Dependencies
// ============================================================================
console.log('\n🔗 TOOL 5: infer_dependencies');
console.log('-'.repeat(70));
const tasks = [
  { id: '2', description: 'Design database schema for users and products' },
  { id: '3', description: 'Set up PostgreSQL database' },
  { id: '4', description: 'Create user authentication endpoints that use the database' },
  { id: '5', description: 'Implement JWT token generation' },
  { id: '6', description: 'Create product CRUD endpoints that query the database' }
];
const depsResult = dependencyResolver.inferDependencies(tasks);
console.log('Inferred dependencies:');
depsResult.dependencies.forEach(dep => {
  console.log(`  Task ${dep.task_id} depends on: ${dep.depends_on.join(', ')}`);
});
console.log(`Ready tasks (no dependencies): ${depsResult.ready_tasks.join(', ')}`);

// ============================================================================
// TOOL 6: Task Orchestrator - Update Task
// ============================================================================
console.log('\n📋 TOOL 6: task_orchestrator (update_task)');
console.log('-'.repeat(70));
orchestrator.updateTask('2', {
  status: 'completed',
  result: 'Designed schema with users, products, and orders tables. Users table includes email, password_hash, and created_at fields.'
});
orchestrator.updateTask('3', {
  status: 'completed',
  result: 'PostgreSQL 15 database set up and configured. Connection pool established.'
});
console.log('Marked tasks 2 and 3 as completed');

// ============================================================================
// TOOL 7: Task Evaluator
// ============================================================================
console.log('\n✅ TOOL 7: evaluate_task');
console.log('-'.repeat(70));
const evalResult = evaluator.evaluateTask(
  'Create user authentication endpoints (login, register)',
  'Created POST /auth/login and POST /auth/register endpoints. Login endpoint validates credentials and returns JWT token. Register endpoint hashes passwords with bcrypt before storing.',
  'This is a production e-commerce API'
);
console.log(`Assessment: ${evalResult.assessment}`);
console.log(`Status: ${evalResult.passed ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`Reasoning: ${evalResult.reasoning}`);
if (evalResult.suggestions) {
  console.log(`Suggestions: ${evalResult.suggestions}`);
}

// ============================================================================
// TOOL 8: Constraint Checker
// ============================================================================
console.log('\n🔒 TOOL 8: check_constraints');
console.log('-'.repeat(70));
const constraintResult = constraintChecker.checkConstraints(
  'Must use TypeScript, include error handling, no plain text passwords, must use JWT for authentication',
  'Created auth.ts file with login and register functions. Uses bcrypt for password hashing. JWT tokens generated on successful login. All endpoints wrapped in try-catch blocks.',
  'Production e-commerce API'
);
console.log(`Status: ${constraintResult.passed ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`Reasoning: ${constraintResult.reasoning}`);
if (constraintResult.violations.length > 0) {
  console.log('Violations:');
  constraintResult.violations.forEach(v => {
    console.log(`  - ${v.constraint}: ${v.explanation}`);
  });
}

// ============================================================================
// TOOL 9: Task Adherence Monitor
// ============================================================================
console.log('\n🎯 TOOL 9: check_alignment');
console.log('-'.repeat(70));
const alignmentResult = adherenceMonitor.checkAlignment(
  'Build a secure e-commerce API with user authentication',
  'I am currently working on implementing the product search functionality with filters',
  'User asked about adding search features'
);
console.log(`Aligned: ${alignmentResult.aligned ? '✅ YES' : '⚠️ NO'}`);
console.log(`Confidence: ${(alignmentResult.confidence * 100).toFixed(0)}%`);
console.log(`Reasoning: ${alignmentResult.reasoning}`);
if (alignmentResult.suggestion) {
  console.log(`Suggestion: ${alignmentResult.suggestion}`);
}

// ============================================================================
// TOOL 10: Progress Analyzer
// ============================================================================
console.log('\n📊 TOOL 10: analyze_progress');
console.log('-'.repeat(70));
const progressResult = progressAnalyzer.analyzeProgress('Build a secure e-commerce API with user authentication');
console.log(`Summary: ${progressResult.summary}`);
console.log('\nInsights:');
progressResult.insights.forEach(insight => {
  console.log(`  • ${insight}`);
});
if (progressResult.risks && progressResult.risks.length > 0) {
  console.log('\nRisks:');
  progressResult.risks.forEach(risk => {
    console.log(`  ⚠️ ${risk}`);
  });
}
if (progressResult.recommendations && progressResult.recommendations.length > 0) {
  console.log('\nRecommendations:');
  progressResult.recommendations.forEach(rec => {
    console.log(`  💡 ${rec}`);
  });
}

// ============================================================================
// TOOL 11: Dependency Resolver - Get Next Tasks
// ============================================================================
console.log('\n🔗 TOOL 11: get_next_tasks');
console.log('-'.repeat(70));
const nextTasksResult = dependencyResolver.getNextTasks(['2', '3']);
console.log(`Ready to start: ${nextTasksResult.ready.length > 0 ? nextTasksResult.ready.join(', ') : 'none'}`);
console.log(`Blocked (waiting on dependencies): ${nextTasksResult.blocked.length > 0 ? nextTasksResult.blocked.join(', ') : 'none'}`);

// ============================================================================
// TOOL 12: Checkpoint Manager - Create Checkpoint
// ============================================================================
console.log('\n💾 TOOL 12: create_checkpoint');
console.log('-'.repeat(70));
const checkpointResult = checkpointManager.createCheckpoint(
  'Milestone: Database and Auth Complete',
  'Database schema designed, PostgreSQL set up, and authentication endpoints created. Ready to move on to product endpoints.'
);
console.log(`Created checkpoint: ${checkpointResult.checkpoint_id}`);

// ============================================================================
// TOOL 13: Checkpoint Manager - List Checkpoints
// ============================================================================
console.log('\n💾 TOOL 13: list_checkpoints');
console.log('-'.repeat(70));
const checkpointsList = checkpointManager.listCheckpoints();
console.log('Available checkpoints:');
checkpointsList.checkpoints.forEach(cp => {
  console.log(`  • ${cp.name} (ID: ${cp.id})`);
  if (cp.description) {
    console.log(`    ${cp.description}`);
  }
});

// ============================================================================
// TOOL 14: Checkpoint Manager - Restore Checkpoint
// ============================================================================
console.log('\n💾 TOOL 14: restore_checkpoint');
console.log('-'.repeat(70));
const restoreResult = checkpointManager.restoreCheckpoint(
  undefined,
  'the checkpoint before product work'
);
console.log(`Restore result: ${restoreResult.message}`);

// ============================================================================
// TOOL 15: Task Orchestrator - Get Plan
// ============================================================================
console.log('\n📋 TOOL 15: task_orchestrator (get_plan)');
console.log('-'.repeat(70));
const plan = orchestrator.formatPlan();
console.log(plan);

// ============================================================================
// Summary
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('✨ DEMO COMPLETE - All 11 Tools Demonstrated!');
console.log('='.repeat(70));
console.log('\nTools demonstrated:');
console.log('  1. task_orchestrator (create_plan)');
console.log('  2. task_orchestrator (add_task)');
console.log('  3. remember');
console.log('  4. recall');
console.log('  5. infer_dependencies');
console.log('  6. task_orchestrator (update_task)');
console.log('  7. evaluate_task');
console.log('  8. check_constraints');
console.log('  9. check_alignment');
console.log('  10. analyze_progress');
console.log('  11. get_next_tasks');
console.log('  12. create_checkpoint');
console.log('  13. list_checkpoints');
console.log('  14. restore_checkpoint');
console.log('  15. task_orchestrator (get_plan)');
console.log('\nAll tools working together seamlessly! 🎉\n');

