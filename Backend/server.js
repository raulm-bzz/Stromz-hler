const express = require("express");
const app = express();
const {connect} = require("mongoose");
const entries = require('./schema/entrySchema.js');
const counterReadings = require('./schema/counterReadingSchema.js');
const entryRoutes = require("./entryRoutes.js");
const counterReadingRoutes = require("./counterReadingRoutes")
const webRoutes = require("./websiteRoutes");
const cors = require("cors");
const fs = require("fs");
const path = require("path");



app.use(express.json())

app.use("/api/entries/", entryRoutes);
app.use("/api/counterReadings/", counterReadingRoutes)
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
function insertData(road) {
    // Read the directory for files
    fs.readdir(road, (error, files) => {
        if (error) {
            console.error('Error reading directory:', error);
            return;
        }

        // Filter for JSON files
        const jsonFiles = files.filter(file => path.extname(file) === '.json');

        // Process each JSON file
        jsonFiles.forEach(file => {
            const filePath = path.join(road, file);
            fs.readFile(filePath, 'utf-8', async (err, data) => {
                if (err) {
                    console.error(`Error reading file ${filePath}:`, err);
                    return;
                }
                try {
                    const jsonData = JSON.parse(data);
                    // Check if the type is Consumption or Production
                    const entry = new entries(jsonData);
                    await entry.save();
                    console.log(`Inserted entry from ${filePath}`);
                } catch (error) {
                    console.error(`Error processing file ${filePath}:`, error);
                }
            });
        });
    });
}



async function createModels() {
    await insertData("C:\\Users\\Leand\\WebstormProjects\\Stromz-hler\\Backend\\Converted_SDAT_Files")
    const counterReading = new counterReadings({
        _id: "2019-02-01T00:00:00",
        consumptionHigh: 7642,
        consumptionLow: 6624,
        productionHigh: 8943,
        productionLow: 7853
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