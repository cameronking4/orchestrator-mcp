/**
 * Task Adherence Monitor - Detects semantic drift from plan goals
 */
export class TaskAdherenceMonitor {
    checkAlignment(planGoal, currentAction, recentContext) {
        // Normalize inputs
        const goalLower = planGoal.toLowerCase();
        const actionLower = currentAction.toLowerCase();
        const contextLower = recentContext?.toLowerCase() || '';
        // Extract key concepts
        const goalKeywords = this.extractKeywords(planGoal);
        const actionKeywords = this.extractKeywords(currentAction);
        // Check semantic alignment
        const keywordOverlap = this.calculateOverlap(goalKeywords, actionKeywords);
        // Check for goal-related terms in action
        const goalTermMatch = this.checkGoalTerms(goalLower, actionLower);
        // Check for drift indicators
        const driftScore = this.detectDrift(goalLower, actionLower, contextLower);
        // Calculate overall alignment
        const alignmentScore = (keywordOverlap * 0.4 + goalTermMatch * 0.4 + (1 - driftScore) * 0.2);
        const aligned = alignmentScore >= 0.6;
        const confidence = Math.abs(alignmentScore - 0.5) * 2; // Higher confidence when further from 0.5
        const reasoning = this.generateReasoning(alignmentScore, keywordOverlap, goalTermMatch, driftScore, planGoal, currentAction);
        const suggestion = aligned ? undefined : this.generateSuggestion(planGoal, currentAction, driftScore);
        return {
            aligned,
            confidence: Math.min(1, Math.max(0, confidence)),
            reasoning,
            suggestion
        };
    }
    extractKeywords(text) {
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 3);
        return new Set(words);
    }
    calculateOverlap(set1, set2) {
        if (set1.size === 0 && set2.size === 0)
            return 1;
        if (set1.size === 0 || set2.size === 0)
            return 0;
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        return intersection.size / union.size;
    }
    checkGoalTerms(goalText, actionText) {
        // Extract important terms from goal (nouns, key concepts)
        const goalWords = goalText.split(/\s+/).filter(w => w.length > 4);
        const actionWords = actionText.split(/\s+/);
        // Check how many goal words appear in action
        const matches = goalWords.filter(gw => actionWords.some(aw => aw.includes(gw) || gw.includes(aw))).length;
        return goalWords.length > 0 ? matches / goalWords.length : 0.5;
    }
    detectDrift(goalText, actionText, contextText) {
        let driftScore = 0;
        // Check for off-topic keywords
        const offTopicPatterns = [
            /unrelated/i,
            /different topic/i,
            /let's change/i,
            /forget about/i,
            /ignore/i,
            /instead/i
        ];
        const combinedText = actionText + ' ' + contextText;
        const hasOffTopic = offTopicPatterns.some(pattern => pattern.test(combinedText));
        if (hasOffTopic)
            driftScore += 0.3;
        // Check for technology mismatch (e.g., goal says REST, action says GraphQL)
        const techMismatches = this.detectTechMismatch(goalText, actionText);
        if (techMismatches)
            driftScore += 0.4;
        // Check if action mentions goal at all
        const mentionsGoal = goalText.split(/\s+/).some(word => word.length > 4 && actionText.includes(word));
        if (!mentionsGoal && actionText.length > 20) {
            driftScore += 0.3;
        }
        return Math.min(1, driftScore);
    }
    detectTechMismatch(goalText, actionText) {
        const techPairs = [
            ['rest', 'graphql'],
            ['typescript', 'javascript'],
            ['postgresql', 'mysql'],
            ['react', 'vue'],
            ['api', 'graphql']
        ];
        const goalLower = goalText.toLowerCase();
        const actionLower = actionText.toLowerCase();
        for (const [tech1, tech2] of techPairs) {
            const goalHas1 = goalLower.includes(tech1);
            const goalHas2 = goalLower.includes(tech2);
            const actionHas1 = actionLower.includes(tech1);
            const actionHas2 = actionLower.includes(tech2);
            // Mismatch if goal mentions one tech but action mentions the other
            if ((goalHas1 && actionHas2 && !goalHas2) || (goalHas2 && actionHas1 && !goalHas1)) {
                return true;
            }
        }
        return false;
    }
    generateReasoning(alignmentScore, keywordOverlap, goalTermMatch, driftScore, planGoal, currentAction) {
        const parts = [];
        if (alignmentScore >= 0.7) {
            parts.push("The current action aligns well with the plan goal.");
        }
        else if (alignmentScore >= 0.5) {
            parts.push("The current action is somewhat aligned with the plan goal.");
        }
        else {
            parts.push("The current action shows signs of drifting from the plan goal.");
        }
        if (keywordOverlap < 0.3) {
            parts.push("There is limited overlap between the goal and current action keywords.");
        }
        if (driftScore > 0.5) {
            parts.push("Significant drift indicators detected.");
        }
        return parts.join(' ') || "Alignment assessment completed.";
    }
    generateSuggestion(planGoal, currentAction, driftScore) {
        if (driftScore > 0.5) {
            return `Consider refocusing on the plan goal: "${planGoal}". The current action may be diverging from the intended path.`;
        }
        // Extract key terms from goal to suggest focus
        const goalWords = planGoal.split(/\s+/).filter(w => w.length > 4).slice(0, 3);
        return `Try to incorporate these goal-related concepts: ${goalWords.join(', ')}.`;
    }
}
