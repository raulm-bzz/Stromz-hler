const fs = require('fs');
const xml2js = require('xml2js');
const path = require("path");

const parser = new xml2js.Parser();

async function readSDAT(fileBuffer) {
    return new Promise((resolve, reject) => {
        // Convert the buffer to a string
        const data = fileBuffer.toString('utf8');

        // Parse the XML string
        parser.parseString(data, (err, result) => {
            if (err) {
                console.error('Error parsing XML:', err);
                return reject(err);
            }

            const raw_jsonOutput = JSON.stringify(result, null, 2);
            let json_string_fixed = raw_jsonOutput.replace(/'/g, '"');
            let jsonObject = JSON.parse(json_string_fixed);

            function replaceSingleValue(obj) {
                for (let key in obj) {
                    if (Array.isArray(obj[key]) && obj[key].length === 1) {
                        obj[key] = obj[key][0];
                    }
                }
            }

            // Identify meter data number
            let metered_data_num = Object.keys(jsonObject).find(key => key.startsWith('rsm:ValidatedMeteredData_'))?.split('_')[1] || null;

            // Skip processing if not found
            if (!metered_data_num) {
                return reject(new Error(`No valid meter data found in the provided XML.`));
            }

            let type = {};
            let file_name_type = "";
            try {
                if ("rsm:ConsumptionMeteringPoint" in jsonObject[`rsm:ValidatedMeteredData_${metered_data_num}`]["rsm:MeteringData"][0]) {
                    type = { type: "Consumption" };
                    file_name_type = "CONS";
                } else if ("rsm:ProductionMeteringPoint" in jsonObject[`rsm:ValidatedMeteredData_${metered_data_num}`]["rsm:MeteringData"][0]) {
                    type = { type: "Production" };
                    file_name_type = "PROD";
                }
            } catch (err) {
                console.log('Error during type detection:', err.message);
                return reject(err);
            }

            let interval = jsonObject[`rsm:ValidatedMeteredData_${metered_data_num}`]["rsm:MeteringData"][0]["rsm:Interval"][0];
            interval["StartDateTime"] = interval["rsm:StartDateTime"];
            delete interval["rsm:StartDateTime"];
            interval["EndDateTime"] = interval["rsm:EndDateTime"];
            delete interval["rsm:EndDateTime"];
            replaceSingleValue(interval);

            let resolution = jsonObject[`rsm:ValidatedMeteredData_${metered_data_num}`]["rsm:MeteringData"][0]["rsm:Resolution"][0];
            resolution["Resolution"] = resolution["rsm:Resolution"];
            delete resolution["rsm:Resolution"];
            resolution["Unit"] = resolution["rsm:Unit"];
            delete resolution["rsm:Unit"];
            replaceSingleValue(resolution);

            let observations = jsonObject[`rsm:ValidatedMeteredData_${metered_data_num}`]["rsm:MeteringData"][0]["rsm:Observation"];
            observations = observations.map((obs, index) => {
                const sequence = index + 1;
                const volume = parseFloat(obs["rsm:Volume"]);
                return { Sequence: sequence, Volume: volume };
            });

            const final = Object.assign({}, type, interval, resolution, { observations });
            console.log(final)
            resolve(final);
        });
    });
}


async function readSDATFromDirectory(files) {
    const results = [];

    for (const file of files) {
        console.log(files)
        console.log(file)
        if (file.originalname.endsWith('.xml')) {
            const jsonData = await readSDAT(file.buffer.toString('utf-8'));
            results.push(jsonData);
        }
    }
    return results;
}

module.exports = {
    readSDAT,
    readSDATFromDirectory
};
