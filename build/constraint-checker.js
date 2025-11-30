/**
 * Constraint Checker - Semantic constraint validation
 */
export class ConstraintChecker {
    checkConstraints(constraints, output, context) {
        // Parse constraints (split by comma, semicolon, or newline)
        const constraintList = this.parseConstraints(constraints);
        const violations = [];
        const outputLower = output.toLowerCase();
        const contextLower = context?.toLowerCase() || '';
        // Check each constraint
        for (const constraint of constraintList) {
            const violation = this.checkConstraint(constraint, output, outputLower, contextLower);
            if (violation) {
                violations.push(violation);
            }
        }
        const passed = violations.length === 0;
        const reasoning = this.generateReasoning(constraints, output, violations, passed);
        return {
            passed,
            violations,
            reasoning
        };
    }
    parseConstraints(constraints) {
        // Split by common delimiters
        return constraints
            .split(/[,;\n]/)
            .map(c => c.trim())
            .filter(c => c.length > 0);
    }
    checkConstraint(constraint, output, outputLower, contextLower) {
        const constraintLower = constraint.toLowerCase().trim();
        // Handle negative constraints (must NOT have something)
        if (constraintLower.startsWith('no ') || constraintLower.startsWith('don\'t ') ||
            constraintLower.startsWith('must not ') || constraintLower.startsWith('should not ')) {
            const forbidden = constraintLower.replace(/^(no|don't|must not|should not)\s+/, '');
            const forbiddenWords = this.extractKeywords(forbidden);
            // Check if forbidden terms appear in output
            const hasForbidden = forbiddenWords.some(word => outputLower.includes(word));
            if (hasForbidden) {
                return {
                    constraint,
                    explanation: `Constraint violated: "${constraint}". The output contains "${forbidden}" which is forbidden.`
                };
            }
            return null; // Constraint satisfied
        }
        // Handle positive constraints (must have something)
        if (constraintLower.startsWith('must ') || constraintLower.startsWith('should ') ||
            constraintLower.startsWith('include ') || constraintLower.startsWith('use ')) {
            const required = constraintLower.replace(/^(must|should|include|use)\s+/, '');
            const requiredWords = this.extractKeywords(required);
            // Check if required terms appear in output
            const hasRequired = requiredWords.some(word => outputLower.includes(word));
            if (!hasRequired) {
                return {
                    constraint,
                    explanation: `Constraint violated: "${constraint}". The output does not clearly include "${required}".`
                };
            }
            return null; // Constraint satisfied
        }
        // Handle technology/language constraints
        if (constraintLower.includes('typescript') || constraintLower.includes('ts')) {
            const hasTypeScript = outputLower.includes('typescript') ||
                outputLower.includes('.ts') ||
                outputLower.includes('interface ') ||
                outputLower.includes('type ');
            if (!hasTypeScript) {
                return {
                    constraint,
                    explanation: `Constraint violated: "${constraint}". The output does not indicate TypeScript usage.`
                };
            }
        }
        if (constraintLower.includes('javascript') || constraintLower.includes('js')) {
            const hasJavaScript = outputLower.includes('javascript') ||
                outputLower.includes('.js');
            if (!hasJavaScript && !outputLower.includes('typescript')) {
                return {
                    constraint,
                    explanation: `Constraint violated: "${constraint}". The output does not indicate JavaScript usage.`
                };
            }
        }
        // Handle error handling constraint
        if (constraintLower.includes('error handling') || constraintLower.includes('error')) {
            const hasErrorHandling = outputLower.includes('error') ||
                outputLower.includes('try') ||
                outputLower.includes('catch') ||
                outputLower.includes('exception');
            if (!hasErrorHandling) {
                return {
                    constraint,
                    explanation: `Constraint violated: "${constraint}". The output does not mention error handling.`
                };
            }
        }
        // Handle testing constraint
        if (constraintLower.includes('test') || constraintLower.includes('spec')) {
            const hasTests = outputLower.includes('test') ||
                outputLower.includes('spec') ||
                outputLower.includes('describe') ||
                outputLower.includes('it(');
            if (!hasTests) {
                return {
                    constraint,
                    explanation: `Constraint violated: "${constraint}". The output does not mention tests.`
                };
            }
        }
        // Generic check: if constraint mentions specific terms, check if they appear
        const constraintWords = this.extractKeywords(constraintLower);
        if (constraintWords.length > 0) {
            const hasConstraintTerms = constraintWords.some(word => outputLower.includes(word));
            if (!hasConstraintTerms && constraintWords.length > 2) {
                // Only flag if constraint has multiple meaningful words
                return {
                    constraint,
                    explanation: `Constraint may be violated: "${constraint}". The output does not clearly address this constraint.`
                };
            }
        }
        return null; // Constraint satisfied or unclear
    }
    extractKeywords(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 2);
    }
    generateReasoning(constraints, output, violations, passed) {
        if (passed) {
            return `All constraints are satisfied. The output meets the specified requirements: ${constraints}`;
        }
        if (violations.length === 1) {
            return `One constraint violation found: ${violations[0].constraint}. ${violations[0].explanation}`;
        }
        return `${violations.length} constraint violations found. The output does not fully meet the specified requirements: ${constraints}`;
    }
}
