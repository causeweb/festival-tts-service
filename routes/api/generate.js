"use strict"

const express = require('express');
const cors = require('cors');
const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const wordpos = require('wordpos');
const router = express.Router();

router.get('/*', (req, res) => {
    const generator = new Generator();
    const querying = Object.keys(req.query).length !== 0;

    if (querying) {

        let template = generator.generateXML(req.query);

        if (template.length > 0 && req.params[0] != 'xml') {
            let wav = generator.generateWAV(template);
        }

        res.sendFile(template);
    } else {
        res.sendStatus(400);
    }
});

class Generator {

    generateXML(params) {
        const bpm = params.bpm ? params.bpm : "130";
        const beats = params.beats ? params.beats : "1.0";
        const notes = params.notes ? params.notes : "A4";
        const utterance = params.utterance ? params.utterance : "None";

        const dir = './utterances/';

        const filename = [bpm, beats, notes, utterance].join("_") + '.xml';
        const output = path.join(dir, filename);

        let template =
`<?xml version="1.0"?>
<!DOCTYPE SINGING PUBLIC "-//SINGING//DTD SINGING mark up//EN" "Singing.v0_1.dtd"[]>
<SINGING BPM="${ bpm}">
<DURATION BEATS="${ beats}">
    <PITCH NOTE="${ notes}">${utterance}</PITCH>
</DURATION>
</SINGING>`;

        this.writeFile(dir, filename, template);

        return (path.resolve(output));
    }

    /* expects path to xml template file */
    generateWAV(template) {
        const dir = './synthesized/';

        let file = path.basename(template);

        if (file) {
            // We want the output file to have the same name but new extension
            let output = path.resolve(path.join(dir, path.parse(file).name + '.wav'));
            let command = 'text2wave -mode singing ' + template + ' -o ' + output;

            console.log(command);

            try {
                let result = cp.execSync(command).toString();
            } catch (e) {
                // 127 => command not found; text2wave not installed.
            }
        } else {
            res.sendStatus(400);
        }
    }

    writeFile(directory, filename, content) {
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory);
        }

        try {
            fs.writeFileSync(path.join(directory, filename), content, { encoding: 'utf8', flag: 'w' });
        } catch (e) {
            console.error(e);
            res.sendStatus(500);
        }
    }
}

module.exports = router;