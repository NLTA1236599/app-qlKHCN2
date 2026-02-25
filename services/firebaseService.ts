
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, getDoc, doc, setDoc, deleteDoc, query, writeBatch } from "firebase/firestore";
import { ResearchProject, User } from "../types";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

// Firebase configuration using Vite environment variables
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const isConfigured = apiKey && apiKey !== 'PLACEHOLDER_FIREBASE_KEY';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app: any;
let db: any;
let auth: any;
let realFirebaseService: any;

if (isConfigured) {
    try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
    } catch (e) {
        console.error("Firebase init failed:", e);
    }
}

const COLLECTIONS = {
    PROJECTS: "projects",
    USERS: "users"
};

// Mock service for when Firebase is not configured
const mockService = {
    auth: {
        login: async () => { throw new Error("Firebase not configured"); },
        register: async () => { throw new Error("Firebase not configured"); },
        logout: async () => { },
        subscribe: (callback: (user: any) => void) => {
            // Immediately callback null to indicate no user logged in
            callback(null);
            return () => { };
        },
        getUserRole: async () => 'user'
    },
    getProjects: async () => [],
    saveProject: async () => { throw new Error("Firebase not configured"); },
    deleteProject: async () => { throw new Error("Firebase not configured"); },
    getUsers: async () => [],
    saveUser: async () => { throw new Error("Firebase not configured"); },
    importExcelData: async () => { throw new Error("Firebase not configured"); },
    getExcelData: async () => [],
    updateExcelRow: async () => { throw new Error("Firebase not configured"); },
    deleteExcelRow: async () => { throw new Error("Firebase not configured"); },
    deleteExcelCollection: async () => { throw new Error("Firebase not configured"); }
};

if (isConfigured && app) {
    realFirebaseService = {
        auth: {
            login: (email, password) => signInWithEmailAndPassword(auth, email, password),
            register: async (email, password, role) => {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                // Save additional user info to Firestore
                await setDoc(doc(db, COLLECTIONS.USERS, user.uid), {
                    username: email,
                    role: role,
                    uid: user.uid,
                    email: email
                });
                return user;
            },
            logout: () => signOut(auth),
            subscribe: (callback: (user: FirebaseUser | null) => void) => onAuthStateChanged(auth, callback),
            getUserRole: async (uid: string) => {
                const docRef = doc(db, COLLECTIONS.USERS, uid);
                const docSnap = await getDoc(docRef);
                return docSnap.exists() ? docSnap.data().role : 'user';
            }
        },

        // Projects
        async getProjects(): Promise<ResearchProject[]> {
            try {
                const q = query(collection(db, COLLECTIONS.PROJECTS));
                const querySnapshot = await getDocs(q);
                const projects: ResearchProject[] = [];
                querySnapshot.forEach((doc) => {
                    projects.push(doc.data() as ResearchProject);
                });
                // Sort in memory or use orderBy in query if consistent index exists
                return projects.sort((a, b) => (new Date(b.contractDate || 0).getTime() - new Date(a.contractDate || 0).getTime()));
            } catch (error) {
                console.error("Error getting projects from Firebase:", error);
                return [];
            }
        },

        async saveProject(project: ResearchProject): Promise<ResearchProject> {
            try {
                // Use project.id as the document ID
                await setDoc(doc(db, COLLECTIONS.PROJECTS, project.id), project);
                return project;
            } catch (error) {
                console.error("Error saving project to Firebase:", error);
                throw error;
            }
        },

        async deleteProject(id: string): Promise<void> {
            try {
                await deleteDoc(doc(db, COLLECTIONS.PROJECTS, id));
            } catch (error) {
                console.error("Error deleting project from Firebase:", error);
                throw error;
            }
        },

        // Users
        async getUsers(): Promise<User[]> {
            try {
                const querySnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
                const users: User[] = [];
                querySnapshot.forEach((doc) => {
                    users.push(doc.data() as User);
                });
                return users;
            } catch (error) {
                console.error("Error getting users from Firebase:", error);
                return [];
            }
        },

        async saveUser(user: User): Promise<User> {
            try {
                // Use username as the document ID
                await setDoc(doc(db, COLLECTIONS.USERS, user.username), user);
                return user;
            } catch (error) {
                console.error("Error saving user to Firebase:", error);
                throw error;
            }
        },

        // ------------------------------------------------------------------
        // GENERIC EXCEL / DYNAMIC DATA HANDLERS (CRUD)
        // ------------------------------------------------------------------

        /**
         * Create/Import: Uploads an array of objects to a specific collection.
         * Uses batch writes for performance.
         * @param collectionName The name of the collection (e.g. "uploads_2023_01")
         * @param data Array of row objects (key-value pairs)
         */
        async importExcelData(collectionName: string, data: any[]): Promise<void> {
            try {
                const batchSize = 500;
                // Split data into chunks of 500 (Firestore batch limit)
                for (let i = 0; i < data.length; i += batchSize) {
                    const chunk = data.slice(i, i + batchSize);
                    const batch = writeBatch(db);

                    chunk.forEach((row) => {
                        // Create a reference with an auto-generated ID
                        const docRef = doc(collection(db, collectionName));
                        // Add ID to the data if useful, or just save raw
                        batch.set(docRef, { ...row, _id: docRef.id, createdAt: new Date().toISOString() });
                    });

                    await batch.commit();
                }
                console.log(`Successfully imported ${data.length} rows to ${collectionName}`);
            } catch (error) {
                console.error(`Error importing data to ${collectionName}:`, error);
                throw error;
            }
        },

        /**
         * Read: Get all documents from a specific collection
         * @param collectionName 
         */
        async getExcelData(collectionName: string): Promise<any[]> {
            try {
                const querySnapshot = await getDocs(collection(db, collectionName));
                const data: any[] = [];
                querySnapshot.forEach((doc) => {
                    data.push({ ...doc.data(), _id: doc.id });
                });
                return data;
            } catch (error) {
                console.error(`Error reading ${collectionName}:`, error);
                return [];
            }
        },

        /**
         * Update: Update a specific row (document) in the collection
         * @param collectionName 
         * @param docId 
         * @param newData 
         */
        async updateExcelRow(collectionName: string, docId: string, newData: any): Promise<void> {
            try {
                const docRef = doc(db, collectionName, docId);
                await setDoc(docRef, { ...newData, updatedAt: new Date().toISOString() }, { merge: true });
            } catch (error) {
                console.error(`Error updating doc ${docId} in ${collectionName}:`, error);
                throw error;
            }
        },

        /**
         * Delete (Row): Delete a specific row
         * @param collectionName 
         * @param docId 
         */
        async deleteExcelRow(collectionName: string, docId: string): Promise<void> {
            try {
                await deleteDoc(doc(db, collectionName, docId));
            } catch (error) {
                console.error(`Error deleting doc ${docId} in ${collectionName}:`, error);
                throw error;
            }
        },

        /**
         * Delete (File/Collection): Deletes all documents in a collection
         * NOTE: Client-side deletion of large collections is not recommended for production (use Admin SDK),
         * but feasible for smaller imported datasets.
         * @param collectionName 
         */
        async deleteExcelCollection(collectionName: string): Promise<void> {
            try {
                const q = query(collection(db, collectionName));
                const querySnapshot = await getDocs(q);

                const batchSize = 500;
                const docs = querySnapshot.docs;

                for (let i = 0; i < docs.length; i += batchSize) {
                    const batch = writeBatch(db);
                    const chunk = docs.slice(i, i + batchSize);
                    chunk.forEach(d => batch.delete(d.ref));
                    await batch.commit();
                }
                console.log(`Deleted collection ${collectionName}`);
            } catch (error) {
                console.error(`Error deleting collection ${collectionName}:`, error);
                throw error;
            }
        }
    };
}

export { db };
export const firebaseService = realFirebaseService || mockService;
