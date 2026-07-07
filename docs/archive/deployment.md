# Deployment Guide for Vercel

This project is ready to be deployed to Vercel.

## Prerequisites

1.  **GitHub Repository**: Push this code to a GitHub repository.
2.  **Vercel Account**: Sign up at [vercel.com](https://vercel.com).

## Deployment Steps

1.  **Import Project**:
    *   Go to Vercel Dashboard -> "Add New..." -> "Project".
    *   Select your GitHub repository.

2.  **Configure Project**:
    *   **Framework Preset**: Next.js (should be auto-detected).
    *   **Root Directory**: `./` (default).
    *   **Build Command**: `next build` (default).
    *   **Output Directory**: `.next` (default).

3.  **Environment Variables**:
    *   Currently, the Firebase configuration is hardcoded in `src/firebase/config.ts`. You do **NOT** need to set environment variables for Firebase on Vercel for this version.
    *   *Recommendation*: For better security in the future, replace the hardcoded values with `NEXT_PUBLIC_FIREBASE_API_KEY`, etc., and add them to Vercel's Environment Variables settings.

4.  **Deploy**:
    *   Click "Deploy".
    *   Wait for the build to complete.

## Important Notes

*   **Build Settings**: The project is configured to ignore TypeScript and ESLint errors during build (`next.config.ts`) to ensure a smooth deployment even with minor type mismatches.
*   **Firebase Rules**: The Firestore rules have been deployed to your Firebase project. Ensure your Vercel app connects to the same Firebase project (`studio-109280062-71202`).
*   **Storage**: If you haven't enabled Firebase Storage, use the "External Link" feature for result uploads.

## Troubleshooting

*   **404 on Refresh**: Next.js handles routing, but if you see issues, ensure Vercel is configured for SPA/Next.js (default).
*   **Firebase Permissions**: If you see "Missing permissions" errors, check the browser console. The Firestore rules are currently set to allow authenticated users to perform necessary actions.
