import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size } = await params
  const iconSize = parseInt(size, 10) || 192

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: iconSize * 0.55,
          background: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: iconSize * 0.15,
          color: 'white',
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        E
      </div>
    ),
    {
      width: iconSize,
      height: iconSize,
    }
  )
}
