import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.abumiral.workflow',
  appName: 'AbuMiral',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
    StatusBar: {
      overlaysWebView: true,
      style: 'DEFAULT',
    },
  },
  server: {
    url: 'https://task-five-sable.vercel.app',
    cleartext: false,
  },
};

export default config;