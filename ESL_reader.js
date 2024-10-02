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

            console.log(`Reading File -> ${file_path}`)
            let meterData = jsonObject["ESLBillingData"]["Meter"][0]["TimePeriod"][0]
            try{
                let EndDate = meterData["$"]
                let final = EndDate
                EndDate["end"] = EndDate["end"].split("T")[0]
                final["End"] = final["end"]
                delete final["end"]
                let values = meterData["ValueRow"]
                final.MeterReadings = [values[2]["$"], values[3]["$"], values[6]["$"], values[7]["$"]]

                fs.writeFile(`./ESL_Files/ESL_${EndDate["End"]}s.json`, JSON.stringify(final, null, 2), (error) => {
                        if (error) {
                            console.error(error);
                            throw error;
                        }
                    }
                )

            } catch (e){
            }

        })
    })
}

function read_ESL_all(dir_path){
    fs.readdir(dir_path, (error, files) => {
        if (error) {
            return console.error('Error reading directory:', error);
        }

        // Iterate through each file
        files.forEach(file => {
            const filePath = path.join(dir_path, file);
            read_ESL(filePath)

        });
    });
}

read_ESL_all("./ESL-Files")
//read_ESL("./ESL-Files/EdmRegisterWertExport_20190314_eslevu_20190314090341.xml")
