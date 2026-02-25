
import { ResearchProject, User } from '../types';

// Replace with your Apps Script URL
const GOOGLE_SHEETS_API_URL = import.meta.env.VITE_GOOGLE_SHEETS_URL || '';


const callSheet = async (action: string, data?: any) => {
    if (!GOOGLE_SHEETS_API_URL) return null;

    try {
        // GET requests for fetching data
        if (action.startsWith('get')) {
            const url = `${GOOGLE_SHEETS_API_URL}?action=${action}`;
            const res = await fetch(url);
            const json = await res.json();
            return json;
        }

        // POST requests for mutation
        const payload: any = { action };
        if (data) payload.data = JSON.stringify(data);

        // Using 'no-cors' mode is often required for simple triggers but prevents reading response.
        // However, Web Apps deployed as 'Me' running for 'Anyone' support standard CORS if the script returns proper headers.
        // The provided script does return standard JSON, so we try standard fetch first.
        // Note: Google Apps Script POST requests often follow a 302 redirect. Fetch handles this automatically.

        const response = await fetch(GOOGLE_SHEETS_API_URL, {
            method: "POST",
            body: JSON.stringify(payload),
            headers: { "Content-Type": "text/plain;charset=utf-8" },
        });

        return await response.json();
    } catch (e) {
        console.error("Google Sheets API Error", e);
        return null;
    }
};


export const googleSheetsService = {
    async getProjects(): Promise<ResearchProject[]> {
        const data = await callSheet('getProjects');
        return Array.isArray(data) ? data : [];
    },

    async saveProject(project: ResearchProject): Promise<ResearchProject> {
        await callSheet('saveProject', project);
        return project;
    },

    async deleteProject(id: string): Promise<void> {
        // We need to send ID via POST
        await fetch(GOOGLE_SHEETS_API_URL, {
            method: "POST",
            body: JSON.stringify({ action: "deleteProject", id })
        });
    },

    async getUsers(): Promise<User[]> {
        const data = await callSheet('getUsers');
        return Array.isArray(data) ? data : [];
    },

    async saveUser(user: User): Promise<User> {
        await callSheet('saveUser', user);
        return user;
    }
};
