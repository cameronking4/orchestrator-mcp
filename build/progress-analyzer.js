/**
 * Progress Analyzer - Analyzes plan progress with semantic insights
 */
export class ProgressAnalyzer {
    orchestrator;
    constructor(orchestrator) {
        this.orchestrator = orchestrator;
    }
    analyzeProgress(planGoal) {
        const planState = this.orchestrator.getPlanState();
        if (!planState || planState.error) {
            return {
                summary: "No active plan to analyze.",
                insights: [],
                risks: ["No plan is currently active."]
            };
        }
        const stats = this.calculateStats(planState);
        const summary = this.generateSummary(stats, planGoal);
        const insights = this.generateInsights(stats, planState);
        const risks = this.identifyRisks(stats, planState);
        const recommendations = this.generateRecommendations(stats, planState, planGoal);
        return {
            summary,
            insights,
            risks: risks.length > 0 ? risks : undefined,
            recommendations: recommendations.length > 0 ? recommendations : undefined
        };
    }
    calculateStats(planState) {
        let total = 0;
        let completed = 0;
        let inProgress = 0;
        let pending = 0;
        let failed = 0;
        const countTasks = (task) => {
            total++;
            switch (task.status) {
                case 'completed':
                    completed++;
                    break;
                case 'in_progress':
                    inProgress++;
                    break;
                case 'failed':
                    failed++;
                    break;
                default:
                    pending++;
            }
            if (task.subtasks) {
                task.subtasks.forEach(countTasks);
            }
        };
        countTasks(planState);
        return {
            total,
            completed,
            inProgress,
            pending,
            failed,
            percent: total > 0 ? Math.round((completed / total) * 100) : 0
        };
    }
    generateSummary(stats, planGoal) {
        const { total, completed, percent, inProgress, pending } = stats;
        let summary = `${completed} of ${total} tasks completed (${percent}%).`;
        if (inProgress > 0) {
            summary += ` ${inProgress} task${inProgress > 1 ? 's' : ''} currently in progress.`;
        }
        if (pending > 0) {
            summary += ` ${pending} task${pending > 1 ? 's' : ''} pending.`;
        }
        if (planGoal) {
            if (percent >= 75) {
                summary += ` Good progress toward "${planGoal}".`;
            }
            else if (percent >= 50) {
                summary += ` Moderate progress toward "${planGoal}".`;
            }
            else if (percent >= 25) {
                summary += ` Early stages of "${planGoal}".`;
            }
            else {
                summary += ` Just starting "${planGoal}".`;
            }
        }
        return summary;
    }
    generateInsights(stats, planState) {
        const insights = [];
        const { completed, total, percent, inProgress } = stats;
        if (completed > 0 && total > 0) {
            const completionRate = completed / total;
            if (completionRate >= 0.8) {
                insights.push("Most tasks are completed - plan is nearing completion.");
            }
            else if (completionRate >= 0.5) {
                insights.push("About half of the work is done.");
            }
            else {
                insights.push("Still in early to mid stages of the plan.");
            }
        }
        if (inProgress > 0) {
            insights.push(`${inProgress} task${inProgress > 1 ? 's' : ''} actively being worked on.`);
        }
        // Analyze task distribution
        const taskTypes = this.analyzeTaskTypes(planState);
        if (taskTypes.backend > 0 && taskTypes.frontend === 0) {
            insights.push("Backend work is in progress, but no frontend tasks have started.");
        }
        if (taskTypes.frontend > 0 && taskTypes.backend === 0) {
            insights.push("Frontend work is in progress, but no backend tasks have started.");
        }
        return insights;
    }
    identifyRisks(stats, planState) {
        const risks = [];
        const { failed, total, pending, inProgress } = stats;
        if (failed > 0) {
            risks.push(`${failed} task${failed > 1 ? 's have' : ' has'} failed - may need attention.`);
        }
        if (inProgress === 0 && pending > 0) {
            risks.push("No tasks are currently in progress - work may have stalled.");
        }
        // Check for long dependency chains
        const maxDepth = this.getMaxDepth(planState);
        if (maxDepth > 4) {
            risks.push("Deep task hierarchy detected - some tasks may be blocked by long dependency chains.");
        }
        return risks;
    }
    generateRecommendations(stats, planState, planGoal) {
        const recommendations = [];
        const { completed, total, pending, inProgress } = stats;
        if (pending > 0 && inProgress === 0) {
            recommendations.push("Consider starting work on pending tasks.");
        }
        if (completed > 0 && completed < total * 0.3) {
            recommendations.push("Focus on completing initial tasks to build momentum.");
        }
        // Check for bottlenecks
        const readyTasks = this.findReadyTasks(planState);
        if (readyTasks.length > 0 && inProgress === 0) {
            recommendations.push(`Consider starting these ready tasks: ${readyTasks.slice(0, 3).join(', ')}.`);
        }
        return recommendations;
    }
    analyzeTaskTypes(planState) {
        const types = { backend: 0, frontend: 0, other: 0 };
        const checkTask = (task) => {
            const desc = task.description.toLowerCase();
            if (desc.includes('api') || desc.includes('backend') || desc.includes('server') ||
                desc.includes('database') || desc.includes('endpoint')) {
                types.backend++;
            }
            else if (desc.includes('frontend') || desc.includes('ui') || desc.includes('component') ||
                desc.includes('react') || desc.includes('vue') || desc.includes('interface')) {
                types.frontend++;
            }
            else {
                types.other++;
            }
            if (task.subtasks) {
                task.subtasks.forEach(checkTask);
            }
        };
        checkTask(planState);
        return types;
    }
    getMaxDepth(planState, depth = 0) {
        if (!planState.subtasks || planState.subtasks.length === 0) {
            return depth;
        }
        return Math.max(...planState.subtasks.map((sub) => this.getMaxDepth(sub, depth + 1)));
    }
    findReadyTasks(planState) {
        const ready = [];
        const checkTask = (task) => {
            if (task.status === 'pending' && (!task.subtasks || task.subtasks.length === 0)) {
                ready.push(task.id);
            }
            if (task.subtasks) {
                task.subtasks.forEach(checkTask);
            }
        };
        checkTask(planState);
        return ready;
    }
}
