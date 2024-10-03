const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['Consumption', 'Produktion'],
        required: true
    },
    resolution: {
        type: Number,
        required: true
    },
    unit: {
        type: String,
        enum: ['SEC', 'MIN', 'HOUR', 'DAY'],
        required: true
    },
    observations: [{
        sequence: {
            type: Number,
            required: true
        },
        volume: {
            type: Number,
            required: true
        }
    }]
});

const entry = mongoose.model("entries", entrySchema);

module.exports = entry;
