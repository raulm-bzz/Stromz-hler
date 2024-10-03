const fs = require('fs');
const xml2js = require('xml2js');
const parser = new xml2js.Parser();
const path = require("path")


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

            // Check if File is for Consumption or Production
            let type = {}
            let file_name_type = ""
            let metered_data_num = 12
            if(["rsm:ValidatedMeteredData_12"] in jsonObject){
                metered_data_num = 12
            } else if(["rsm:ValidatedMeteredData_13"] in jsonObject){
                metered_data_num = 13
            } else if(["rsm:ValidatedMeteredData_14"] in jsonObject){
                metered_data_num = 14
            }

            try{
                if("rsm:ConsumptionMeteringPoint" in jsonObject[`rsm:ValidatedMeteredData_${metered_data_num}`]["rsm:MeteringData"][0]){
                    type = {type: "Consumption"}
                    file_name_type = "CONS"
                } else if ("rsm:ProductionMeteringPoint" in jsonObject[`rsm:ValidatedMeteredData_${metered_data_num}`]["rsm:MeteringData"][0]){
                    type = {type: "Production"}
                    file_name_type = "PROD"
                }
            } catch(err){
                console.log(file_path)
                console.log(err.message)
                return
            }



            // Save start and end times in Interval as JSON Object
            let interval = jsonObject[`rsm:ValidatedMeteredData_${metered_data_num}`]["rsm:MeteringData"][0]["rsm:Interval"][0]
            interval["StartDateTime"] = interval["rsm:StartDateTime"];
            delete interval["rsm:StartDateTime"];
            interval["EndDateTime"] = interval["rsm:EndDateTime"];
            delete interval["rsm:EndDateTime"];
            replace_single_value(interval)

            // Save the resolution
            let resolution = jsonObject[`rsm:ValidatedMeteredData_${metered_data_num}`]["rsm:MeteringData"][0]["rsm:Resolution"][0]
            resolution["Resolution"] = resolution["rsm:Resolution"];
            delete resolution["rsm:Resolution"];
            resolution["Unit"] = resolution["rsm:Unit"];
            delete resolution["rsm:Unit"];
            replace_single_value(resolution)

            // Save Observations
            let observations = jsonObject[`rsm:ValidatedMeteredData_${metered_data_num}`]["rsm:MeteringData"][0]["rsm:Observation"]
            let counter = 1
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

            const final = Object.assign({}, type, interval, resolution, {observations})

            const StartDate = interval.StartDateTime.split('T')[0];
            const EndDate = interval.EndDateTime.split("T")[0];

            fs.writeFile(`./SDAT_Files/SDAT_${file_name_type}_${StartDate} ${EndDate}.json`, JSON.stringify(final, null, 2), (error) => {
                    if (error) {
                        console.error(error);
                        throw error;
                    }
                }
            )
            return JSON.stringify(final, null, 2);
        })
    })
}

function read_SDAT_all(dir_path){
    fs.readdir(dir_path, (error, files) => {
        if (error) {
            return console.error('Error reading directory:', error);
        }

        // Iterate through each file
        files.forEach(file => {
            const filePath = path.join(dir_path, file);
            read_SDAT(filePath)

        });
    });
}

read_SDAT_all("SDAT-Files")

module.exports = {
    read_SDAT,
    read_SDAT_all
};