import { db } from './firebaseService';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ResearchProject } from '../types';

export const todoService = {
    /**
     * Add a new todo item for a specific step
     */
    async addTodo(projectId: string, step: number, text: string): Promise<any> {
        const projectRef = doc(db, 'projects', projectId);
        const newTodo = {
            id: Math.random().toString(36).substr(2, 9),
            step,
            text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        await updateDoc(projectRef, {
            workflowTodos: arrayUnion(newTodo)
        });

        return newTodo;
    },

    /**
     * Toggle a todo item's completion status
     * Note: Firestore array manipulation is tricky for updates. 
     * A common robust pattern is to read, modify, and write back the specific array, 
     * or use a separate subcollection. For simplicity in this single-doc model,
     * we might need to overwrite the array or filter/map it if we want to be clean.
     * However, since `ProjectDetail` refreshes the whole object, let's assume we can 
     * just send the modified array if we had it, but here we only have the ID.
     * 
     * Strategy: We will simply assume the UI passes the *entire* updated project or we fetch-update.
     * Actually, `arrayRemove` and `arrayUnion` only work for EXACT object matches. 
     * Updating a property inside an object in an array is not directly supported by Firestore.
     * 
     * SOLUTION: We will read the document, modify the array, and update the field. 
     * This is safer given the structure.
     */
    async toggleTodo(projectId: string, todoId: string, currentTodos: NonNullable<ResearchProject['workflowTodos']>): Promise<void> {
        const projectRef = doc(db, 'projects', projectId);

        const updatedTodos = currentTodos.map(t =>
            t.id === todoId ? { ...t, completed: !t.completed } : t
        );

        await updateDoc(projectRef, {
            workflowTodos: updatedTodos
        });
    },

    /**
     * Update a specific todo item's fields
     */
    async updateTodo(projectId: string, todoId: string, updates: any, currentTodos: NonNullable<ResearchProject['workflowTodos']>): Promise<void> {
        const projectRef = doc(db, 'projects', projectId);
        const updatedTodos = currentTodos.map(t =>
            t.id === todoId ? { ...t, ...updates } : t
        );
        await updateDoc(projectRef, {
            workflowTodos: updatedTodos
        });
    },

    /**
     * Delete a todo item
     */
    async deleteTodo(projectId: string, todoId: string, currentTodos: NonNullable<ResearchProject['workflowTodos']>): Promise<void> {
        const projectRef = doc(db, 'projects', projectId);

        const updatedTodos = currentTodos.filter(t => t.id !== todoId);

        await updateDoc(projectRef, {
            workflowTodos: updatedTodos
        });
    }
};
