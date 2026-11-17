export default function ArchiveArt({
  small = false,
  room = 0,
}: {
  small?: boolean;
  room?: number;
}) {
  return (
    <svg
      className={small ? "archive-art small-art" : "archive-art"}
      viewBox="0 0 640 650"
      fill="none"
      role="img"
      aria-label="An illuminated doorway floating above the steps of a mysterious archive"
    >
      <defs>
        <linearGradient
          id="door"
          x1="320"
          y1="90"
          x2="320"
          y2="510"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#dbb277" />
          <stop offset=".45" stopColor="#655039" />
          <stop offset="1" stopColor="#172224" />
        </linearGradient>
        <linearGradient
          id="light"
          x1="450"
          y1="200"
          x2="180"
          y2="500"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fbd196" stopOpacity=".35" />
          <stop offset="1" stopColor="#fbd196" stopOpacity="0" />
        </linearGradient>
        <linearGradient
          id="floor"
          x1="320"
          y1="420"
          x2="320"
          y2="610"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#4c5045" />
          <stop offset="1" stopColor="#182022" />
        </linearGradient>
        <radialGradient id="halo">
          <stop stopColor="#c69d60" stopOpacity=".18" />
          <stop offset="1" stopColor="#b19065" stopOpacity="0" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>
      <circle cx="330" cy="310" r="286" fill="url(#halo)" />
      <g stroke="#d4b78a" opacity=".12">
        <circle cx="320" cy="312" r="243" strokeDasharray="2 12" />
        <circle cx="320" cy="312" r="260" />
        <path d="M320 40v45M320 548v45M48 312h48M545 312h48" />
      </g>
      <g className="art-stars" fill="#dfc59e">
        <circle cx="114" cy="170" r="1.6" />
        <circle cx="503" cy="184" r="2" />
        <circle cx="456" cy="67" r="1.5" />
        <circle cx="163" cy="372" r="2" />
        <circle cx="523" cy="403" r="1" />
        <circle cx="110" cy="470" r="1.5" />
        <path d="m168 89 2 7 7 2-7 2-2 7-2-7-7-2 7-2ZM526 306l2 7 7 2-7 2-2 7-2-7-7-2 7-2Z" />
      </g>
      <g className="door-float">
        <path
          d="m165 475 155-62 155 62-155 69Z"
          fill="#111a1b"
          stroke="#61604d"
        />
        <path
          d="m165 475 155 69 155-69v18l-155 69-155-69Z"
          fill="#232c2c"
          stroke="#3d443b"
        />
        <path
          d="m192 465 128-51 128 51-128 56Z"
          fill="url(#floor)"
          stroke="#6a6753"
        />
        <path
          d="M222 460V167l98-53 98 53v293l-98 43Z"
          fill="#172122"
          stroke="#756b52"
          strokeWidth="2"
        />
        <path
          d="M236 454V177l84-46 84 46v277l-84 37Z"
          fill="url(#door)"
          stroke="#c5a979"
          strokeWidth="2"
        />
        <path
          d="M250 446V186l70-39 70 39v260l-70 31Z"
          fill="#0d1719"
          stroke="#8a795b"
        />
        <path d="m320 147 70 39v260l-70 31Z" fill="#c2a778" opacity=".07" />
        <path
          d="m267 198 53-29 53 29v222l-53 24-53-24Z"
          stroke="#ad9368"
          opacity=".35"
        />
        <path
          d="m286 217 34-18 34 18v112l-34 15-34-15Z"
          stroke="#ad9368"
          opacity=".25"
        />
        <path d="m320 147 74 38v264l-74 28 88-6V163Z" fill="#060f11" />
        <path d="M394 185v264" stroke="#efce91" strokeWidth="4" />
        <path
          d="M394 185v264"
          stroke="#f8ce8a"
          strokeWidth="12"
          filter="url(#glow)"
        />
        <path d="m394 185-115 361 226-40-111-57Z" fill="url(#light)" />
        <circle cx="354" cy="353" r="12" fill="#a08254" />
        <circle cx="354" cy="351" r="3.5" fill="#151b1c" />
        <path d="m354 351-3 9h6Z" fill="#151b1c" />
        <path
          d="m211 494 109 48 109-48v13l-109 49-109-49Z"
          fill="#35403c"
          stroke="#6c6e56"
        />
        <path
          d="m235 523 85 37 85-37v13l-85 39-85-39Z"
          fill="#2b3633"
          stroke="#4e5747"
        />
        <path
          d="m260 550 60 26 60-26v13l-60 27-60-27Z"
          fill="#26322f"
          stroke="#465144"
        />
        <path d="m320 104 8-16-8-16-8 16Z" stroke="#d0b07c" />
        <path d="M320 72v-22" stroke="#d0b07c" opacity=".4" />
      </g>
      <g className="paper-float" stroke="#b9a07b">
        <path d="m126 264 44-19 27 61-45 20Z" fill="#292c27" />
        <path
          d="m142 267 19-8m-15 16 27-11m-23 20 27-11m-23 20 19-8"
          opacity=".6"
        />
        <path d="m466 365 37 17-24 54-37-17Z" fill="#30312a" />
        <path d="m466 379 23 10m-27 0 23 10m-28 0 18 8" opacity=".6" />
      </g>
      <g
        fill="#c2b18f"
        opacity=".35"
        fontFamily="monospace"
        fontSize="10"
        letterSpacing="3"
      >
        <text x="98" y="553">
          EST. 1897
        </text>
        <text x="464" y="121">
          {["I · III", "II · III", "III · III"][room]}
        </text>
      </g>
    </svg>
  );
}
