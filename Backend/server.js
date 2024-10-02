const express = require("express");
const app = express();
const {connect} = require("mongoose");
const entries = require('./schema/entrySchema.js');
const counterReadings = require('./schema/counterReadingSchema.js');
const Routes = require("./entryRoutes.js")

const cors = require("cors")

app.use(cors({
    origin: "http://localhost:63342",
}));

app.use(express.json())

app.use("/api/entries/", Routes)

connect("mongodb://127.0.0.1:27017/Stromz-hler", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log('MongoDB connected');
        return createModels();
    })
    .catch(err => console.log(err));

async function createModels() {
    const entry = new entries({
        _id: '2019-03-12T23:00:00Z' + 'P',
        type: 'Produktion',
        timeInterval:{resolution: 15, unit: 'MIN'
        },
        observations: [
            { sequence: 1, volume: 3 },
            { sequence: 2, volume: 2.7 },
            { sequence: 3, volume: 3 },
            { sequence: 4, volume: 1.8 },
            { sequence: 5, volume: 0.9 },
            { sequence: 6, volume: 0.6 },
            { sequence: 7, volume: 0.9 },
            { sequence: 8, volume: 0.6 },
            { sequence: 9, volume: 0.6 },
            { sequence: 10, volume: 0.6 },
            { sequence: 11, volume: 0.9 },
            { sequence: 12, volume: 0.6 },
            { sequence: 13, volume: 0.6 },
            { sequence: 14, volume: 0.9 },
            { sequence: 15, volume: 0.6 },
            { sequence: 16, volume: 0.6 },
            { sequence: 17, volume: 0.9 },
            { sequence: 18, volume: 0.6 },
            { sequence: 19, volume: 0.6 },
            { sequence: 20, volume: 0.9 },
            { sequence: 21, volume: 0.6 },
            { sequence: 22, volume: 0.6 },
            { sequence: 23, volume: 0.6 },
            { sequence: 24, volume: 0.9 },
            { sequence: 25, volume: 1.2 },
            { sequence: 26, volume: 1.5 },
            { sequence: 27, volume: 1.5 },
            { sequence: 28, volume: 2.7 },
            { sequence: 29, volume: 3 },
            { sequence: 30, volume: 4.5 },
            { sequence: 31, volume: 4.2 },
            { sequence: 32, volume: 4.5 },
            { sequence: 33, volume: 4.8 },
            { sequence: 34, volume: 5.4 },
            { sequence: 35, volume: 4.5 },
            { sequence: 36, volume: 4.2 },
            { sequence: 37, volume: 3.9 },
            { sequence: 38, volume: 3.9 },
            { sequence: 39, volume: 4.5 },
            { sequence: 40, volume: 4.2 },
            { sequence: 41, volume: 4.8 },
            { sequence: 42, volume: 5.1 },
            { sequence: 43, volume: 4.2 },
            { sequence: 44, volume: 4.2 },
            { sequence: 45, volume: 4.2 },
            { sequence: 46, volume: 2.1 },
            { sequence: 47, volume: 0.6 },
            { sequence: 48, volume: 0.3 },
            { sequence: 49, volume: 0 },
            { sequence: 50, volume: 0 },
            { sequence: 51, volume: 0.3 },
            { sequence: 52, volume: 0.3 },
            { sequence: 53, volume: 0 },
            { sequence: 54, volume: 0 },
            { sequence: 55, volume: 0.3 },
            { sequence: 56, volume: 0.3 },
            { sequence: 57, volume: 0.3 },
            { sequence: 58, volume: 0.3 },
            { sequence: 59, volume: 0.6 },
            { sequence: 60, volume: 1.5 },
            { sequence: 61, volume: 0 },
            { sequence: 62, volume: 2.1 },
            { sequence: 63, volume: 0.9 },
            { sequence: 64, volume: 0.3 },
            { sequence: 65, volume: 0.9 },
            { sequence: 66, volume: 0.6 },
            { sequence: 67, volume: 0.6 },
            { sequence: 68, volume: 0.9 },
            { sequence: 69, volume: 0.6 },
            { sequence: 70, volume: 0.6 },
            { sequence: 71, volume: 0.6 },
            { sequence: 72, volume: 0.9 },
            { sequence: 73, volume: 1.2 },
            { sequence: 74, volume: 1.2 },
            { sequence: 75, volume: 2.4 },
            { sequence: 76, volume: 2.1 },
            { sequence: 77, volume: 3 },
            { sequence: 78, volume: 2.7 },
            { sequence: 79, volume: 1.2 },
            { sequence: 80, volume: 0.9 },
            { sequence: 81, volume: 0.9 },
            { sequence: 82, volume: 0.6 },
            { sequence: 83, volume: 0.9 },
            { sequence: 84, volume: 0.6 },
            { sequence: 85, volume: 1.2 },
            { sequence: 86, volume: 0.6 },
            { sequence: 87, volume: 0.9 },
            { sequence: 88, volume: 0.9 },
            { sequence: 89, volume: 1.8 },
            { sequence: 90, volume: 1.2 },
            { sequence: 91, volume: 2.7 },
            { sequence: 92, volume: 2.4 },
            { sequence: 93, volume: 2.7 },
            { sequence: 94, volume: 2.7 },
            { sequence: 95, volume: 2.1 },
            { sequence: 96, volume: 0.6 }
        ]
    });
    const counterReading = new counterReadings({
        _id: "that is a date LOL",
        consumptionHigh: 7342,
        consumptionLow: 6324,
        productionHigh: 8943,
        productionLow: 7953
    });
    try {
        const savedEntry1 = await entry.save();
        const savedEntry2 = await counterReading.save();
        console.log('Created: ', savedEntry2);
        console.log('Created: ', savedEntry1);
    } catch (error) {
        console.error('Error creating:', error);
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});