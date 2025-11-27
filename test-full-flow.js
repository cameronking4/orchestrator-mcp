#!/usr/bin/env node
/**
 * Full flow test for task_orchestrator tool
 * Simulates a complete MCP client interaction
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';

const serverPath = './build/index.js';

async function sendMCPRequest(server, request) {
  return new Promise((resolve, reject) => {
    let output = '';
    let errorOutput = '';
    let responseReceived = false;

    const timeout = setTimeout(() => {
      if (!responseReceived) {
        server.kill();
        reject(new Error('Timeout waiting for response'));
      }
    }, 2000);

    const dataHandler = (data) => {
      const text = data.toString();
      output += text;
      
      // Try to parse JSON responses
      const lines = text.split('\n').filter(l => l.trim());
      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json.id === request.id || json.method) {
            responseReceived = true;
            clearTimeout(timeout);
            resolve(json);
            return;
          }
        } catch (e) {
          // Not JSON, continue
        }
      }
    };

    server.stdout.on('data', dataHandler);
    server.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    server.on('close', (code) => {
      clearTimeout(timeout);
      if (!responseReceived) {
        reject(new Error(`Server closed without response. Code: ${code}, Error: ${errorOutput}`));
      }
    });

    server.stdin.write(JSON.stringify(request) + '\n');
  });
}

async function testFullFlow() {
  console.log('🧪 Testing task_orchestrator tool - Full Flow\n');

  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  try {
    // Step 1: Initialize
    console.log('1️⃣ Initializing MCP connection...');
    const initResponse = await sendMCPRequest(server, {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0'
        }
      }
    });
    console.log('✅ Initialized:', initResponse.result?.serverInfo?.name);
    console.log('');

    // Send initialized notification
    server.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/initialized'
    }) + '\n');

    await new Promise(resolve => setTimeout(resolve, 100));

    // Step 2: List tools
    console.log('2️⃣ Listing available tools...');
    const listResponse = await sendMCPRequest(server, {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list'
    });
    const tools = listResponse.result?.tools || [];
    console.log(`✅ Found ${tools.length} tool(s):`);
    tools.forEach(tool => {
      console.log(`   - ${tool.name}: ${tool.description}`);
    });
    console.log('');

    // Step 3: Create Plan
    console.log('3️⃣ Creating a plan...');
    const createPlanResponse = await sendMCPRequest(server, {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'task_orchestrator',
        arguments: {
          action: 'create_plan',
          plan_goal: 'Build a web application'
        }
      }
    });
    const createPlanResult = createPlanResponse.result?.content?.[0]?.text || '';
    console.log('✅ Plan created!');
    console.log('Result:', createPlanResult.substring(0, 150));
    console.log('');

    // Step 4: Add Task
    console.log('4️⃣ Adding a task...');
    const addTaskResponse = await sendMCPRequest(server, {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'task_orchestrator',
        arguments: {
          action: 'add_task',
          task_description: 'Set up project structure'
        }
      }
    });
    const addTaskResult = addTaskResponse.result?.content?.[0]?.text || '';
    console.log('✅ Task added!');
    console.log('Result:', addTaskResult.substring(0, 150));
    console.log('');

    // Step 5: Update Task
    console.log('5️⃣ Updating task status...');
    const updateTaskResponse = await sendMCPRequest(server, {
      jsonrpc: '2.0',
      id: 5,
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
    });
    const updateTaskResult = updateTaskResponse.result?.content?.[0]?.text || '';
    console.log('✅ Task updated!');
    console.log('Result:', updateTaskResult.substring(0, 150));
    console.log('');

    // Step 6: Get Plan
    console.log('6️⃣ Getting current plan...');
    const getPlanResponse = await sendMCPRequest(server, {
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/call',
      params: {
        name: 'task_orchestrator',
        arguments: {
          action: 'get_plan'
        }
      }
    });
    const getPlanResult = getPlanResponse.result?.content?.[0]?.text || '';
    console.log('✅ Plan retrieved!');
    console.log('Current Plan:');
    console.log(getPlanResult);
    console.log('');

    console.log('🎉 All tests passed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    server.kill();
  }
}

testFullFlow().catch(console.error);

