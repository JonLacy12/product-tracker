import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.weekthink.producttracker',
  appName: 'Product Tracker',
  webDir: 'dist',
  server: {
    url: 'http://192.168.1.149:5173',
    cleartext: true,
  },
};

export default config;
