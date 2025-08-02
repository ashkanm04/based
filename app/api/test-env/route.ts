import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const apiKey = process.env.NEYNAR_API_KEY;
  
  return NextResponse.json({
    apiKeyExists: !!apiKey,
    apiKeyLength: apiKey ? apiKey.length : 0,
    apiKeyPreview: apiKey ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` : 'Not set',
    allEnvVars: Object.keys(process.env).filter(key => key.includes('NEY'))
  });
} 