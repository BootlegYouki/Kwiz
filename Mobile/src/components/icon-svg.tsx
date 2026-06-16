import React from 'react';
import Svg, { Rect, Path, SvgProps } from 'react-native-svg';

export const IconSvg: React.FC<SvgProps & { color?: string }> = ({
  color = '#000000',
  width = 120,
  height = 120,
  ...props
}) => {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      fill="none"
      {...props}
    >
      {/* Outer retro monitor shell */}
      <Rect
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
      <Rect
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
      <Path
        d="M 40 80 L 60 80 L 65 92 L 35 92 Z"
        fill="none"
        stroke={color}
        strokeWidth="6"
      />
      {/* Stand base */}
      <Path
        d="M 20 92 L 80 92"
        stroke={color}
        strokeWidth="6"
      />
      {/* Terminal prompt symbol '>_' */}
      <Path
        d="M 22 35 L 34 45 L 22 55"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <Rect
        x="38"
        y="50"
        width="15"
        height="5"
        fill={color}
      />
    </Svg>
  );
};
