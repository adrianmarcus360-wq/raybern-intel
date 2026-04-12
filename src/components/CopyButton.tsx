'use client'
import { useState } from 'react'

interface CopyButtonProps {
  text: string
  label?: string
}

export function CopyButton({ text, label = 'Copy' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  return (
    <button
      onClick={handleCopy}
      className="px-2.5 py-1 rounded text-xs font-medium border transition-all"
      style={copied
        ? { background: '#DCFCE7', color: '#166534', borderColor: '#86EFAC' }
        : { background: 'var(--tan-dark)', color: 'var(--text-muted)', borderColor: 'var(--border)' }
      }>
      {copied ? '✓ Copied' : label}
    </button>
  )
}
