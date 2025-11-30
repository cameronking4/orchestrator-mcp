/**
 * Context Manager - Semantic memory for storing and retrieving information
 */

import { semanticSimilarity, findBestMatches } from './utils/similarity.js';

export interface MemoryItem {
  id: string;
  what: string;
  details?: string;
  timestamp: number;
}

export interface RecallResult {
  what: string;
  details?: string;
  relevance: number;
}

export class ContextManager {
  private memory: MemoryItem[] = [];
  private nextId = 1;

  remember(what: string, details?: string): { remembered: boolean; id: string } {
    const id = `mem_${this.nextId++}`;
    const item: MemoryItem = {
      id,
      what,
      details,
      timestamp: Date.now()
    };
    this.memory.push(item);
    return { remembered: true, id };
  }

  recall(query: string, limit: number = 3): { results: RecallResult[] } {
    if (this.memory.length === 0) {
      return { results: [] };
    }

    // Combine what and details for matching
    const getText = (item: MemoryItem) => 
      item.details ? `${item.what} ${item.details}` : item.what;

    const matches = findBestMatches(query, this.memory, getText, limit);

    return {
      results: matches.map(match => ({
        what: match.item.what,
        details: match.item.details,
        relevance: match.score
      }))
    };
  }

  getAll(): { items: MemoryItem[] } {
    return { items: [...this.memory] };
  }

  clear(): void {
    this.memory = [];
    this.nextId = 1;
  }
}

