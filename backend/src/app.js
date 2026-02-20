import dotenv  from 'dotenv'
dotenv.config();
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const app = express();
const corsOrigin = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) : ['http://localhost:5173','http://localhost:3000'];

app.use(cors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders:['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400
}));

app.use(express.json({limit: '16kb'}));
app.use(express.urlencoded({ extended: true, limit: '16kb'}))
app.use(express.static('public'));
app.use(cookieParser());

export { app };