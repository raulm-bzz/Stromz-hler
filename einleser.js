const fs = require('fs');
const xml2js = require('xml2js');
const util = require('util');
const parser = new xml2js.Parser();

function read_SDAT(file_path) {

    fs.readFile(file_path, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading the file:', err);
            return;
        }

        parser.parseString(data, (err, result) => {
            if (err) {
                console.error('Error parsing XML:', err);
                return;
            }

            //turn XML file into String, then into a JSON Object
            const raw_jsonOutput = JSON.stringify(result, null, 2);
            let json_string_fixed = raw_jsonOutput.replace(/'/g, '"');
            let jsonObject = JSON.parse(json_string_fixed)

            // Function to replace single values which are initially saved as an array to turn them into a normal/single key
            function replace_single_value(obj) {
                for (let key in obj) {
                    if (Array.isArray(obj[key]) && obj[key].length === 1) {
                        obj[key] = obj[key][0];
                    }
                }
            }
            // Save start and end times in Interval as JSON Object
            let interval = jsonObject["rsm:ValidatedMeteredData_12"]["rsm:MeteringData"][0]["rsm:Interval"][0]
            interval["StartDateTime"] = interval["rsm:StartDateTime"];
            delete interval["rsm:StartDateTime"];
            interval["EndDateTime"] = interval["rsm:EndDateTime"];
            delete interval["rsm:EndDateTime"];
            replace_single_value(interval)

            // Save the resolution
            let resolution = jsonObject["rsm:ValidatedMeteredData_12"]["rsm:MeteringData"][0]["rsm:Resolution"][0]
            resolution["Resolution"] = resolution["rsm:Resolution"];
            delete resolution["rsm:Resolution"];
            resolution["Unit"] = resolution["rsm:Unit"];
            delete resolution["rsm:Unit"];
            replace_single_value(resolution)

            let observations = jsonObject["rsm:ValidatedMeteredData_12"]["rsm:MeteringData"][0]["rsm:Observation"]
            counter = 1
            for (let key in observations) {
                observations[key].Sequence = counter;
                delete observations[key]["rsm:Position"]
                counter += 1
            }

            for (let key in observations) {
                observations[key]["Volume"] = observations[key]["rsm:Volume"];
                delete observations[key]["rsm:Volume"]
                replace_single_value(observations[key])
                observations[key]["Volume"] = parseFloat(observations[key]["Volume"])
            }
            console.log(interval)
            console.log(resolution)
            console.log(observations)

            fs.writeFile("data.json", json_string_fixed, (error) => {
                    if (error) {
                        console.error(error);
                        throw error;
                    }
                }
            )

        })
    })
}





read_SDAT("SDAT-Files/20190313_093127_12X-0000001216-O_E66_12X-LIPPUNEREM-T_ESLEVU121963_-279617263.xml")