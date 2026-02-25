import { db } from './firebaseService';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { ResearchProject } from '../types';
import { STEP_TEMPLATES } from '../constants/workflow';

export const workflowService = {
    /**
     * Moves the project to the next workflow step.
     */
    async advanceWorkflowStep(projectId: string, currentStep: number, userEmail: string): Promise<void> {
        return this.setWorkflowStep(projectId, currentStep + 1, userEmail);
    },

    /**
     * Reverts the project to the previous workflow step.
     */
    async revertWorkflowStep(projectId: string, currentStep: number, userEmail: string): Promise<void> {
        if (currentStep <= 1) return;
        return this.setWorkflowStep(projectId, currentStep - 1, userEmail, true);
    },

    /**
     * Set the project to a specific workflow step.
     * Use forceRevert if moving backwards is considered a revert action.
     */
    async setWorkflowStep(projectId: string, targetStep: number, userEmail: string, isRevert: boolean = false): Promise<void> {
        const projectRef = doc(db, 'projects', projectId);

        const historyEntry: any = {
            step: targetStep,
            updatedBy: userEmail,
            updatedAt: new Date()
        };

        if (isRevert) {
            historyEntry.action = 'revert';
        } else {
            // Check if jumping forward
            historyEntry.action = 'jump';
        }

        const updateData: any = {
            workflowStep: targetStep,
            workflowStatus: `Step ${targetStep}`,
            workflowHistory: arrayUnion(historyEntry)
        };

        // Only add todos if moving forward or jumping to a step not visited?
        // Let's emulate advance behavior: add todos if templates exist.
        // But if jumping, we might duplicate todos if we revisit.
        // Assuming todos arrayUnion handles "no duplicates" if exact same object, but here we generate new IDs.
        // For simplicity, we add todos. Real system might check if visited.
        const templates = STEP_TEMPLATES[targetStep];
        if (templates && templates.length > 0) {
            const newTodos = templates.map((text, index) => ({
                id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
                step: targetStep,
                text: text,
                completed: false,
                createdAt: new Date().toISOString()
            }));
            // We can't use spread in arrayUnion directly if mixed with other updates concisely in one call without careful typing
            // But actually arrayUnion takes varargs.
            // We will do it separately if needed or construct the object.
            // Firebase limits arrayUnion to unique primitives or objects. IDs are unique so they will be added.
            // But updateDoc helper above had spread.
            // wait, updateDoc(ref, { field: arrayUnion(a, b, c) }) works.
            updateData.workflowTodos = arrayUnion(...newTodos);
        }

        await updateDoc(projectRef, updateData);
    },

    /**
     * Initializes workflow for a project if it doesn't have one.
     */
    async initializeWorkflow(projectId: string, userEmail: string): Promise<void> {
        // Reuse setWorkflowStep logic?
        // initialize is slightly different structure (e.g. creating initial history)
        // keeping existing logic for safety but maybe refactor later.
        const projectRef = doc(db, 'projects', projectId);

        const initialHistory = {
            step: 1,
            updatedBy: userEmail,
            updatedAt: new Date()
        };

        const updateData: any = {
            workflowStep: 1,
            workflowStatus: 'Step 1',
            workflowHistory: arrayUnion(initialHistory)
        };

        const templates = STEP_TEMPLATES[1];
        if (templates && templates.length > 0) {
            const newTodos = templates.map((text, index) => ({
                id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
                step: 1,
                text: text,
                completed: false,
                createdAt: new Date().toISOString()
            }));
            updateData.workflowTodos = arrayUnion(...newTodos);
        }

        await updateDoc(projectRef, updateData);
    },

    /**
     * Update expected dates for a step
     */
    async updateStepDates(projectId: string, step: number, dates: { expectedStart?: string, expectedEnd?: string }): Promise<void> {
        const projectRef = doc(db, 'projects', projectId);
        await updateDoc(projectRef, {
            [`workflowStepDates.${step}`]: dates
        });
    }
};
