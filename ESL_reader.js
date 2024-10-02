// noinspection DuplicatedCode

const fs = require('fs');
const xml2js = require('xml2js');
const parser = new xml2js.Parser();
const path = require("path")
const util = require("util")

function read_ESL(file_path) {

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

            let meterData = jsonObject["ESLBillingData"]["Meter"][0]["TimePeriod"][0]
            const EndDate = meterData["$"]
            console.log(meterData[0])
            let values = meterData["ValueRow"]
            console.log(values[2]["$"])
            console.log(values[3]["$"])
            console.log(values[6]["$"])
            console.log(values[7]["$"])

        })
    })
}

read_ESL("EdmRegisterWertExport_20190131_eslevu_20190322160349.xml")
