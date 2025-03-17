import express from 'express';
import multer, { memoryStorage } from 'multer';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from "url";

const app = express();
const port = 3000;
const __dirName = path.dirname(fileURLToPath(import.meta.url)).replace("scripts", "");

// Set up file storage for multer
const storage = memoryStorage();
const upload = multer({ storage: storage });

app.use(express.static("public"));

app.get("/", (req, res) => {
    let directoryName = __dirName;
    res.sendFile(path.join(directoryName, "index.html"));
})

app.post('/create-poster', upload.fields([{ name: 'posterImage' }, { name: 'personImage' }]), async (req, res) => {
    try {
        // console.log("Received files:", req.files);
        if (!req.files || !req.files['posterImage'] || !req.files['personImage']) {
            return res.status(400).json({ error: "Missing images!" });
        }
        // console.log("Poster Image:", req.files['posterImage'][0].originalname);
        // console.log("Person Image:", req.files['personImage'][0].originalname);
        const image1 = req.files['posterImage'][0].buffer;
        const image2 = req.files['personImage'][0].buffer;

        // Load images with Sharp
        const img1 = sharp(image1);
        const img2 = sharp(image2);

        const metadata1 = await img1.metadata();
        const metadata2 = await img2.metadata();

        const image1Height = metadata1.height;
        const image1Width = metadata1.width;

        const image2Height = Math.floor(image1Height * 0.28);
        const aspectRatio = metadata2.height > 0 ? metadata2.width / metadata2.height : 1;
        const image2Width = Math.floor(image2Height * aspectRatio);

        // Resize person image
        const resizedImage2 = await img2
            .resize(image2Width, image2Height)
            .png()
            .toBuffer();

        // Validate poster image size
        if (metadata1.width < 600 || metadata1.height < 600) {
            console.log("Poster must be at least 600px X 600px");
            return res.status(400).send({ error: 'Poster must be at least 600px X 600px' });
        }

        // Composite the images
        const img1Buffer = await img1.toBuffer();
        // const img2Buffer = await img2.toBuffer();

        // Calculate position
        const posX = Math.max(image1Width - image2Width - Math.floor(image1Width * 0.10), 0); // 10% from right
        const posY = Math.floor(image1Height * 0.69); // 69% from top

        // Merge person image onto poster image at calculated position
        const result = await sharp(img1Buffer)
            .composite([{ input: resizedImage2, left: posX, top: posY }]) 
            .png()
            .toBuffer();

        // Send the merged image as response
        res.set('Content-Disposition', 'attachment; filename="poster.png"'); 
        res.set('Content-Type', 'image/png');
        res.send(result);
        
    } catch (err) {
        console.error("Error: ", err);
        res.status(500).send({ error: err.message || 'An unknown error occurred while processing the images' });
    }
});

app.get("/in-development", (req, res) => {
    res.sendFile(path.join(__dirName, "htmls", "comingsoon.html"));
});

app.get("/about", (req, res) => {
    res.sendFile(path.join(__dirName, "htmls/", "about.html"));
});

app.get("/contact", (req, res) => {
    res.sendFile(path.join(__dirName, "htmls/", "contact.html"));
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
