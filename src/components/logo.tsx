export function Logo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M19 10h-1a7 7 0 0 0-12 0v1h-1a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2z" />
      <path d="M9 10V5a5 5 0 0 1 10 0v5" />
      <path d="M12 15v4" />
      <circle cx="12" cy="17" r="1" />
      {/* Heart Shape Detail */}
      <path d="M12 12c-1-1-2-1-3 0-1 1-1 3 0 4l3 3 3-3c1-1 1-3 0-4-1-1-2-1-3 0z" fill="currentColor" opacity="0.2" stroke="none"/>
    </svg>
  )
}
