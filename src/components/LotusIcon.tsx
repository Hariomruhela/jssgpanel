import type { SVGProps } from "react"

export function LotusIcon({ className = "size-5", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Center petal */}
      <path
        d="M12 3.8C10.2 7.3 9.8 11.3 12 16.8C14.2 11.3 13.8 7.3 12 3.8Z"
        fill="currentColor"
        fillOpacity="0.18"
      />
      {/* Left inner petal */}
      <path
        d="M12 16.8C8.5 15.6 6.5 12.3 7.5 8.3C9.5 10.5 11 13.3 12 16.8Z"
        fill="currentColor"
        fillOpacity="0.12"
      />
      {/* Right inner petal */}
      <path
        d="M12 16.8C15.5 15.6 17.5 12.3 16.5 8.3C14.5 10.5 13 13.3 12 16.8Z"
        fill="currentColor"
        fillOpacity="0.12"
      />
      {/* Left outer petal */}
      <path
        d="M12 17.3C7.2 17.3 4 14.5 3.5 10.8C6.3 11.8 9.3 13.3 12 17.3Z"
        fill="currentColor"
        fillOpacity="0.08"
      />
      {/* Right outer petal */}
      <path
        d="M12 17.3C16.8 17.3 20 14.5 20.5 10.8C17.7 11.8 14.7 13.3 12 17.3Z"
        fill="currentColor"
        fillOpacity="0.08"
      />
      {/* Base curve */}
      <path d="M7 19.8C10.2 21 13.8 21 17 19.8" strokeWidth="1.5" />
    </svg>
  )
}
export default LotusIcon
