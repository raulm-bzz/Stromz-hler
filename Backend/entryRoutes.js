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
        const result = await entries.findOne({"_id": new mongo.ObjectId(req.params.id)});
        res.json(result);
    } catch (err) {
        res.status(500).json({message: err.message});
    }
})

/*

@Raul, einleser hier einbauen für post

router.post("/", async (req, res) => {
    try {
        delete req.body._id;
        await entries.insertMany([req.body]);
        res.sendStatus(200)
    } catch (err) {
        res.status(500).json({message: err.message});
    }
})
*/

module.exports = router;