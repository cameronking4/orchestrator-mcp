/**
 * Context Manager - Semantic memory for storing and retrieving information
 */
import { findBestMatches } from './utils/similarity.js';
export class ContextManager {
    memory = [];
    nextId = 1;
    remember(what, details) {
        const id = `mem_${this.nextId++}`;
        const item = {
            id,
            what,
            details,
            timestamp: Date.now()
        };
        this.memory.push(item);
        return { remembered: true, id };
    }
    recall(query, limit = 3) {
        if (this.memory.length === 0) {
            return { results: [] };
        }
        // Combine what and details for matching
        const getText = (item) => item.details ? `${item.what} ${item.details}` : item.what;
        const matches = findBestMatches(query, this.memory, getText, limit);
        return {
            results: matches.map(match => ({
                what: match.item.what,
                details: match.item.details,
                relevance: match.score
            }))
        };
    }
    getAll() {
        return { items: [...this.memory] };
    }
    clear() {
        this.memory = [];
        this.nextId = 1;
    }
}
