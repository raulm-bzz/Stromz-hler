const express = require('express');
const multer = require('multer');
const { readSDAT } = require('./SDAT_readerWithReturn');
const { convertSDAT } = require('./convertSDAT');
const Entry = require('./schema/entrySchema');
const path = require('path');
const router = express.Router();

const storage = multer.memoryStorage();
const uploads = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }
}).array('files');

router.post('/upload', uploads, async (req, res) => {
    try {
        console.log('IT arrived!!');
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).send({ message: 'No files uploaded.' });
        }

        const results = [];
        for (let file of files) {
            if (file.originalname.includes('LIPPUNEREM')) {
                const result = await processFile(file);
                results.push(result);
            }
        }

        return res.status(200).send({ message: `Successfully processed ${results.length} files.` });
    } catch (error) {
        console.error(error); // Log the error for debugging
        return res.status(500).send({ message: 'Server error while processing files.' });
    }
});

async function processFile(file) {
    const fileContent = file.buffer.toString('utf-8');

    const jsonData = await readSDAT(fileContent);
    const convertedData = convertSDAT(jsonData);

    const newEntry = new Entry(convertedData);
    await newEntry.save();

    return file.originalname;
}

module.exports = router;
