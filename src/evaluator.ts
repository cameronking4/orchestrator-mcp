/**
 * Task Evaluator - Evaluates task completion using semantic understanding
 */

export interface EvaluationResult {
  assessment: string;
  passed: boolean;
  reasoning: string;
  suggestions?: string;
}

export class TaskEvaluator {
  evaluateTask(
    taskDescription: string,
    actualOutput: string,
    context?: string
  ): EvaluationResult {
    // Normalize inputs
    const taskLower = taskDescription.toLowerCase();
    const outputLower = actualOutput.toLowerCase();
    const contextLower = context?.toLowerCase() || '';
    
    // Extract key concepts from task description
    const taskKeywords = this.extractKeywords(taskDescription);
    const outputKeywords = this.extractKeywords(actualOutput);
    
    // Check goal alignment
    const goalAlignment = this.checkGoalAlignment(taskKeywords, outputKeywords, taskLower, outputLower);
    
    // Check completeness
    const completeness = this.checkCompleteness(taskDescription, actualOutput);
    
    // Check quality indicators
    const qualityScore = this.assessQuality(actualOutput, context);
    
    // Overall assessment
    const passed = goalAlignment >= 0.6 && completeness >= 0.5 && qualityScore >= 0.5;
    const overallScore = (goalAlignment + completeness + qualityScore) / 3;
    
    // Generate natural language assessment
    const assessment = this.generateAssessment(
      taskDescription,
      actualOutput,
      goalAlignment,
      completeness,
      qualityScore,
      overallScore
    );
    
    const reasoning = this.generateReasoning(
      goalAlignment,
      completeness,
      qualityScore,
      taskDescription,
      actualOutput
    );
    
    const suggestions = passed ? undefined : this.generateSuggestions(
      goalAlignment,
      completeness,
      qualityScore,
      taskDescription
    );
    
    return {
      assessment,
      passed,
      reasoning,
      suggestions
    };
  }
  
  private extractKeywords(text: string): Set<string> {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3); // Only meaningful words
    return new Set(words);
  }
  
  private checkGoalAlignment(
    taskKeywords: Set<string>,
    outputKeywords: Set<string>,
    taskText: string,
    outputText: string
  ): number {
    // Check keyword overlap
    const intersection = new Set([...taskKeywords].filter(x => outputKeywords.has(x)));
    const union = new Set([...taskKeywords, ...outputKeywords]);
    const keywordOverlap = intersection.size / Math.max(union.size, 1);
    
    // Check for key action words
    const actionWords = ['create', 'build', 'implement', 'add', 'fix', 'update', 'refactor'];
    const taskHasAction = actionWords.some(action => taskText.includes(action));
    const outputHasAction = actionWords.some(action => outputText.includes(action));
    const actionMatch = taskHasAction && outputHasAction ? 1 : 0.5;
    
    return (keywordOverlap * 0.7 + actionMatch * 0.3);
  }
  
  private checkCompleteness(taskDescription: string, actualOutput: string): number {
    // Look for requirements mentioned in task description
    const requirements = this.extractRequirements(taskDescription);
    if (requirements.length === 0) return 0.7; // Can't assess if no clear requirements
    
    const outputLower = actualOutput.toLowerCase();
    const metRequirements = requirements.filter(req => {
      const reqLower = req.toLowerCase();
      // Check if requirement keywords appear in output
      const reqWords = reqLower.split(/\s+/).filter(w => w.length > 3);
      return reqWords.some(word => outputLower.includes(word));
    }).length;
    
    return metRequirements / requirements.length;
  }
  
  private extractRequirements(text: string): string[] {
    // Look for patterns like "must", "should", "include", "with"
    const requirements: string[] = [];
    const sentences = text.split(/[.!?]/);
    
    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();
      if (lower.includes('must') || lower.includes('should') || 
          lower.includes('include') || lower.includes('with') ||
          lower.includes('need')) {
        requirements.push(sentence.trim());
      }
    }
    
    return requirements;
  }
  
  private assessQuality(output: string, context?: string): number {
    let score = 0.5; // Base score
    
    // Check for implementation details
    if (output.length > 50) score += 0.1;
    if (output.includes('created') || output.includes('implemented')) score += 0.1;
    
    // Check for specific technologies/frameworks (indicates concrete work)
    const techIndicators = ['api', 'endpoint', 'function', 'class', 'component', 'service'];
    if (techIndicators.some(indicator => output.toLowerCase().includes(indicator))) {
      score += 0.1;
    }
    
    // Context-aware: if context mentions security/critical, check for security indicators
    if (context?.toLowerCase().includes('security') || context?.toLowerCase().includes('critical')) {
      const securityWords = ['secure', 'auth', 'encrypt', 'hash', 'token', 'jwt'];
      if (securityWords.some(word => output.toLowerCase().includes(word))) {
        score += 0.1;
      }
    }
    
    return Math.min(1, score);
  }
  
  private generateAssessment(
    taskDescription: string,
    actualOutput: string,
    goalAlignment: number,
    completeness: number,
    qualityScore: number,
    overallScore: number
  ): string {
    if (overallScore >= 0.7) {
      return `Task appears to be completed successfully. The output aligns well with the task description and shows good progress.`;
    } else if (overallScore >= 0.5) {
      return `Task is partially complete but may need refinement. Some aspects of the task description are addressed, but improvements could be made.`;
    } else {
      return `Task completion needs significant work. The output does not fully align with the task requirements.`;
    }
  }
  
  private generateReasoning(
    goalAlignment: number,
    completeness: number,
    qualityScore: number,
    taskDescription: string,
    actualOutput: string
  ): string {
    const parts: string[] = [];
    
    if (goalAlignment >= 0.7) {
      parts.push("The output aligns well with the task goal.");
    } else if (goalAlignment >= 0.5) {
      parts.push("The output partially addresses the task goal.");
    } else {
      parts.push("The output does not clearly address the task goal.");
    }
    
    if (completeness >= 0.7) {
      parts.push("Most requirements appear to be met.");
    } else if (completeness >= 0.5) {
      parts.push("Some requirements are addressed, but not all.");
    } else {
      parts.push("Many requirements from the task description are not clearly addressed.");
    }
    
    if (qualityScore >= 0.7) {
      parts.push("The implementation shows good quality indicators.");
    } else {
      parts.push("The implementation could benefit from more detail or specific implementation indicators.");
    }
    
    return parts.join(' ');
  }
  
  private generateSuggestions(
    goalAlignment: number,
    completeness: number,
    qualityScore: number,
    taskDescription: string
  ): string {
    const suggestions: string[] = [];
    
    if (goalAlignment < 0.6) {
      suggestions.push("Review the task description and ensure the output directly addresses the stated goal.");
    }
    
    if (completeness < 0.6) {
      suggestions.push("Check that all requirements mentioned in the task description are addressed in the output.");
    }
    
    if (qualityScore < 0.6) {
      suggestions.push("Provide more specific implementation details or concrete examples of what was created.");
    }
    
    return suggestions.join(' ') || "Review the task requirements and ensure all aspects are addressed.";
  }
}

