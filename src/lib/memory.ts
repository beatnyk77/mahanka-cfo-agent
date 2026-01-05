import { getFirestoreDb } from './firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

export interface UserMemory {
    last_actions: string[];
    known_risks: string[];
    preferences: {
        alert_frequency: string;
        format: string;
        [key: string]: any;
    };
}

const DEFAULT_MEMORY: UserMemory = {
    last_actions: [],
    known_risks: [],
    preferences: {
        alert_frequency: 'weekly',
        format: 'WhatsApp+PDF',
    },
};

export async function getUserMemory(userId: string): Promise<UserMemory> {
    try {
        const db = getFirestoreDb();
        const docRef = doc(db, 'user_memory', userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as UserMemory;
        } else {
            await setDoc(docRef, DEFAULT_MEMORY);
            return DEFAULT_MEMORY;
        }
    } catch (error) {
        console.error('Error fetching user memory:', error);
        return DEFAULT_MEMORY;
    }
}

export async function addActionToMemory(userId: string, action: string) {
    try {
        const db = getFirestoreDb();
        const docRef = doc(db, 'user_memory', userId);
        await updateDoc(docRef, {
            last_actions: arrayUnion(action)
        });
    } catch (error) {
        console.error('Error updating user memory:', error);
    }
}

export async function logAgentAction(userId: string, step: string, tool: string, input: any, output: any, confidence: string) {
    try {
        const db = getFirestoreDb();
        const ledgerRef = doc(db, 'agent_ledger', `${userId}_${Date.now()}`);
        await setDoc(ledgerRef, {
            userId,
            step,
            tool,
            input,
            output,
            confidence,
            timestamp: new Date().toISOString(),
            status: tool.includes('gst') || tool.includes('alert') ? 'Frozen in Beta' : 'Success'
        });
    } catch (error) {
        console.error('Error logging agent action:', error);
    }
}
