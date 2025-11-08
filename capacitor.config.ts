import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.abumiral.workflow',
  appName: 'Workflow',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
    StatusBar: {
      style: 'DEFAULT',
      backgroundColor: '#ffffff'
    },
  },
  server: {
    // Use production Vercel URL instead of local development server
    url: 'https://task-five-sable.vercel.app',
    cleartext: false,
  },
};

export default config;