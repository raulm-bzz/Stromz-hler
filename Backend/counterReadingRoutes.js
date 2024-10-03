const express = require('express');
const counterReadings = require('./schema/counterReadingSchema');
const mongo = require("mongodb")
const {json} = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const result = await counterReadings.find();
        res.json(result);
    } catch (err) {
        res.status(500).json({message: err.message});
    }
})

router.get("/:id", async (req, res)=>{
    try {
        const result = await counterReadings.findOne({"_id": req.params.id});
        res.json(result);
    } catch (err) {
        res.status(500).json({message: err.message});
    }
})


// @Raul so apasse das es inepasst, mit filereader
router.post('/upload', async (req, res) => {
    const files = req.files; // Get the uploaded files

    if (!files || files.length === 0) {
        return res.status(400).send('No files uploaded.');
    }

    // Process each uploaded file

});

module.exports = router;