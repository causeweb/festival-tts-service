#!/var/www/cgi-bin/venv/bin/python3

# For debugging
import cgitb
cgitb.enable()

'''
### ### ### ### ### ###
### SAMPLE REQUEST  ###
### ### ### ### ### ###

/cgi-bin/syllable_count.py?word=sample

'''
import sys
import json
import cgi
import re
import pronouncing

fs = cgi.FieldStorage()

sys.stdout.write("Content-Type: application/json\r\n\r\n")

result = {}

d = {}
s = {}
for k in fs.keys():
    if k == 'word':
        val = fs.getvalue(k)
        split = re.split('\-', val)
        count = 0;
        success = True;

        for part in split:
            syllables = pronouncing.phones_for_word(part)

            if syllables:
                #s[split.index(part)] = syllables[0]
                count += pronouncing.syllable_count(syllables[0])
                success = success and True
            else:
                success = success and False
            if success:
                #d['syllables'] = s
                result = count
            else:
                result = 0

sys.stdout.write(json.dumps(result,separators=(',',':')))

sys.stdout.close()
