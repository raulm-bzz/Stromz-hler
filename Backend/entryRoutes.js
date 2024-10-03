const express = require('express');
const entries = require('./schema/entrySchema.js');
const mongo = require("mongodb")
const {json} = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const result = await entries.find();
        res.json(result);
    } catch (err) {
        res.status(500).json({message: err.message});
    }
})

router.get("/:id", async (req, res)=>{
    try {
        const result = await entries.findOne({"_id": req.params.id});
        res.json(result);
    } catch (err) {
        res.status(500).json({message: err.message});
    }
})

module.exports = router;