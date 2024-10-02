const mongoose = require('mongoose');

const counterReadingsSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
    },
    consumptionHigh: {
        type: Number,
        required: true
    },
    consumptionLow: {
        type: Number,
        required: true
    },
    productionHigh: {
        type: Number,
        required: true
    },
    productionLow: {
        type: Number,
        required: true
    }
});

const counterReading = mongoose.model("counterReading", counterReadingsSchema);

module.exports = counterReading;
