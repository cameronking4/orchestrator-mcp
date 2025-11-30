import { z } from 'zod';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';

export interface Task {
  id: string;
  description: string;
  status: TaskStatus;
  parentId?: string;
  notes?: string;
  result?: string;
  subtasks: string[]; // IDs of subtasks
}

export class TaskOrchestrator {
  private tasks: Map<string, Task> = new Map();
  private rootTaskId: string | null = null;

  constructor() {}

  createPlan(goal: string): string {
    this.tasks.clear();
    const rootTask: Task = {
      id: '1',
      description: goal,
      status: 'pending',
      subtasks: []
    };
    this.tasks.set(rootTask.id, rootTask);
    this.rootTaskId = rootTask.id;
    return `Plan created with root task ID: 1. Goal: ${goal}`;
  }

  addTask(description: string, parentId?: string, notes?: string): string {
    if (!this.rootTaskId) {
      throw new Error("No plan exists. Create a plan first.");
    }

    const newId = (this.tasks.size + 1).toString();
    const parent = parentId ? this.tasks.get(parentId) : this.tasks.get(this.rootTaskId);

    if (!parent) {
      throw new Error(`Parent task ${parentId} not found.`);
    }

    const newTask: Task = {
      id: newId,
      description,
      status: 'pending',
      parentId: parent.id,
      notes,
      subtasks: []
    };

    this.tasks.set(newId, newTask);
    parent.subtasks.push(newId);

    return `Added task ${newId}: "${description}" to parent ${parent.id}`;
  }

  updateTask(id: string, updates: { status?: TaskStatus; description?: string; notes?: string; result?: string }): string {
    const task = this.tasks.get(id);
    if (!task) {
      throw new Error(`Task ${id} not found.`);
    }

    if (updates.status) task.status = updates.status;
    if (updates.description) task.description = updates.description;
    if (updates.notes) task.notes = updates.notes ? (task.notes ? task.notes + "\n" + updates.notes : updates.notes) : task.notes;
    if (updates.result) task.result = updates.result;

    // specific logic: if a task is completed, check if parent should be updated? 
    // For now, keep it simple.

    return `Updated task ${id}. New status: ${task.status}`;
  }

  getPlanState(): any {
    if (!this.rootTaskId) return { error: "No plan active" };
    
    // Recursive build of the tree for JSON output
    const buildTree = (taskId: string): any => {
      const task = this.tasks.get(taskId)!;
      return {
        id: task.id,
        description: task.description,
        status: task.status,
        notes: task.notes,
        result: task.result,
        subtasks: task.subtasks.map(subId => buildTree(subId))
      };
    };

    return buildTree(this.rootTaskId);
  }

  formatPlan(): string {
    if (!this.rootTaskId) return "No active plan.";

    let output = "Current Plan Status:\n";
    
    const printTask = (taskId: string, depth: number) => {
      const task = this.tasks.get(taskId)!;
      const indent = "  ".repeat(depth);
      const icon = this.getStatusIcon(task.status);
      
      output += `${indent}${icon} [${task.id}] ${task.description} (${task.status})\n`;
      if (task.result) {
        output += `${indent}    Result: ${task.result}\n`;
      }
      if (task.notes) {
        output += `${indent}    Notes: ${task.notes}\n`;
      }
      
      task.subtasks.forEach(subId => printTask(subId, depth + 1));
    };

    printTask(this.rootTaskId, 0);
    return output;
  }

  restoreState(state: any): string {
    if (!state || state.error) {
      throw new Error("Invalid state to restore");
    }

    // Clear current state
    this.tasks.clear();
    this.rootTaskId = null;

    // Restore tasks from state tree
    const restoreTask = (taskData: any, parentId?: string) => {
      const task: Task = {
        id: taskData.id,
        description: taskData.description,
        status: taskData.status,
        parentId: parentId,
        notes: taskData.notes,
        result: taskData.result,
        subtasks: []
      };

      this.tasks.set(task.id, task);

      // Set root task
      if (!parentId) {
        this.rootTaskId = task.id;
      } else {
        const parent = this.tasks.get(parentId);
        if (parent) {
          parent.subtasks.push(task.id);
        }
      }

      // Restore subtasks
      if (taskData.subtasks && Array.isArray(taskData.subtasks)) {
        taskData.subtasks.forEach((subtaskData: any) => {
          restoreTask(subtaskData, task.id);
        });
      }
    };

    restoreTask(state);
    return `State restored successfully. Plan has ${this.tasks.size} task(s).`;
  }

  private getStatusIcon(status: TaskStatus): string {
    switch (status) {
      case 'completed': return '✅';
      case 'in_progress': return '🔄';
      case 'failed': return '❌';
      case 'skipped': return '⏭️';
      default: return '⭕'; // pending
    }
  }
}
