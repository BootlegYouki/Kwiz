import React from 'react';
import Svg, { Rect, SvgProps } from 'react-native-svg';
import { useTheme } from '../theme/theme-provider';

export const KwizIcon: React.FC<SvgProps & { color?: string; size?: number }> = ({
  color,
  size = 18,
  style,
  ...props
}) => {
  const { colors, isDark } = useTheme();
  const mainColor = color || colors.primary;
  const innerColor = isDark ? '#000000' : colors.background;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      style={style}
      {...props}
    >
      <Rect x="3" y="2" width="1" height="1" fill={mainColor} />
      <Rect x="4" y="2" width="1" height="1" fill={mainColor} />
      <Rect x="5" y="2" width="1" height="1" fill={mainColor} />
      <Rect x="6" y="2" width="1" height="1" fill={mainColor} />
      <Rect x="7" y="2" width="1" height="1" fill={mainColor} />
      <Rect x="8" y="2" width="1" height="1" fill={mainColor} />
      <Rect x="9" y="2" width="1" height="1" fill={mainColor} />
      <Rect x="10" y="2" width="1" height="1" fill={mainColor} />
      <Rect x="3" y="3" width="1" height="1" fill={mainColor} />
      <Rect x="4" y="3" width="1" height="1" fill={mainColor} />
      <Rect x="5" y="3" width="1" height="1" fill={mainColor} />
      <Rect x="6" y="3" width="1" height="1" fill={mainColor} />
      <Rect x="7" y="3" width="1" height="1" fill={mainColor} />
      <Rect x="8" y="3" width="1" height="1" fill={mainColor} />
      <Rect x="9" y="3" width="1" height="1" fill={mainColor} />
      <Rect x="10" y="3" width="1" height="1" fill={mainColor} />
      <Rect x="11" y="3" width="1" height="1" fill={mainColor} />
      <Rect x="3" y="4" width="1" height="1" fill={mainColor} />
      <Rect x="4" y="4" width="1" height="1" fill={mainColor} />
      <Rect x="5" y="4" width="1" height="1" fill={mainColor} />
      <Rect x="6" y="4" width="1" height="1" fill={mainColor} />
      <Rect x="7" y="4" width="1" height="1" fill={mainColor} />
      <Rect x="8" y="4" width="1" height="1" fill={mainColor} />
      <Rect x="9" y="4" width="1" height="1" fill={innerColor} />
      <Rect x="10" y="4" width="1" height="1" fill={mainColor} />
      <Rect x="11" y="4" width="1" height="1" fill={mainColor} />
      <Rect x="12" y="4" width="1" height="1" fill={mainColor} />
      <Rect x="3" y="5" width="1" height="1" fill={mainColor} />
      <Rect x="4" y="5" width="1" height="1" fill={innerColor} />
      <Rect x="5" y="5" width="1" height="1" fill={mainColor} />
      <Rect x="6" y="5" width="1" height="1" fill={innerColor} />
      <Rect x="7" y="5" width="1" height="1" fill={mainColor} />
      <Rect x="8" y="5" width="1" height="1" fill={innerColor} />
      <Rect x="9" y="5" width="1" height="1" fill={innerColor} />
      <Rect x="10" y="5" width="1" height="1" fill={innerColor} />
      <Rect x="11" y="5" width="1" height="1" fill={mainColor} />
      <Rect x="12" y="5" width="1" height="1" fill={mainColor} />
      <Rect x="3" y="6" width="1" height="1" fill={mainColor} />
      <Rect x="4" y="6" width="1" height="1" fill={mainColor} />
      <Rect x="5" y="6" width="1" height="1" fill={mainColor} />
      <Rect x="6" y="6" width="1" height="1" fill={mainColor} />
      <Rect x="7" y="6" width="1" height="1" fill={mainColor} />
      <Rect x="8" y="6" width="1" height="1" fill={mainColor} />
      <Rect x="9" y="6" width="1" height="1" fill={innerColor} />
      <Rect x="10" y="6" width="1" height="1" fill={mainColor} />
      <Rect x="11" y="6" width="1" height="1" fill={mainColor} />
      <Rect x="12" y="6" width="1" height="1" fill={mainColor} />
      <Rect x="3" y="7" width="1" height="1" fill={mainColor} />
      <Rect x="4" y="7" width="1" height="1" fill={mainColor} />
      <Rect x="5" y="7" width="1" height="1" fill={mainColor} />
      <Rect x="6" y="7" width="1" height="1" fill={mainColor} />
      <Rect x="7" y="7" width="1" height="1" fill={mainColor} />
      <Rect x="8" y="7" width="1" height="1" fill={mainColor} />
      <Rect x="9" y="7" width="1" height="1" fill={mainColor} />
      <Rect x="10" y="7" width="1" height="1" fill={mainColor} />
      <Rect x="11" y="7" width="1" height="1" fill={mainColor} />
      <Rect x="12" y="7" width="1" height="1" fill={mainColor} />
      <Rect x="3" y="8" width="1" height="1" fill={mainColor} />
      <Rect x="4" y="8" width="1" height="1" fill={mainColor} />
      <Rect x="5" y="8" width="1" height="1" fill={mainColor} />
      <Rect x="6" y="8" width="1" height="1" fill={mainColor} />
      <Rect x="7" y="8" width="1" height="1" fill={mainColor} />
      <Rect x="8" y="8" width="1" height="1" fill={mainColor} />
      <Rect x="9" y="8" width="1" height="1" fill={innerColor} />
      <Rect x="10" y="8" width="1" height="1" fill={mainColor} />
      <Rect x="11" y="8" width="1" height="1" fill={mainColor} />
      <Rect x="12" y="8" width="1" height="1" fill={mainColor} />
      <Rect x="3" y="9" width="1" height="1" fill={mainColor} />
      <Rect x="4" y="9" width="1" height="1" fill={mainColor} />
      <Rect x="5" y="9" width="1" height="1" fill={mainColor} />
      <Rect x="6" y="9" width="1" height="1" fill={mainColor} />
      <Rect x="7" y="9" width="1" height="1" fill={mainColor} />
      <Rect x="8" y="9" width="1" height="1" fill={mainColor} />
      <Rect x="9" y="9" width="1" height="1" fill={mainColor} />
      <Rect x="10" y="9" width="1" height="1" fill={mainColor} />
      <Rect x="11" y="9" width="1" height="1" fill={mainColor} />
      <Rect x="12" y="9" width="1" height="1" fill={mainColor} />
      <Rect x="3" y="10" width="1" height="1" fill={mainColor} />
      <Rect x="4" y="10" width="1" height="1" fill={mainColor} />
      <Rect x="5" y="10" width="1" height="1" fill={mainColor} />
      <Rect x="6" y="10" width="1" height="1" fill={mainColor} />
      <Rect x="7" y="10" width="1" height="1" fill={mainColor} />
      <Rect x="8" y="10" width="1" height="1" fill={mainColor} />
      <Rect x="9" y="10" width="1" height="1" fill={innerColor} />
      <Rect x="10" y="10" width="1" height="1" fill={mainColor} />
      <Rect x="11" y="10" width="1" height="1" fill={mainColor} />
      <Rect x="12" y="10" width="1" height="1" fill={mainColor} />
      <Rect x="3" y="11" width="1" height="1" fill={mainColor} />
      <Rect x="4" y="11" width="1" height="1" fill={mainColor} />
      <Rect x="5" y="11" width="1" height="1" fill={mainColor} />
      <Rect x="6" y="11" width="1" height="1" fill={mainColor} />
      <Rect x="7" y="11" width="1" height="1" fill={mainColor} />
      <Rect x="8" y="11" width="1" height="1" fill={mainColor} />
      <Rect x="9" y="11" width="1" height="1" fill={mainColor} />
      <Rect x="10" y="11" width="1" height="1" fill={mainColor} />
      <Rect x="11" y="11" width="1" height="1" fill={mainColor} />
      <Rect x="12" y="11" width="1" height="1" fill={mainColor} />
      <Rect x="3" y="12" width="1" height="1" fill={mainColor} />
      <Rect x="4" y="12" width="1" height="1" fill={mainColor} />
      <Rect x="5" y="12" width="1" height="1" fill={mainColor} />
      <Rect x="6" y="12" width="1" height="1" fill={mainColor} />
      <Rect x="7" y="12" width="1" height="1" fill={mainColor} />
      <Rect x="8" y="12" width="1" height="1" fill={mainColor} />
      <Rect x="9" y="12" width="1" height="1" fill={innerColor} />
      <Rect x="10" y="12" width="1" height="1" fill={mainColor} />
      <Rect x="11" y="12" width="1" height="1" fill={mainColor} />
      <Rect x="12" y="12" width="1" height="1" fill={mainColor} />
      <Rect x="3" y="13" width="1" height="1" fill={mainColor} />
      <Rect x="4" y="13" width="1" height="1" fill={mainColor} />
      <Rect x="5" y="13" width="1" height="1" fill={mainColor} />
      <Rect x="6" y="13" width="1" height="1" fill={mainColor} />
      <Rect x="7" y="13" width="1" height="1" fill={mainColor} />
      <Rect x="8" y="13" width="1" height="1" fill={mainColor} />
      <Rect x="9" y="13" width="1" height="1" fill={mainColor} />
      <Rect x="10" y="13" width="1" height="1" fill={mainColor} />
      <Rect x="11" y="13" width="1" height="1" fill={mainColor} />
      <Rect x="12" y="13" width="1" height="1" fill={mainColor} />
    </Svg>
  );
};
