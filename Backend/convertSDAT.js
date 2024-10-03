const fs = require('fs');
const path = require('path');

// Define the input folder path containing SDAT files
const inputFolderPath = path.join(__dirname, '../SDAT_Files');

// Define a new output folder path (outside of the input folder)
const outputFolderPath = path.join(__dirname, 'Converted_SDAT_Files');

// Ensure the output folder exists (create if necessary)
function ensureOutputFolderExists(folderPath) {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
        console.log(`Output folder created at: ${folderPath}`);
    }
}

// Ensure the output folder exists
ensureOutputFolderExists(outputFolderPath);

// Function to validate and parse date
function parseDate(dateString) {
    const parsedDate = new Date(dateString);
    if (isNaN(parsedDate.getTime())) {
        throw new Error(`Invalid time value: ${dateString}`);
    }
    return parsedDate;
}

// Helper function to format the date as required
function formatDateWithTime(date, type) {
    if (!(date instanceof Date)) {
        date = parseDate(date); // Ensure the date is a valid Date object
    }
    return `${date.toISOString().split('T')[0]}T23:00:00Z${type.charAt(0).toUpperCase()}`;
}

// Function to create or update the output file based on the observation date
function createOrUpdateFile(date, type, resolution, unit, observations) {
    const formattedDate = date.toISOString().split('T')[0]; // Format only the date YYYY-MM-DD
    const filePath = path.join(outputFolderPath, `${formattedDate}.json`);

    // Ensure the directory exists before writing the file
    console.log(`Ensuring output folder exists: ${outputFolderPath}`);
    ensureOutputFolderExists(outputFolderPath);

    console.log(`Writing file to path: ${filePath}`);

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
                x.volume += current.volume; // Merge the volumes if same sequence
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

// Function to process each SDAT file
function processSDATFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        console.log(`Processing file: ${filePath}`);

        if (!content) {
            console.error(`File is empty: ${filePath}`);
            return;
        }

        let inputJson = JSON.parse(content);
        console.log('Parsed JSON:', inputJson);

        if (!inputJson.observations || !Array.isArray(inputJson.observations)) {
            console.error(`No observations found in ${filePath}`);
            return;
        }

        const resolution = parseInt(inputJson.Resolution);
        const unit = inputJson.Unit;
        const observations = inputJson.observations.map(obs => ({
            Sequence: obs.Sequence,
            Volume: obs.Volume
        }));

        console.log(`Found ${observations.length} observations for file ${filePath}`);

        // Validate and log StartDateTime and EndDateTime
        console.log('StartDateTime:', inputJson.StartDateTime);
        console.log('EndDateTime:', inputJson.EndDateTime);

        const startDate = parseDate(inputJson.StartDateTime);
        const endDate = parseDate(inputJson.EndDateTime);
        let currentDate = startDate;

        // Calculate the number of expected intervals based on the resolution
        const intervalsPerDay = 24 * 60 / resolution;

        // Loop through each day in the range and create/update the output file
        while (currentDate <= endDate) {
            const dateString = currentDate.toISOString().split('T')[0]; // Format YYYY-MM-DD

            // Reset sequence counter for each day
            let sequenceCounter = 1;

            // Prepare observations for the current day based on the intervals
            const dailyObservations = observations.slice(0, intervalsPerDay).map((obs) => ({
                Sequence: sequenceCounter++,
                Volume: obs.Volume
            }));

            // Remove those from the list
            observations.splice(0, intervalsPerDay);

            if (dailyObservations.length > 0) { // Only create the file if there are observations
                console.log(`Adding observations for date: ${dateString}`);
                createOrUpdateFile(currentDate, inputJson.type, resolution, unit, dailyObservations); // Pass currentDate for correct _id format
            } else {
                console.log(`No observations to add for date: ${dateString}`);
            }
            currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
        }
    } catch (error) {
        console.error(`Error processing file ${filePath}: ${error.message}`);
    }
}

// Read all SDAT files from the input folder
fs.readdir(inputFolderPath, (err, files) => {
    if (err) {
        console.error('Error reading directory:', err);
        return;
    }

    const sdatFiles = files.filter(file => path.extname(file) === '.json' || path.extname(file) === '.sdat'); // Adjust the extension here
    console.log(`Found ${sdatFiles.length} SDAT files.`);

    if (sdatFiles.length === 0) {
        console.error('No SDAT files found in the specified directory.');
        return;
    }

    sdatFiles.forEach(file => {
        const filePath = path.join(inputFolderPath, file);
        processSDATFile(filePath);
    });
});
