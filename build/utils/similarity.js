/**
 * Simple text similarity utilities for semantic matching
 * Uses keyword-based similarity - can be upgraded to embeddings later
 */
/**
 * Calculate semantic similarity between two texts (0-1)
 * Uses word overlap and keyword matching
 */
export function semanticSimilarity(text1, text2) {
    if (!text1 || !text2)
        return 0;
    // Normalize: lowercase, remove punctuation, split into words
    const normalize = (text) => text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2); // Filter out very short words
    const words1 = normalize(text1);
    const words2 = normalize(text2);
    if (words1.length === 0 || words2.length === 0)
        return 0;
    // Calculate intersection
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    // Jaccard similarity: intersection / union
    const union = new Set([...set1, ...set2]);
    const jaccard = intersection.size / union.size;
    // Also consider word order similarity for better matching
    let orderScore = 0;
    if (words1.length > 0 && words2.length > 0) {
        const commonWords = Array.from(intersection);
        if (commonWords.length > 0) {
            // Check if common words appear in similar positions
            const positions1 = commonWords.map(w => words1.indexOf(w));
            const positions2 = commonWords.map(w => words2.indexOf(w));
            const avgDiff = positions1.reduce((sum, p1, i) => sum + Math.abs(p1 - positions2[i]), 0) / commonWords.length;
            orderScore = Math.max(0, 1 - avgDiff / Math.max(words1.length, words2.length));
        }
    }
    // Combine Jaccard and order similarity
    return (jaccard * 0.7 + orderScore * 0.3);
}
/**
 * Find best matches from a list of items based on semantic similarity
 */
export function findBestMatches(query, items, getText, limit = 3) {
    return items
        .map(item => ({
        item,
        score: semanticSimilarity(query, getText(item))
    }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .filter(result => result.score > 0.1); // Only return if some similarity
}
