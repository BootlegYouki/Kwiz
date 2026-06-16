import React from 'react';
import { View, StyleSheet } from 'react-native';

interface TuiRetroBordersProps {
  borderColor: string;
  legendWidth: number;
  leftOffset?: number;
}

export const TuiRetroBorders: React.FC<TuiRetroBordersProps> = ({
  borderColor,
  legendWidth,
  leftOffset = 12,
}) => {
  return (
    <>
      <View style={[styles.borderLeft, { backgroundColor: borderColor }]} />
      <View style={[styles.borderRight, { backgroundColor: borderColor }]} />
      <View style={[styles.borderBottom, { backgroundColor: borderColor }]} />
      <View style={[styles.borderTopLeft, { backgroundColor: borderColor, width: leftOffset }]} />
      <View
        style={[
          styles.borderTopRight,
          {
            backgroundColor: borderColor,
            left: leftOffset + legendWidth,
          },
        ]}
      />
    </>
  );
};

const styles = StyleSheet.create({
  borderLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 1.5,
    zIndex: 5,
  },
  borderRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 1.5,
    zIndex: 5,
  },
  borderBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1.5,
    zIndex: 5,
  },
  borderTopLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: 1.5,
    zIndex: 5,
  },
  borderTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: 1.5,
    zIndex: 5,
  },
});
