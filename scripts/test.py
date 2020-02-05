#!/var/www/cgi-bin/venv/bin/python3

# For debugging
import cgitb
cgitb.enable()

import sys
import cgi
import time
import json
import requests
import os.path
import urllib
import pronouncing

from pydub import AudioSegment

print("Content-type:text/html\r\n\r\n")

print('<html>')
print('<head>')
print('<title>Virtualenv test</title>')
print('</head>')
print('<body>')
print('<h3>If you see this, the module imports were successful!</h3>')
print(sys.version)
print('</body>')
print('</html>')
