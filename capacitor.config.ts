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
    // For live reload, set this to your computer's IP address on your local network.
    // You can find this on macOS by holding the Option key and clicking the Wi-Fi icon,
    // or on Windows by checking your network settings.
    // Replace 192.168.1.100 with your actual IP address
    url: 'http://192.168.1.100:3000',
    cleartext: true,
  },
};

export default config;