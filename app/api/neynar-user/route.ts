import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address parameter is required' }, { status: 400 });
  }

     try {
     // Make request to Neynar API
    const response = await fetch('https://api.neynar.com/v2/farcaster/user/bulk-by-address', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_key': process.env.NEYNAR_API_KEY || '',
      },
      body: JSON.stringify({
        addresses: [address]
      })
    });

    if (!response.ok) {
      throw new Error(`Neynar API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract user data from response
    const user = data?.result?.user;
    
    if (!user) {
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
      created_at: user.created_at || new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching user data from Neynar:', error);
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
  }
} 