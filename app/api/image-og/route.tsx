import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  // Fetch the hero image
  const heroImage = await fetch(new URL('/hero.png', 'http://localhost:3000')).then(
    (res) => res.arrayBuffer(),
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: '600px',
          height: '400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background image */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url(data:image/png;base64,${Buffer.from(heroImage).toString('base64')})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        
        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 1,
            color: 'white',
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              margin: '0 0 16px 0',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
              letterSpacing: '2px',
            }}
          >
            Based
          </h1>
          <p
            style={{
              fontSize: '24px',
              margin: '0',
              opacity: 0.9,
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
              letterSpacing: '1px',
            }}
          >
            Your Farcaster Mini App
          </p>
        </div>
      </div>
    ),
    {
      width: 600,
      height: 400,
    }
  );
} 