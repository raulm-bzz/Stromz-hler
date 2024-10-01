const fs = require('fs');
const xml2js = require('xml2js');

const parser = new xml2js.Parser();

fs.readFile('SDAT-Files/20190313_093127_12X-0000001216-O_E66_12X-LIPPUNEREM-T_ESLEVU121963_-279617263.xml', 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading the file:', err);
        return;
    }

    parser.parseString(data, (err, result) => {
        if (err) {
            console.error('Error parsing XML:', err);
            return;
        }

        const jsonOutput = JSON.stringify(result, null, 2); // Pretty print JSON
        
        console.log(jsonOutput);

    });
});
