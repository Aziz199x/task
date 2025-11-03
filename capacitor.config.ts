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
      style: 'DARK', // Force dark icons/text on light background, or light icons/text on dark background (DEFAULT is usually fine, but let's try DARK)
      backgroundColor: '#161616', // Set a dark background for the status bar area
      androidBackgroundColor: '#161616',
      iosStatusBarStyles: 'light',
      overlay: false, // Crucial: Forces the web view to start below the status bar
    },
  },
};

export default config;