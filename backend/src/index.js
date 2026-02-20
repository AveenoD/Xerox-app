import connectDB from "./database/index.js";
import dotenv from "dotenv";
import { app }from './app.js'
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, './.env') });


connectDB()
.then(()=> {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 8000;

    app.listen(PORT, () => {
       console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
})
