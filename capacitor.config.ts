import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.abumiral.workflow', // Changed app ID
  appName: 'AbuMiral', // Changed app name
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