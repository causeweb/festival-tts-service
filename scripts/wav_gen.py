#!/var/www/cgi-bin/venv/bin/python3


# For debugging
print("Content-type:text/html\r\n\r\n")
import cgitb
cgitb.enable()


'''
### ### ### ### ### ###
### SAMPLE REQUEST  ###
### ### ### ### ### ###

# Generate utterance file
/smiles/xml_gen.php?bpm=130&beats=1.0&notes=A4&utterance=test

# Generate waveform
/cgi-bin/wav_gen.py?utterance=130_1.0_A4_test&output=130_1.0_A4_test.wav

# View output
/smiles/sites/default/files/synthesized/130_1.0_A4_test.wav
'''

import sys
import json
import cgi
import sh
import os.path

fs = cgi.FieldStorage()

HTML_PATH = "/var/www/sites"
SMILES_PATH = "/smiles/web"
FILES_PATH = SMILES_PATH + "/sites/default/files"

IMPORT_PATH = HTML_PATH + FILES_PATH + "/utterances/"
EXPORT_PATH = HTML_PATH + FILES_PATH + "/synthesized/"
RELATIVE_PATH = FILES_PATH + "/synthesized/"

# print("Content-type:application/json\r\n\r\n")

result = {}

d = {}
for k in list(fs.keys()):
    d[k] = fs.getvalue(k)

result['data'] = d

if(not d):
	print((json.dumps({'status': 400, 'message': 'BAD_REQUEST', 'file': 'NO_DATA' }, separators=(',',':'))))
	exit(0)

try:
	utterance = IMPORT_PATH + result['data']['utterance']
	export = EXPORT_PATH + result['data']['output']
	relative = RELATIVE_PATH + result['data']['output']
except:
	print((json.dumps({'status': 400, 'message': 'BAD_REQUEST', 'file': 'MALFORMED_REQUEST' }, separators=(',',':'))))
	exit(0)

if(not os.path.isfile(utterance)):
	print((json.dumps({'status': 404, 'message': 'FILE_NOT_FOUND', 'file': utterance }, separators=(',',':'))))
	exit(0)

text2wave = sh.Command("/usr/local/bin/text2wave")

print("-mode singing", str(utterance),"-o "+str(export))

try:
	text2wave("-mode singing", str(utterance),"-o "+str(export))
except:
	print('no')

if(not os.path.isfile(export)):
	print((json.dumps({'status':400, 'message': 'BAD_REQUEST', 'file': export, 'message': 'File could not be created.'}, separators=(',',':'))))
	exit(0)

print((json.dumps({'status':200, 'message': 'OK', 'file': relative}, separators=(',',':'))))
