import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.jadelobstersprint',
  appName: 'jade-lobster-sprint',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
    // Add Status Bar configuration
    StatusBar: {
      style: 'DEFAULT', // Let the system decide based on the theme
      backgroundColor: '#161616', // Set a dark background for the status bar area in dark mode (or primary color)
      androidBackgroundColor: '#161616',
      iosStatusBarStyles: 'light',
    },
  },
};

export default config;