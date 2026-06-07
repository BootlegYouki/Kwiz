import React from 'react';
import { AppRegistry, StyleSheet, Text, View } from 'react-native';

function ShareExtension() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>TUI Share Extension</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  text: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
});

AppRegistry.registerComponent('shareExtension', () => ShareExtension);
