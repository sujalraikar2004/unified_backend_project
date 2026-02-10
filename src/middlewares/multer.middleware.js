import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use /tmp directory for Vercel serverless, or local public/temp for development
const getTempDir = () => {
    // In production (Vercel), use /tmp which is the only writable directory
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
        return '/tmp';
    }
    
    // In development, use local public/temp directory
    const localTempDir = path.join(process.cwd(), 'public', 'temp');
    
    // Ensure the directory exists in development
    if (!fs.existsSync(localTempDir)) {
        fs.mkdirSync(localTempDir, { recursive: true });
    }
    
    return localTempDir;
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const tempDir = getTempDir();
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Keep original file extension
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

export const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        // Accept images and videos
        const allowedMimes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            'video/mp4',
            'video/mpeg',
            'video/quicktime'
        ];
        
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid file type. Only images (JPEG, PNG, GIF, WebP) and videos (MP4, MPEG, MOV) are allowed.`), false);
        }
    }
});