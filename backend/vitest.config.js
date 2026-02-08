import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        testTimeout: 20000,
        hookTimeout: 20000,
        pool: 'threads',
        poolOptions: {
            threads: {
                singleThread: true,
            },
        },
        reporters: ['verbose'],
    },
});
