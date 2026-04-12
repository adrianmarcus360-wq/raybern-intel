'use client'

interface ScoreRingProps {
  score: number
  color: string
  size?: number
}

export default function ScoreRing({ score, color, size = 64 }: ScoreRingProps) {
  const radius = (size - 10) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(score, 100) / 100)
  const fontSize = size < 56 ? 11 : 14

  return (
    <div className="flex flex-col items-center gap-0.5">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#242424"
          strokeWidth={5}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <text
          x={size / 2}
          y={size / 2}
          fill="white"
          fontSize={fontSize}
          className="score-ring-text"
          style={{ transform: 'rotate(90deg)', transformOrigin: `${size / 2}px ${size / 2}px` }}
        >
          {score}
        </text>
      </svg>
      <span style={{ fontSize: 10, color: '#737373', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        Score
      </span>
    </div>
  )
}
