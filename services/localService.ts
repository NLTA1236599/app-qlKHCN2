
import { ResearchProject, User } from '../types';

const STORAGE_KEYS = {
    PROJECTS: 'app_projects',
    USERS: 'app_users'
};

const getFromStorage = <T>(key: string, defaultValue: T): T => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading ${key} from localStorage`, error);
        return defaultValue;
    }
};

const saveToStorage = <T>(key: string, value: T): void => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error saving ${key} to localStorage`, error);
    }
};

// Initial simulated data if empty
const INITIAL_USERS: User[] = [
    { username: 'admin', role: 'admin', password: '123@abc' }
];

export const localDbService = {
    // Projects
    async getProjects(): Promise<ResearchProject[]> {
        // Simulate async network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return getFromStorage<ResearchProject[]>(STORAGE_KEYS.PROJECTS, []);
    },

    async saveProject(project: ResearchProject): Promise<ResearchProject> {
        await new Promise(resolve => setTimeout(resolve, 300));
        const projects = getFromStorage<ResearchProject[]>(STORAGE_KEYS.PROJECTS, []);

        const index = projects.findIndex(p => p.id === project.id);
        if (index >= 0) {
            projects[index] = project;
        } else {
            projects.push(project);
        }

        saveToStorage(STORAGE_KEYS.PROJECTS, projects);
        return project;
    },

    async deleteProject(id: string): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 300));
        const projects = getFromStorage<ResearchProject[]>(STORAGE_KEYS.PROJECTS, []);
        const filtered = projects.filter(p => p.id !== id);
        saveToStorage(STORAGE_KEYS.PROJECTS, filtered);
    },

    // Users
    async getUsers(): Promise<User[]> {
        await new Promise(resolve => setTimeout(resolve, 300));
        const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
        if (users.length === 0) {
            saveToStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
            return INITIAL_USERS;
        }
        return users;
    },

    async saveUser(user: User): Promise<User> {
        await new Promise(resolve => setTimeout(resolve, 300));
        const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);

        const index = users.findIndex(u => u.username === user.username);
        if (index >= 0) {
            users[index] = user;
        } else {
            users.push(user);
        }

        saveToStorage(STORAGE_KEYS.USERS, users);
        return user;
    }
};
