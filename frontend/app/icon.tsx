import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 32,
  height: 32,
}

export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#000000',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '6px',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 100 100"
          fill="none"
        >
          {/* Left 'r' stem and arch */}
          <path
            d="M25 75V43c0-8 6-11 13-11h12v9H38c-4 0-4 3-4 7v27H25z"
            fill="white"
          />
          {/* Right 'd' stem and base */}
          <path
            d="M59 75V25l10-10v51h9v9H59z"
            fill="white"
          />
          {/* Center diagonal/loop connection */}
          <path
            d="M34 75l25-25v9L46 75H34z"
            fill="white"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
