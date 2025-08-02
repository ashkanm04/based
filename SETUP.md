# Setup Guide

## Neynar API Key Setup

To use the Farcaster wallet functionality, you need to set up a Neynar API key:

1. **Get API Key**: Visit [https://neynar.com/](https://neynar.com/) and sign up for an API key

2. **Create Environment File**: Create a `.env.local` file in the root directory with:
   ```
   NEYNAR_API_KEY=your_actual_api_key_here
   ```

3. **Restart Development Server**: After adding the API key, restart your development server:
   ```bash
   npm run dev
   ```

## Current Issue

The app is currently showing 500 errors because the Neynar API key is not configured. Once you add the API key to `.env.local`, the wallet data should load correctly.

## Debug Information

From the console logs, we can see:
- ✅ Farcaster context is working (FID: 14730)
- ✅ User data is available (username: ashkan1001)
- ❌ Neynar API calls are failing (500 error)
- ❌ No wallet data is being displayed

The issue is that the Neynar API key is missing from the environment variables. 