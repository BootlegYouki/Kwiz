import React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';

interface SplashIconProps extends SvgProps {
  color?: string;
  size?: number;
}

export const SplashIcon: React.FC<SplashIconProps> = ({
  color = '#000000',
  size = 120,
  ...props
}) => {
  return (
    <Svg viewBox="0 0 16 16" width={size} height={size} {...props}>
      {/* Chevron: > */}
      <Path d="M2 3 L8 8 L2 13 L4 13 L10 8 L4 3 Z" fill={color} />
      {/* Underscore: _ */}
      <Path d="M10 12 L15 12 L15 14 L10 14 Z" fill={color} />
    </Svg>
  );
};
