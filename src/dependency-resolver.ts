/**
 * Dependency Resolver - Infers task dependencies from descriptions
 */

export interface Task {
  id: string;
  description: string;
}

export interface Dependency {
  task_id: string;
  depends_on: string[];
  reasoning: string;
}

export interface DependencyResult {
  dependencies: Dependency[];
  ready_tasks: string[];
}

export interface NextTasksResult {
  ready: string[];
  blocked: string[];
}

export class DependencyResolver {
  private dependencies: Map<string, Set<string>> = new Map(); // task_id -> set of depends_on
  private tasks: Map<string, Task> = new Map();

  inferDependencies(tasks: Task[]): DependencyResult {
    // Store tasks
    tasks.forEach(task => {
      this.tasks.set(task.id, task);
      if (!this.dependencies.has(task.id)) {
        this.dependencies.set(task.id, new Set());
      }
    });

    const inferredDeps: Dependency[] = [];
    const readyTasks: string[] = [];

    // Analyze each task for dependencies
    for (const task of tasks) {
      const dependsOn = this.findDependencies(task, tasks);
      
      if (dependsOn.length === 0) {
        readyTasks.push(task.id);
      }

      if (dependsOn.length > 0) {
        this.dependencies.set(task.id, new Set(dependsOn));
        inferredDeps.push({
          task_id: task.id,
          depends_on: dependsOn,
          reasoning: this.generateReasoning(task, dependsOn, tasks)
        });
      }
    }

    return {
      dependencies: inferredDeps,
      ready_tasks: readyTasks
    };
  }

  getNextTasks(completedTasks: string[] = []): NextTasksResult {
    const completedSet = new Set(completedTasks);
    const ready: string[] = [];
    const blocked: string[] = [];

    for (const [taskId, deps] of this.dependencies.entries()) {
      const allDepsMet = Array.from(deps).every(depId => completedSet.has(depId));
      
      if (allDepsMet) {
        ready.push(taskId);
      } else {
        blocked.push(taskId);
      }
    }

    // Tasks with no dependencies are always ready
    for (const taskId of this.tasks.keys()) {
      if (!this.dependencies.has(taskId) || this.dependencies.get(taskId)!.size === 0) {
        if (!ready.includes(taskId) && !completedSet.has(taskId)) {
          ready.push(taskId);
        }
      }
    }

    return { ready, blocked };
  }

  private findDependencies(task: Task, allTasks: Task[]): string[] {
    const taskDesc = task.description.toLowerCase();
    const dependencies: string[] = [];

    // Look for dependency indicators
    const dependencyKeywords = [
      'after', 'depends on', 'requires', 'needs', 'uses', 'calls',
      'queries', 'accesses', 'depends', 'based on', 'using'
    ];

    for (const otherTask of allTasks) {
      if (otherTask.id === task.id) continue;

      const otherDesc = otherTask.description.toLowerCase();
      
      // Check if task description mentions other task's concepts
      if (this.hasDependencyRelationship(taskDesc, otherDesc, dependencyKeywords)) {
        dependencies.push(otherTask.id);
      }
    }

    return dependencies;
  }

  private hasDependencyRelationship(
    taskDesc: string,
    otherDesc: string,
    keywords: string[]
  ): boolean {
    // Extract key nouns/concepts from other task
    const otherConcepts = this.extractConcepts(otherDesc);
    
    // Check if task description mentions these concepts with dependency keywords
    for (const concept of otherConcepts) {
      if (concept.length < 4) continue; // Skip short words
      
      // Check if concept appears in task description
      if (taskDesc.includes(concept)) {
        // Check if there's a dependency keyword nearby
        const conceptIndex = taskDesc.indexOf(concept);
        const context = taskDesc.substring(Math.max(0, conceptIndex - 30), conceptIndex + concept.length + 30);
        
        if (keywords.some(keyword => context.includes(keyword))) {
          return true;
        }
      }
    }

    // Also check for explicit references
    // e.g., "Create API endpoints that query the database" -> depends on "Set up database"
    const explicitPatterns = [
      /that (uses|queries|accesses|calls|depends on)/i,
      /after (setting up|creating|building)/i,
      /requires? (the|a|an)/i
    ];

    for (const pattern of explicitPatterns) {
      if (pattern.test(taskDesc)) {
        // Check if other task's concepts appear after the pattern
        const match = taskDesc.match(pattern);
        if (match) {
          const afterMatch = taskDesc.substring(taskDesc.indexOf(match[0]) + match[0].length);
          const otherConcepts = this.extractConcepts(otherDesc);
          if (otherConcepts.some(concept => afterMatch.includes(concept))) {
            return true;
          }
        }
      }
    }

    return false;
  }

  private extractConcepts(text: string): string[] {
    // Extract important nouns/concepts (simplified)
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3);
    
    // Filter out common stop words
    const stopWords = new Set(['that', 'this', 'with', 'from', 'have', 'will', 'should', 'would']);
    return words.filter(w => !stopWords.has(w));
  }

  private generateReasoning(task: Task, dependsOn: string[], allTasks: Task[]): string {
    if (dependsOn.length === 0) {
      return "No dependencies inferred from task description.";
    }

    const depTasks = dependsOn.map(id => allTasks.find(t => t.id === id)).filter(Boolean) as Task[];
    const depDescriptions = depTasks.map(t => t.description).join(', ');
    
    return `Task "${task.description}" depends on: ${depDescriptions}. This relationship was inferred from the task descriptions.`;
  }

  addDependency(taskId: string, dependsOnTaskId: string): void {
    if (!this.dependencies.has(taskId)) {
      this.dependencies.set(taskId, new Set());
    }
    this.dependencies.get(taskId)!.add(dependsOnTaskId);
  }

  clear(): void {
    this.dependencies.clear();
    this.tasks.clear();
  }
}

