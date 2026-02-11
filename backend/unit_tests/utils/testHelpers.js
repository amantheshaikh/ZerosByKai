import express from 'express';

/**
 * Creates a standard Express app instance for route testing.
 * @param {express.Router} router - The router to test
 * @param {string} path - The path prefix for the router
 * @returns {express.Application}
 */
export const createTestApp = (router, path) => {
    const app = express();
    app.use(express.json());
    app.use(path, router);

    // Standard error handler for tests to log details
    app.use((err, req, res, next) => {
        const status = err.status || err.statusCode || 500;
        res.status(status).json({
            error: err.message || 'Internal Server Error',
            status
        });
    });

    return app;
};
