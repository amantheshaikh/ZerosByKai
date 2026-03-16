import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        testTimeout: 20000,
        hookTimeout: 20000,
        reporters: ['verbose'],
        env: {
            EMAIL_TOKEN_SECRET: 'test-secret'
        }
    },
});
