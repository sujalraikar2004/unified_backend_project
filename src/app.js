import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { ensureDbConnection } from './db/db.js'
import mongoose from 'mongoose'

const app = express()

// Configure CORS to allow frontend origin
app.use(cors({
    credentials: true,
    origin: ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:5137', 'http://localhost:3000', 'http://localhost:4173', process.env.CORS_ORIGIN],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}))

app.use(express.json({
    limit: "16kb"
}))

app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}))

app.use(express.static("public"))

app.use(cookieParser())

// Root route (before DB middleware for quick health check)
app.get('/', (req, res) => {
    res.status(200).json({ 
        success: true,
        message: 'Backend is running successfully!',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    })
})

// Health check route with DB status
app.get('/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState;
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    
    res.status(200).json({ 
        status: 'OK', 
        message: 'Server is running',
        database: states[dbStatus],
        dbReadyState: dbStatus,
        timestamp: new Date().toISOString()
    })
})

// Ensure database connection before all API routes
app.use('/api', ensureDbConnection);

//routes
import userRouter from './routes/user.routes.js'
import galleryRouter from './routes/gallery.routes.js'
import teamRouter from './routes/team.routes.js'
import eventRouter from './routes/event.routes.js'

app.use('/api/v1/auth', userRouter)
app.use('/api/v1/gallery', galleryRouter)
app.use('/api/v1/teams', teamRouter)
app.use('/api/v1/events', eventRouter)

// Global error handler
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors: err.errors || [],
    });
});

export default app
