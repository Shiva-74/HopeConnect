const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process');
const mongoose = require('mongoose');
const morgan = require('morgan');

const connectDB = require('./config/db');
const { initBlockchain } = require('./config/blockchain');

// Load env vars
dotenv.config();

let aiServiceProcess = null;

// --- startAIService function (Keep your existing function here) ---
const startAIService = () => {
    const aiServiceDir = path.resolve(__dirname, '../hopeconnect-ai/src');
    const aiScript = path.join(aiServiceDir, 'app.py');
    const pythonExecutable = process.env.PYTHON_EXECUTABLE || 'python';
    console.log(`Attempting to start AI service with: ${pythonExecutable} ${aiScript}`);
    console.log(`AI Service working directory: ${aiServiceDir}`);
    aiServiceProcess = spawn(pythonExecutable, [aiScript], {
        cwd: aiServiceDir,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, PYTHONUNBUFFERED: "1" }
    });
    aiServiceProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        console.log(`[AI Service STDOUT]: ${output}`);
        if (output.includes(`Running on ${process.env.AI_SERVICE_URL}`) || output.includes("Running on http://127.0.0.1:5050")) {
            console.log("AI Service appears to be up and running!");
        }
    });
    aiServiceProcess.stderr.on('data', (data) => {
        console.error(`[AI Service STDERR]: ${data.toString().trim()}`);
    });
    aiServiceProcess.on('close', (code) => {
        console.log(`AI service process exited with code ${code}`);
        aiServiceProcess = null;
        if (code !== 0 && code !== null) console.error('AI service terminated unexpectedly.');
    });
    aiServiceProcess.on('error', (err) => {
        console.error('Failed to start AI service process:', err);
        aiServiceProcess = null;
    });
    if (aiServiceProcess.pid) console.log(`AI service process spawned with PID: ${aiServiceProcess.pid}`);
    else console.error('AI service process failed to spawn. Check Python path, script location, and AI script for errors.');
};
// --- End of startAIService function ---


// --- stopAIService function (Keep your existing function here) ---
const stopAIService = (callback) => {
    if (aiServiceProcess && aiServiceProcess.pid && !aiServiceProcess.killed) {
        console.log('Stopping AI service...');
        const killed = aiServiceProcess.kill('SIGTERM');
        if (killed) console.log("SIGTERM sent to AI process.");
        else console.error("Failed to send SIGTERM to AI process.");
        const killTimeout = setTimeout(() => {
            if (aiServiceProcess && aiServiceProcess.pid && !aiServiceProcess.killed) {
                console.warn('AI service did not terminate gracefully via SIGTERM, sending SIGKILL.');
                aiServiceProcess.kill('SIGKILL');
            }
        }, 5000);
        aiServiceProcess.once('close', () => {
            clearTimeout(killTimeout);
            console.log('AI service process confirmed closed.');
            aiServiceProcess = null;
            if (callback) callback();
        });
    } else {
        console.log('AI service not running or already stopped.');
        if (callback) callback();
    }
};
// --- End of stopAIService function ---


async function startServer() {
    console.log("Initializing HopeConnect backend server...");
    startAIService();
    await connectDB();
    initBlockchain();

    const app = express();

    // Core Middleware
    app.use(cors());
    app.use(express.json());

    // DEBUGGING: Absolute Test Route (You can keep or remove this after testing)
    app.all('/test-absolute-path', (req, res) => {
        console.log(`<<<<< ABSOLUTE TEST PATH /test-absolute-path HIT >>>>> Method: ${req.method}, Path: ${req.originalUrl}`);
        res.status(200).send(`Absolute test path /test-absolute-path reached with method: ${req.method}`);
    });

    // HTTP request logger middleware (Morgan)
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
        app.use(morgan('dev'));
    } else {
        app.use(morgan('short'));
    }

    // Ensure the temporary direct handler for /api/hospital/request-organ is REMOVED or COMMENTED OUT
    /*
    app.post('/api/hospital/request-organ', (req, res) => {
        console.log("<<<<< DEBUG: Direct /api/hospital/request-organ in server.js HIT >>>>>");
        res.status(200).json({ message: "This direct handler should be commented out now!" });
    });
    */

    // API Routes
    app.use('/api/auth', require('./routes/authRoutes'));
    app.use('/api/donors', require('./routes/donorRoutes'));
    app.use('/api/hospital', require('./routes/hospitalRoutes')); // <--- ENSURE THIS IS UNCOMMENTED AND CORRECT
    app.use('/api/tracking', require('./routes/trackingRoutes'));
    app.use('/api/tokens', require('./routes/tokenRoutes'));

    // Root route
    app.get('/', (req, res) => {
        console.log("<<<<< Root / route hit by GET request! >>>>>");
        res.send('HopeConnect API is alive and running!');
    });

    // Catch-all for 404s - AFTER all valid routes
    app.use((req, res, next) => {
        console.log(`<<<<< 404 Handler: Route not found - ${req.method} ${req.originalUrl} >>>>>`);
        const error = new Error(`Not Found - ${req.originalUrl}`);
        // res.status(404); // Set status here or let global error handler do it
        // next(error);
        // For a simple 404 message directly without passing to global error handler:
        res.status(404).json({ message: `Cannot ${req.method} ${req.originalUrl}` });
    });

    // Global error handler - VERY LAST app.use()
    app.use((err, req, res, next) => {
        const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode) || 500;
        console.error(`<<<<< Global Error Handler Caught (Status ${statusCode}): ${err.message} >>>>>`);
        if (process.env.NODE_ENV === 'development') { // Provide stack in development
            console.error(err.stack);
        }
        res.status(statusCode).send({
            message: err.message || 'Internal Server Error',
            // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        });
    });


    const PORT = process.env.PORT || 3001;
    const serverInstance = app.listen(PORT, () => {
        console.log(`Backend server running on port ${PORT}`);
        console.log(`AI Service should be accessible at: ${process.env.AI_SERVICE_URL}`);
        console.log(`Ethereum Node configured for: ${process.env.ETH_NODE_URL}`);
    });

    // Graceful shutdown logic
    const shutdown = (signal) => {
        console.log(`\n${signal} signal received. Starting graceful shutdown...`);
        stopAIService(() => {
            console.log('AI service has been requested to stop.');
            serverInstance.close(() => {
                console.log('HTTP server closed.');
                mongoose.connection.close(false).then(() => {
                    console.log('MongoDB connection closed.');
                    console.log('Graceful shutdown complete. Exiting.');
                    process.exit(0);
                }).catch(err => {
                    console.error('Error closing MongoDB connection during shutdown:', err);
                    process.exit(1);
                });
            });
        });
        setTimeout(() => {
            console.error('Graceful shutdown timed out. Forcefully shutting down.');
            process.exit(1);
        }, 10000);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch(error => {
    console.error("Critical error during server startup:", error);
    stopAIService(() => process.exit(1));
});