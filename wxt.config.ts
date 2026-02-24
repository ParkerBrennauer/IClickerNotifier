import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    permissions: [  
      'notifications',
    ],
    name: 'iClickerNotifier',
    description: 'A browser extension that notifies students when their iClicker class has started.',
    version: '1.0.0',
  },
});
