const express = require("express");
const app = express();
const {connect} = require("mongoose");
const entries = require('./schema/entrySchema.js');
const counterReadings = require('./schema/counterReadingSchema.js');
const entryRoutes = require("./entryRoutes.js");
const webRoutes = require("./websiteRoutes");
const cors = require("cors");
const fs = require("fs");
const path = require("path");



app.use(express.json())

app.use("/api/entries/", entryRoutes);
app.use("/", webRoutes)

connect("mongodb://127.0.0.1:27017/Stromz-hler", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log('MongoDB connected');
        return createModels();
    })
    .catch(err => console.log(err));

//road is just path but diffrent name
function insertTestdata(road){
    fs.readdir(road, (error, files) => {
        if (error) {
            return console.error('Error reading directory:', error);
        }

        // Iterate through each file
        files.forEach(async (file) => {
            try {
                const filePath = path.join(road, file);

                // Read and require the JSON file dynamically
                const json = require(filePath);

                // Create a new entry based on the JSON data
                const entry = new entries(json);

                // Save the entry to the database
                const savedEntry = await entry.save();
                console.log('Successfully saved:', filePath);
            } catch (error) {
                console.error('Error processing file:', file, 'Error:', error);
            }
        });
    });
}

async function createModels() {
    //await insertTestdata("C:\\Users\\Leand\\WebstormProjects\\Stromz-hler\\SDAT_Files")
    const counterReading = new counterReadings({
        _id: "that is a date LOL",
        consumptionHigh: 7342,
        consumptionLow: 6324,
        productionHigh: 8943,
        productionLow: 7953
    });
    try {
        const savedEntry2 = await counterReading.save();
        console.log('Created: ', savedEntry2);
    } catch (error) {
        console.error('Error creating:', error);
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});