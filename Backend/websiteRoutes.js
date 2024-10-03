const express = require('express');
const entries = require('./schema/entrySchema.js');
const path = require('path');
const mongo = require("mongodb")
const {json} = require("express");
const router = express.Router();


router.use(express.static(path.join(__dirname, '../Frontend')));

router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/main.html'));
});

router.get("/upload", (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/upload.html'));
});



module.exports = router;