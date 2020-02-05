#!/var/www/cgi-bin/venv/bin/python3

'''
ABOUT: This endpoint is used to merge requested audio layers into one single download file to be served to the user.

TODO: 
	- Check if overlay exceeds length of original song. Extend track if necessary.
	- Add additional status code fail states
'''

'''
Using this code with ajax:

let data = tracks;
data.unshift({'base': '/smiles/sites/default/files/recordings/'+synthesis_track, 'name': 'Regression Rumba'});

jQuery.ajax({
    url: '/cgi-bin/export_song.py',
    cache: false,
    contentType: "application/json; charset=utf-8",
    processData: false,
    data: JSON.stringify(data),
    type: 'POST',
    success: function(response) {
        console.log(response);
    },
    error: function(error) {
        console.log(error);
    }
});
'''

import sys
import cgi
import time
import json
import requests
import os.path
import urllib
from pydub import AudioSegment

HTML_PATH = "/var/www/sites"
SMILES_PATH = "/smiles/web"
FILES_PATH = SMILES_PATH + "/sites/default/files"
EXPORT_PATH = FILES_PATH + "/downloads"
base_path = None

debug = False

### ### ### ### ### ###
### SAMPLE REQUEST  ###
### ### ### ### ### ###
'''
request = json.loads('[{"base":"/smiles/sites/default/files/recordings/Regression_Rumba.mp3", "name": "Regression Rumba"},{"src":"/smiles/synthesized/130_1.0,1.0,1.0_E4%2CC4%2CD4_scatterplot.wav","timing":"12000","loadTimeout":8000,"ext":"wav","type":"sound","path":"","id":"/smiles/synthesized/130_1.0,1.0,1.0_E4%2CC4%2CD4_scatterplot.wav","data":100},{"src":"/smiles/synthesized/130_1.0,1.0,1.0_F%234%2CE4%2CE4_high.wav","timing":"28350","loadTimeout":8000,"ext":"wav","type":"sound","path":"","id":"/smiles/synthesized/130_1.0,1.0,1.0_F%234%2CE4%2CE4_high.wav","data":100},{"src":"/smiles/synthesized/130_1.0,1.0,1.0_B4%2CB4%2CB4_whey.wav","timing":"30400","loadTimeout":8000,"ext":"wav","type":"sound","path":"","id":"/smiles/synthesized/130_1.0,1.0,1.0_B4%2CB4%2CB4_whey.wav","data":100},{"src":"/smiles/synthesized/130_1.0,1.0,1.0_B4%2CB4%2CB4_whey.wav","timing":"47500","loadTimeout":8000,"ext":"wav","type":"sound","path":"","id":"/smiles/synthesized/130_1.0,1.0,1.0_B4%2CB4%2CB4_whey.wav","data":100,"_loader":{"_listeners":{"complete":[null,null,null],"fileload":[null,null],"progress":[null,null],"error":[null,null],"fileerror":[null,null]},"_captureListeners":null,"loaded":true,"canceled":false,"progress":1,"type":"sound","resultFormatter":null,"_item":{"src":"/smiles/synthesized/130_1.0,1.0,1.0_B4%2CB4%2CB4_whey.wav","timing":"30400","loadTimeout":8000,"ext":"wav","type":"sound","path":"","id":"/smiles/synthesized/130_1.0,1.0,1.0_B4%2CB4%2CB4_whey.wav","data":100},"_preferXHR":true,"_result":{},"_rawResult":{},"_loadedItems":null,"_tagSrcAttribute":null,"_tag":null,"_request":{"_item":{"src":"/smiles/synthesized/130_1.0,1.0,1.0_B4%2CB4%2CB4_whey.wav","timing":"30400","loadTimeout":8000,"ext":"wav","type":"sound","path":"","id":"/smiles/synthesized/130_1.0,1.0,1.0_B4%2CB4%2CB4_whey.wav","data":100},"_request":{},"_loadTimeout":null,"_xhrLevel":2,"_response":{},"_rawResponse":null,"_canceled":false,"_listeners":{"complete":[null],"progress":[null],"loadStart":[null],"abort":[null],"timeout":[null],"error":[null]},"loaded":true}}},{"src":"/smiles/synthesized/130_1.0,1.0,1.0_F%234%2CF%234%2CF%234_high.wav","timing":"50000","loadTimeout":8000,"ext":"wav","type":"sound","path":"","id":"/smiles/synthesized/130_1.0,1.0,1.0_F%234%2CF%234%2CF%234_high.wav","data":100},{"src":"/smiles/synthesized/130_1.0,1.0,1.0_A4%2CA4%2CA4_up.wav","timing":"53000","loadTimeout":8000,"ext":"wav","type":"sound","path":"","id":"/smiles/synthesized/130_1.0,1.0,1.0_A4%2CA4%2CA4_up.wav","data":100},{"src":"/smiles/synthesized/130_1.0,1.0,1.0_C5%2CC5%2CC5_1.wav","timing":"54000","loadTimeout":8000,"ext":"wav","type":"sound","path":"","id":"/smiles/synthesized/130_1.0,1.0,1.0_C5%2CC5%2CC5_1.wav","data":100},{"src":"/smiles/synthesized/130_1.0,1.0,1.0_F%234%2CF%234%2CF%234_point-two.wav","timing":"64200","loadTimeout":8000,"ext":"wav","type":"sound","path":"","id":"/smiles/synthesized/130_1.0,1.0,1.0_F%234%2CF%234%2CF%234_point-two.wav","data":100},{"src":"/smiles/synthesized/130_1.0,1.0,1.0_E4%2CE4%2CE4_point-oh-four.wav","timing":"66200","loadTimeout":8000,"ext":"wav","type":"sound","path":"","id":"/smiles/synthesized/130_1.0,1.0,1.0_E4%2CE4%2CE4_point-oh-four.wav","data":100}]')
'''
# base = request[i]['base']
# src = request[i]['src']
# position = request[i]['timing']

### ### ### ### ### ###
request = None

try:
	request = json.load(sys.stdin)
except:
	request = None

def merge_tracks(request, base_path):
	if(os.path.isfile(HTML_PATH+base_path)):
		base_track = AudioSegment.from_file(HTML_PATH+base_path)
		song_name = request[0]['name']
		file_name = song_name + '.mp3'
		timestamp = str(int(time.time()))
		download_path = urllib.pathname2url(EXPORT_PATH + '/' + song_name + ' (' + timestamp + ').mp3')
		mixdown = base_track

		duration = len(base_track)
		response = '[{"track": "' + file_name + '", "href": "' + download_path + '", "duration": ' + str(duration) + '}]'

		if debug:
			response += ', "debug": ['

		for i in range(1, len(request)):
			source = urllib.unquote(request[i]["src"]).decode('utf-8')
			segment_duration = 0
			status_code = '200'

			try:
				synth_overlay = AudioSegment.from_file(HTML_PATH+source)
				segment_duration = len(synth_overlay)
				segment_position = int(request[i]['timing'])
				mixdown = mixdown.overlay(synth_overlay, position = segment_position, gain_during_overlay=2)

			except:
				status_code = '404'		

			if debug:
				response += '{"status": ' + status_code + ', "src": "' + source + '", "timing": ' + request[i]["timing"] + ', "duration":' + str(segment_duration)
				if i != len(request) - 1:
					response += '},'
				else:
					response += '}'

		if debug:			
			response += "]"

		try:
			
			mixdown.export(
				HTML_PATH + EXPORT_PATH + '/' + song_name +' (' + timestamp + ').mp3', 
				format = "mp3", 
				bitrate = "192k", 
				tags = {
					"album": "Project SMILES", 
					"artist": "Project SMILES", 
					"genre": "Educational"
				}, 
				cover = HTML_PATH + FILES_PATH + "/cover.jpg")
		except:
			status_code = '400'
		
	return response;

### ### ### ### ### ### ### ###

sys.stdout.write("Content-Type: application/json\r\n\r\n")

if not request:
	sys.stdout.write('{"status": 400, "response": "BAD_REQUEST: No request data found or in an incorrect format."}')
else:
	if request[0].has_key("base"):
		base_path = request[0]["base"]

	if not base_path:
		sys.stdout.write('{"status": 404, "response": "FILE_NOT_FOUND: No base audio layer found; Unable to merge tracks."}')
	else:
		response = merge_tracks(request, base_path)
		sys.stdout.write('{"status": 201, "response": ' + response + '}')

sys.stdout.close()
		
