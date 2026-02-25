
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const toCamel = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(v => toCamel(v));
    if (obj !== null && typeof obj === 'object') {
        const n: any = {};
        Object.keys(obj).forEach(k => {
            const camelKey = k.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
            n[camelKey] = toCamel(obj[k]);
        });
        return n;
    }
    return obj;
};

const toSnake = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(v => toSnake(v));
    if (obj !== null && typeof obj === 'object') {
        const n: any = {};
        Object.keys(obj).forEach(k => {
            const snakeKey = k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            n[snakeKey] = toSnake(obj[k]);
        });
        return n;
    }
    return obj;
};

const DATE_FIELDS = [
    'contractDate', 'certificateResultDate', 'startDate', 'endDate',
    'extensionDate', 'reviewReportingDate', 'acceptanceMeetingDate',
    'reminderDate', 'acceptanceSubmissionDate', 'acceptanceCompletionDate',
    'settlementCompletionDate', 'leadAuthorBirthYear',
    'progressReportDate1', 'progressReportDate2', 'progressReportDate3', 'progressReportDate4'
];

const sanitizeProject = (project: any) => {
    const cleaned = { ...project };

    // 1. Handle Date Fields: "" -> null
    DATE_FIELDS.forEach(field => {
        if (cleaned[field] === '') {
            cleaned[field] = null;
        }
    });

    // 2. Handle JSON fields: ensure they are arrays
    if (!cleaned.categories) cleaned.categories = [];
    if (!cleaned.expectedProducts) cleaned.expectedProducts = [];
    if (!cleaned.actualProducts) cleaned.actualProducts = [];

    // 3. Ensure required fields are not null/undefined if possible (though frontend handles this)
    if (!cleaned.title) cleaned.title = 'Chưa đặt tên';
    if (!cleaned.leadAuthor) cleaned.leadAuthor = 'Chưa cập nhật';

    return cleaned;
};

export const dbService = {
    // Projects
    async getProjects() {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data ? data.map(toCamel) : [];
    },

    async saveProject(project: any) {
        const sanitized = sanitizeProject(project);
        const snakeProject = toSnake(sanitized);

        const { data, error } = await supabase
            .from('projects')
            .upsert(snakeProject)
            .select();
        if (error) throw error;
        return data ? toCamel(data[0]) : null;
    },

    async deleteProject(id: string) {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // Users
    async getUsers() {
        const { data, error } = await supabase
            .from('users_app')
            .select('*');
        if (error) throw error;
        return data;
    },

    async saveUser(user: any) {
        const { data, error } = await supabase
            .from('users_app')
            .upsert(user)
            .select();
        if (error) throw error;
        return data ? data[0] : null; // No case conversion for users for now if straightforward
    }
};
