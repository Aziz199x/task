import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.abumiral.workflow',
  appName: 'Workflow',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
  server: {
    // For the default Android emulator, the host machine is reachable at 10.0.2.2.
    // Use this when running the Vite dev server locally so the emulator can connect.
    url: 'http://10.0.2.2:3000',
    cleartext: true,
  },
};

export default config;