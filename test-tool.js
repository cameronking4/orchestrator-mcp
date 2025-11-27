#!/usr/bin/env node
/**
 * Test script for the task_orchestrator MCP tool
 * This simulates MCP client calls to test the server
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';

const serverPath = './build/index.js';

// Test cases
const tests = [
  {
    name: 'Create Plan',
    request: {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'task_orchestrator',
        arguments: {
          action: 'create_plan',
          plan_goal: 'Build a web application'
        }
      }
    }
  },
  {
    name: 'Add Task',
    request: {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'task_orchestrator',
        arguments: {
          action: 'add_task',
          task_description: 'Set up project structure'
        }
      }
    }
  },
  {
    name: 'Update Task',
    request: {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'task_orchestrator',
        arguments: {
          action: 'update_task',
          task_id: '2',
          status: 'in_progress',
          notes: 'Started working on project setup'
        }
      }
    }
  },
  {
    name: 'Get Plan',
    request: {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'task_orchestrator',
        arguments: {
          action: 'get_plan'
        }
      }
    }
  }
];

async function testTool(testCase) {
  return new Promise((resolve, reject) => {
    const server = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    server.stdout.on('data', (data) => {
      output += data.toString();
    });

    server.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    server.on('close', (code) => {
      if (code !== 0 && !output) {
        reject(new Error(`Server exited with code ${code}: ${errorOutput}`));
      } else {
        resolve({ output, errorOutput });
      }
    });

    // First, initialize the connection
    const initRequest = {
      jsonrpc: '2.0',
      id: 0,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0'
        }
      }
    };

    server.stdin.write(JSON.stringify(initRequest) + '\n');

    // Wait a bit, then send initialized notification
    setTimeout(() => {
      const initialized = {
        jsonrpc: '2.0',
        method: 'notifications/initialized'
      };
      server.stdin.write(JSON.stringify(initialized) + '\n');

      // Then send the actual tool call
      setTimeout(() => {
        server.stdin.write(JSON.stringify(testCase.request) + '\n');
        
        // Close after a short delay
        setTimeout(() => {
          server.stdin.end();
        }, 500);
      }, 100);
    }, 100);
  });
}

async function runTests() {
  console.log('🧪 Testing task_orchestrator MCP tool...\n');

  for (const test of tests) {
    console.log(`Testing: ${test.name}`);
    try {
      const result = await testTool(test);
      console.log(`✅ ${test.name} - Success`);
      if (result.output) {
        console.log('Output:', result.output.substring(0, 200));
      }
    } catch (error) {
      console.log(`❌ ${test.name} - Failed:`, error.message);
    }
    console.log('');
  }
}

runTests().catch(console.error);

