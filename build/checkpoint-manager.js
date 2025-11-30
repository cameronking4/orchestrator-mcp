/**
 * Checkpoint Manager - Save and restore plan state
 */
import { findBestMatches } from './utils/similarity.js';
export class CheckpointManager {
    orchestrator;
    checkpoints = [];
    nextId = 1;
    constructor(orchestrator) {
        this.orchestrator = orchestrator;
    }
    createCheckpoint(name, description) {
        const id = `cp_${this.nextId++}`;
        const state = this.orchestrator.getPlanState();
        const checkpoint = {
            id,
            name,
            description,
            state: JSON.parse(JSON.stringify(state)), // Deep clone
            timestamp: Date.now()
        };
        this.checkpoints.push(checkpoint);
        return { checkpoint_id: id };
    }
    listCheckpoints() {
        return {
            checkpoints: this.checkpoints.map(cp => ({
                id: cp.id,
                name: cp.name,
                description: cp.description
            }))
        };
    }
    restoreCheckpoint(checkpointId, description) {
        let checkpoint;
        if (checkpointId) {
            // Restore by exact ID
            checkpoint = this.checkpoints.find(cp => cp.id === checkpointId);
        }
        else if (description) {
            // Restore by semantic match
            const getText = (cp) => cp.description ? `${cp.name} ${cp.description}` : cp.name;
            const matches = findBestMatches(description, this.checkpoints, getText, 1);
            if (matches.length > 0 && matches[0].score > 0.3) {
                checkpoint = matches[0].item;
            }
        }
        if (!checkpoint) {
            return {
                success: false,
                message: checkpointId
                    ? `Checkpoint ${checkpointId} not found.`
                    : `No checkpoint found matching: ${description}`
            };
        }
        // Restore state
        try {
            const cpState = checkpoint.state;
            if (!cpState || cpState.error) {
                return {
                    success: false,
                    message: `Checkpoint "${checkpoint.name}" has invalid state.`
                };
            }
            // Restore orchestrator state
            this.orchestrator.restoreState(cpState);
            return {
                success: true,
                message: `Checkpoint "${checkpoint.name}" restored successfully.`
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Error restoring checkpoint: ${error.message}`
            };
        }
    }
    getCheckpoint(checkpointId) {
        return this.checkpoints.find(cp => cp.id === checkpointId);
    }
    clear() {
        this.checkpoints = [];
        this.nextId = 1;
    }
}
