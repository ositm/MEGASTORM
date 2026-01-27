
import { firebaseConfig } from '../src/firebase/config';

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Checking Firebase Config...');
console.log('apiKey:', firebaseConfig.apiKey ? 'Present' : 'Missing');
console.log('authDomain:', firebaseConfig.authDomain ? 'Present' : 'Missing');
console.log('projectId:', firebaseConfig.projectId ? 'Present' : 'Missing');
console.log('Full Config:', JSON.stringify(firebaseConfig, null, 2));

try {
    const { initializeApp } = require('firebase/app');
    const app = initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully with config.');
} catch (error) {
    console.error('Firebase initialization FAILED with config:', error);
}
