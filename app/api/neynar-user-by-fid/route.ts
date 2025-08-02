import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fid = searchParams.get('fid');

  if (!fid) {
    return NextResponse.json({ error: 'FID parameter is required' }, { status: 400 });
  }

  try {
    // Check if API key is available
    const apiKey = process.env.NEYNAR_API_KEY;
    console.log('API Key exists:', !!apiKey);
    console.log('API Key length:', apiKey ? apiKey.length : 0);
    
    if (!apiKey) {
      console.error('NEYNAR_API_KEY is not set in environment variables');
      return NextResponse.json({ 
        error: 'API key not configured',
        message: 'Please set NEYNAR_API_KEY in Vercel Environment Variables'
      }, { status: 500 });
    }

    console.log('Making request to Neynar API with FID:', fid);
    
    // Make request to Neynar API to get user data by FID
    const response = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'api_key': apiKey,
      },
    });

    console.log('Neynar API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Neynar API error response:', errorText);
      throw new Error(`Neynar API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Neynar API response data:', data);

    // Extract user data from response
    const user = data?.users?.[0];

    if (!user) {
      console.log('No user found in response');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      fid: user.fid,
      username: user.username,
      displayName: user.displayName,
      pfp: user.pfp,
      followerCount: user.followerCount,
      followingCount: user.followingCount,
      verifications: user.verifications,
      custodyAddress: user.custodyAddress,
      activeStatus: user.activeStatus,
      created_at: user.created_at || new Date().toISOString(), // Fallback for created_at
      // Add detailed wallet information
      custody_address: user.custodyAddress,
      verified_addresses: user.verifications || [],
      eth_addresses: user.verifications?.filter((addr: string) => addr.startsWith('0x')) || [],
      sol_addresses: user.verifications?.filter((addr: string) => !addr.startsWith('0x')) || []
    });

  } catch (error) {
    console.error('Error fetching user data from Neynar:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch user data', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 