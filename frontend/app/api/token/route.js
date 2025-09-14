import { getAccessToken, withApiAuthRequired } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';

const GET = withApiAuthRequired(async function GET(req) {
  try {
    const { accessToken } = await getAccessToken(req, new NextResponse());
    
    return NextResponse.json({ accessToken });

  } catch (error) {
    console.error("Error in /api/token:", error);
    return NextResponse.json(
      { error: 'Failed to get access token', details: error.message },
      { status: 500 }
    );
  }
});

export { GET };

