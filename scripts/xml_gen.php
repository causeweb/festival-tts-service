<?php
    // Music note symbols
    // Flat - ♭ - &#9837;
    // Natural - ♮ - &#9838;
    // Sharp - # - %23
    // https://causeweb.org/smiles/xml_gen.php?bpm=130&beats=1.0&notes=A4&utterance=bob

    $bpm = $_GET['bpm'];
    $beats = $_GET['beats'];
    $notes = $_GET['notes'];
    $utterance = $_GET['utterance'];

    $directory = "sites/default/files/utterances/";
    //$filename = $bpm."_".$beats."_".$notes."_".$utterance.".xml";
    $filename = $bpm."_".$beats."_".$notes."_".$utterance;
    $path = $directory.$filename;

    $file = fopen($path, "w") or die("Unable to open file!");

    $synthesis = 
    '<?xml version="1.0"?><!DOCTYPE SINGING PUBLIC "-//SINGING//DTD SINGING mark up//EN" "Singing.v0_1.dtd"[]><SINGING BPM="'.$bpm.'"><DURATION BEATS="'.$beats.'"><PITCH NOTE="'.$notes.'">'.$utterance.'</PITCH></DURATION></SINGING>';

    fwrite($file, $synthesis);
    fclose($file);
?>
