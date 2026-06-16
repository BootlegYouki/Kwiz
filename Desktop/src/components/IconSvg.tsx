import React from 'react';

export const IconSvg: React.FC<React.SVGProps<SVGSVGElement> & { color?: string }> = ({
  color = 'currentColor',
  ...props
}) => {
  return (
    <svg
      viewBox="0 0 100 100"
      width="100%"
      height="100%"
      fill="none"
      {...props}
    >
      {/* Outer retro monitor shell */}
      <rect
        x="5"
        y="10"
        width="90"
        height="70"
        rx="0"
        stroke={color}
        strokeWidth="6"
        fill="none"
      />
      {/* Screen area */}
      <rect
        x="12"
        y="17"
        width="76"
        height="56"
        rx="0"
        fill={color}
        fillOpacity="0.08"
        stroke={color}
        strokeWidth="2"
      />
      {/* Stand neck */}
      <path
        d="M 40 80 L 60 80 L 65 92 L 35 92 Z"
        fill="none"
        stroke={color}
        strokeWidth="6"
      />
      {/* Stand base */}
      <path
        d="M 20 92 L 80 92"
        stroke={color}
        strokeWidth="6"
      />
      {/* Terminal prompt symbol '>_' */}
      <path
        d="M 22 35 L 34 45 L 22 55"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <rect
        x="38"
        y="50"
        width="15"
        height="5"
        fill={color}
      />
    </svg>
  );
};
