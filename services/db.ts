
import { localDbService } from './localService';
import { googleSheetsService } from './googleSheetsService';
import { dbService as supabaseService } from './supabaseClient';
import { firebaseService } from './firebaseService';

// Priority Logic
// 1. Firebase (If configured) - Highest Priority
// 2. Google Sheets
// 3. Local Storage

const isFirebaseConfigured = !!import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY !== 'PLACEHOLDER_FIREBASE_KEY';
const isGoogleSheetsConfigured = !!import.meta.env.VITE_GOOGLE_SHEETS_URL && import.meta.env.VITE_GOOGLE_SHEETS_URL !== 'PLACEHOLDER_SHEETS_URL';

let selectedService = localDbService;
let serviceName = 'Local Storage';

const forceLocal = localStorage.getItem('FORCE_LOCAL_DB') === 'true';

if (!forceLocal && isFirebaseConfigured) {
    selectedService = firebaseService;
    serviceName = 'Firebase Firestore';
} else if (!forceLocal && isGoogleSheetsConfigured) {
    selectedService = googleSheetsService;
    serviceName = 'Google Sheets';
} else if (forceLocal) {
    serviceName = 'Local Storage (Forced)';
}

export const dbService = selectedService;
export const currentServiceName = serviceName;

console.log(`Using Database Service: ${serviceName}`);
