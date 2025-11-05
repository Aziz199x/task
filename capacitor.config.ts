import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.jadelobstersprint',
  appName: 'jade-lobster-sprint',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
    // Removed explicit StatusBar configuration here.
    // The StatusBarManager component in src/components/StatusBarManager.tsx
    // will now dynamically control the status bar style based on the app's theme.
  },
};

export default config;