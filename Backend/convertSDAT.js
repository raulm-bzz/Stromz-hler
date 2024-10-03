const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

const parser = new xml2js.Parser();

// Function to validate and parse date
function parseDate(dateString) {
    const parsedDate = new Date(dateString);
    if (isNaN(parsedDate.getTime())) {
        throw new Error(`Invalid time value: ${dateString}`);
    }
    return parsedDate;
}

// Function to convert SDAT XML content to JSON object
async function readSDAT(fileContent) {
    return new Promise((resolve, reject) => {
        parser.parseString(fileContent, (err, result) => {
            if (err) {
                console.error('Error parsing XML:', err);
                return reject(err);
            }

            const raw_jsonOutput = JSON.stringify(result, null, 2);
            const json_string_fixed = raw_jsonOutput.replace(/'/g, '"');
            const jsonObject = JSON.parse(json_string_fixed);

            // Logic to extract data from the parsed JSON object...
            // (Similar to your existing logic to extract type, resolution, unit, and observations)

            resolve(jsonObject); // Resolve with the processed JSON object
        });
    });
}

// Function to process each SDAT file from the uploaded files
async function processSDATFile(file) {
    try {
        console.log(`Processing file: ${file.originalname}`);

        const fileContent = file.buffer.toString('utf-8'); // Read from buffer

        const inputJson = await readSDAT(fileContent); // Read and parse SDAT
        console.log('Parsed JSON:', inputJson);

        if (!inputJson.observations || !Array.isArray(inputJson.observations)) {
            console.error(`No observations found in ${file.originalname}`);
            return;
        }

        const resolution = parseInt(inputJson.Resolution);
        const unit = inputJson.Unit;
        const observations = inputJson.observations.map(obs => ({
            Sequence: obs.Sequence,
            Volume: obs.Volume
        }));

        console.log(`Found ${observations.length} observations for file ${file.originalname}`);

        // Validate StartDateTime and EndDateTime
        console.log('StartDateTime:', inputJson.StartDateTime);
        console.log('EndDateTime:', inputJson.EndDateTime);

        const startDate = parseDate(inputJson.StartDateTime);
        const endDate = parseDate(inputJson.EndDateTime);
        let currentDate = startDate;

        // Calculate intervals per day based on the resolution
        const intervalsPerDay = (24 * 60) / resolution;

        // Loop through each day in the range and create/update output files
        while (currentDate <= endDate) {
            const dateString = currentDate.toISOString().split('T')[0]; // Format YYYY-MM-DD

            // Prepare observations for the current day
            const dailyObservations = observations.slice(0, intervalsPerDay).map((obs, index) => ({
                Sequence: index + 1,
                Volume: obs.Volume
            }));

            observations.splice(0, intervalsPerDay); // Remove processed observations

            if (dailyObservations.length > 0) { // Only create/update if there are observations
                console.log(`Adding observations for date: ${dateString}`);
                createOrUpdateFile(currentDate, inputJson.type, resolution, unit, dailyObservations); // Function to write data
            } else {
                console.log(`No observations to add for date: ${dateString}`);
            }
            currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
        }
    } catch (error) {
        console.error(`Error processing file ${file.originalname}: ${error.message}`);
    }
}

// Function to create or update the output file based on observation date
function createOrUpdateFile(date, type, resolution, unit, observations) {
    const formattedDate = date.toISOString().split('T')[0]; // Format YYYY-MM-DD
    const filePath = path.join(__dirname, 'Converted_SDAT_Files', `${formattedDate}.json`);

    const newEntry = {
        _id: formatDateWithTime(date, type), // Use the correct format for _id
        type: type,
        timeInterval: {
            resolution: resolution,
            unit: unit
        },
        observations: observations.map(obs => ({
            sequence: obs.Sequence,
            volume: obs.Volume
        }))
    };

    let existingData = {};
    if (fs.existsSync(filePath)) {
        console.log(`File already exists, reading existing data from: ${filePath}`);
        const existingContent = fs.readFileSync(filePath, 'utf-8');
        existingData = JSON.parse(existingContent);
    } else {
        console.log(`No existing file found. Creating new file: ${filePath}`);
    }

    // Merge observations without duplicates based on sequence
    const mergedObservations = [...existingData.observations || [], ...newEntry.observations]
        .reduce((acc, current) => {
            const x = acc.find(item => item.sequence === current.sequence);
            if (!x) {
                return acc.concat([current]);
            } else {
                x.volume += current.volume; // Merge volumes if same sequence
                return acc;
            }
        }, [])
        .sort((a, b) => a.sequence - b.sequence);

    existingData = {
        _id: newEntry._id,
        type: newEntry.type,
        timeInterval: newEntry.timeInterval,
        observations: mergedObservations
    };

    // Write the merged data to the file
    try {
        fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
        console.log(`File updated/created successfully: ${filePath}`);
    } catch (err) {
        console.error(`Error writing file to ${filePath}: ${err.message}`);
    }
}

// Function to ensure the output folder exists
function ensureOutputFolderExists(folderPath) {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
        console.log(`Output folder created at: ${folderPath}`);
    }
}

// Ensure the output folder exists
ensureOutputFolderExists(path.join(__dirname, 'Converted_SDAT_Files'));

// Your existing logic to process uploaded files can go here, calling processSDATFile as necessary
