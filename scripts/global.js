document.addEventListener('DOMContentLoaded', function(){
    jQuery('.selectpicker').selectpicker();
    tippy('[title]', {
      size: 'large',
      dynamicTitle: true
    });

    /* Set breadcrumb item path for 'Song Library' if a course's view path is set */
    if (localStorage['path'] && localStorage['label']) {
        const song_library = document.getElementById('lib');
        if (song_library) {
            song_library.innerHTML = localStorage['label'];
            song_library.href = localStorage['path'];
        }
    }
}, false);

(function ($) {

    // Allows library items to be navigated by tab
    $("#library").keyup(function (event) {
        if (event.keyCode == 13 && $(event.target).hasClass('focusable')) {
            $(event.target).click();
        }
    });

    // Prints given message in modal window
    window.showMessage = function showMessage(message) {
        $("#message").html(message);
        $("#message-modal").modal('show');
    }

    // Counts the number of syllables in a given word
    window.countSyllables = function countSyllables(element, answered) {
        /*
        var syllable_count = pronouncing.syllableCount(pronouncing.phonesForWord(word)[0]);
        console.log("-> syllables: "+syllable_count);
        return syllable_count;
        */
        $("[name='" + element + "_feedback']").addClass('checking');
        showFeedback(element, '<span class="hint" style="display:inline;">Checking input </span><i class="fa fa-spinner fa-spin" aria-hidden="true"></i>');
        $.getJSON("/scripts/syllable_count.py?word=" + answered).done(function (response) {
            return response;
        });
    }

    window.syllable_check = function syllable_check(element, syllables, max) {
        let exceeded = true;
        if (syllables <= max && syllables != 0) {
            exceeded = false;
            if ($("[name='" + element + "']").hasClass('invalid')) {
                showFeedback(element, questions[0][element]['feedback']['1']);
            }
            $("[name='" + element + "_feedback']").removeClass('checking');
        }
        return exceeded;
    }

    window.lookup_word = function lookup_word(actions, terms) {
        return $.ajax({
            dataType: "json",
            url: "/smiles/wordnet.php?action=" + actions + "&terms=" + terms,
            async: false,
            success: function (data) {
                return data;
            }
        }).responseJSON;
    }

    /* * *
     *  Randomizes ordering of divs
     *  Good for matching questions
     */
    $(function () {
        var parent = $(".randomize");
        var divs = parent.children();
        while (divs.length) {
            parent.append(divs.splice(Math.floor(Math.random() * divs.length), 1)[0]);
        }
        var delay = 0;
        $('.randomize > div > div').each(function () {
            $(this).delay(delay).animate({
                opacity: 1
            }, 500);
            delay += 100;
        });
    });

})(jQuery);

function showExample(title, body, footer) {
    jQuery('#message-title').html(title);
    jQuery('#message').html(body);
    jQuery('#message-footer').html(footer);
    jQuery('#message-modal').modal('show');
}

// Check to see if a number is whole
function isInteger(num) {
    return num % 1 === 0;
}

// Replaces a character at given position with substitute char
function replaceAt(str, index, character) {
    return str.substr(0, index) + character + str.substr(index + character.length);
}

/*
  Credit to drifterz28 on GitHub
  Source: https://gist.github.com/drifterz28/6971440
*/
function toDeci(fraction) {
    var result, wholeNum = 0,
        frac, deci = 0;
    if (fraction.search('/') >= 0) {
        if (fraction.search('-') >= 0) {
            var wholeNum = fraction.split('-');
            frac = wholeNum[1];
            wholeNum = parseInt(wholeNum, 10);
        } else {
            frac = fraction;
        }
        if (fraction.search('/') >= 0) {
            frac = frac.split('/');
            deci = parseInt(frac[0], 10) / parseInt(frac[1], 10);
        }
        result = wholeNum + deci;
    } else {
        result = fraction
    }
    console.log(result);
    return result;
}

// Count the decimal places in a given number
function decimal_places(num) {
    return (num.split('.')[1] || []).length;
}

function singular_plural_form(word) {
    var plural = pluralize(word);
    var singular = '';

    /* if: word is in plural form - singularize */
    if (plural == word) {
        plural = word;
        singular = pluralize(word, 1)
    } else {
        singular = word;
    }

    return { "singular": singular, "plural": plural };
}

/* * *
*    Strip anything from string that is not one of the following:
*    A-Z,
*    0-9, or
*    Greek characters
*    Allowed input: period, whitespace
*    Note: case-insensitive
*/
String.prototype.sanitize = function () {
    return this.replace(/[^a-zA-Z0-9ά-ωΑ-ώ\s\-.]/g, "");
} /* String.prototype - sanitize */

/* * *
*   Replaces delimiters in a string with a given character.
*   @default: hyphen (-)
*   Characters affected: space, plus, minus, hyphen, comma
*/
String.prototype.replaceSpaces = function (replacement = '-') {
    return this.replace(/[\s\+\-\,]/g, replacement);
} /* String.prototype - replaceSpaces */

String.prototype.lemma = function () {
    return new Lemmatizer().lemmas(this)[0][0];
}

function decimal_to_word(num, precision = 2) {

    /*
      PURPOSE: Converts floating point number to a spoken word equivalent
      EXAMPLE: Provided input .1234 will become point-one-two
      RETURNS: String
      NOTE: In order to be pronounced properly, each segment is hyphenated.
    */
    if (!isInteger(num)) {
        if (isInteger(round(num, 2))) {
            value = num;
        } else {
            var value = round(num, precision);
        }
        if (!value) {
            wordVal = "0"; // Couldn't round, set to zero.
        } else {
            var wordVal = "";
            if (value < 0) {
                value = String(value).replace(/-0\./, "-.");
            }
            var temp = String(value).split(""); // Create character array
            // if (temp[0] !== "0" && temp[0] !== "-0") {
            //     wordVal += temp[0] + "-";
            // }
            // if (temp[1]) {
            //    temp = temp[1].split(""); // Split on values after decimal [1][2]
            //     wordVal += "point-"; // Replace . with point

            for (var i = 0; i < temp.length; i++) {
                if (!(i == 0 && temp[i] == 0)) {
                    switch (temp[i]) {
                        case "0":
                            wordVal += "oh";
                            break;
                        case "1":
                            wordVal += "one";
                            break;
                        case "2":
                            wordVal += "two";
                            break;
                        case "3":
                            wordVal += "three";
                            break;
                        case "4":
                            wordVal += "four";
                            break;
                        case "5":
                            wordVal += "five";
                            break;
                        case "6":
                            wordVal += "six";
                            break;
                        case "7":
                            wordVal += "seven";
                            break;
                        case "8":
                            wordVal += "eight";
                            break;
                        case "9":
                            wordVal += "nine";
                            break;
                        case ".":
                            wordVal += "point";
                            break;
                        case "-":
                            wordVal += "minus";
                            break;
                    }
                    if (!(i == temp.length - 1)) {
                        wordVal += "-";
                    }
                }
            }

        }
    } else {
        wordVal = num; // Integers do not need to be converted
    }

    return wordVal;
}

// Rounds a decimal to a set number of places
function round(value, exp) {
    if (typeof exp === 'undefined' || +exp === 0)
        return Math.round(value);

    value = +value;
    exp = +exp;

    if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0))
        return NaN;

    // Shift
    value = value.toString().split('e');
    value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp)));

    // Shift back
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp));
}

/* * *
 *  Converts text to number 'two hundred seven' -> 207
 */
var Small = {
    'zero': 0,
    'one': 1,
    'two': 2,
    'three': 3,
    'four': 4,
    'five': 5,
    'six': 6,
    'seven': 7,
    'eight': 8,
    'nine': 9,
    'ten': 10,
    'eleven': 11,
    'twelve': 12,
    'thirteen': 13,
    'fourteen': 14,
    'fifteen': 15,
    'sixteen': 16,
    'seventeen': 17,
    'eighteen': 18,
    'nineteen': 19,
    'twenty': 20,
    'thirty': 30,
    'forty': 40,
    'fifty': 50,
    'sixty': 60,
    'seventy': 70,
    'eighty': 80,
    'ninety': 90
};

var Magnitude = {
    'thousand': 1000,
    'million': 1000000,
    'billion': 1000000000,
    'trillion': 1000000000000,
    'quadrillion': 1000000000000000,
    'quintillion': 1000000000000000000,
    'sextillion': 1000000000000000000000,
    'septillion': 1000000000000000000000000,
    'octillion': 1000000000000000000000000000,
    'nonillion': 1000000000000000000000000000000,
    'decillion': 1000000000000000000000000000000000,
};

var a, n, g;

function pad(number, length) {
    var str = '' + number;
    while (str.length < length) {
        str = '0' + str;
    }
    return str;
}

function text2num(s) {
    a = s.toString().split(/[\s-]+/);
    n = 0;
    g = 0;
    a.forEach(feach);
    return n + g;
}

function feach(w) {
    var x = Small[w];
    if (x != null) {
        g = g + x;
    } else if (w == "hundred") {
        g = g * 100;
    } else {
        x = Magnitude[w];
        if (x != null) {
            n = n + g * x
            g = 0;
        }
    }
}

function getParams() {
    var params = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi,
        function (m, key, value) {
            params[key] = value;
        });
    return params;
}


/*** Window Scrolling - Alternative to using jQuery ***/

// Element to move, time in ms to animate
function scrollTo(element, duration) {
    var e = document.documentElement;
    if (e.scrollTop === 0) {
        var t = e.scrollTop;
        ++e.scrollTop;
        e = t + 1 === e.scrollTop-- ? e : document.body;
    }
    scrollToC(e, e.scrollTop, element, duration);
}

// Element to move, element or px from, element or px to, time in ms to animate
function scrollToC(element, from, to, duration) {
    if (duration <= 0) return;
    if (typeof from === "object") from = from.offsetTop;
    if (typeof to === "object") to = to.offsetTop;

    scrollToX(element, from, to, 0, 1 / duration, 20, easeOutCuaic);
}

function scrollToX(element, xFrom, xTo, t01, speed, step, motion) {
    if (t01 < 0 || t01 > 1 || speed <= 0) {
        element.scrollTop = xTo;
        return;
    }
    element.scrollTop = xFrom - (xFrom - xTo) * motion(t01);
    t01 += speed * step;

    setTimeout(function () {
        scrollToX(element, xFrom, xTo, t01, speed, step, motion);
    }, step);
}

function easeOutCuaic(t) {
    t--;
    return t * t * t + 1;
}




/* * *
 *   -=-=-=-=-=-=- RESIZE LISTENER FUNCTIONS -=-=-=-=-=-=-
 */
(function () {
    var attachEvent = document.attachEvent;
    var isIE = navigator.userAgent.match(/Trident/);

    var requestFrame = (function () {
        var raf = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame ||
            function (fn) {
                return window.setTimeout(fn, 20);
            };
        return function (fn) {
            return raf(fn);
        };
    })();

    var cancelFrame = (function () {
        var cancel = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame ||
            window.clearTimeout;
        return function (id) {
            return cancel(id);
        };
    })();

    function resizeListener(e) {
        var win = e.target || e.srcElement;
        if (win.__resizeRAF__) cancelFrame(win.__resizeRAF__);
        win.__resizeRAF__ = requestFrame(function () {
            var trigger = win.__resizeTrigger__;
            trigger.__resizeListeners__.forEach(function (fn) {
                fn.call(trigger, e);
            });
        });
    }

    function objectLoad(e) {
        this.contentDocument.defaultView.__resizeTrigger__ = this.__resizeElement__;
        this.contentDocument.defaultView.addEventListener('resize', resizeListener);
    }

    window.addResizeListener = function (element, fn) {
        if (!element.__resizeListeners__) {
            element.__resizeListeners__ = [];
            if (attachEvent) {
                element.__resizeTrigger__ = element;
                element.attachEvent('onresize', resizeListener);
            } else {
                if (getComputedStyle(element).position == 'static') element.style.position = 'relative';
                var obj = element.__resizeTrigger__ = document.createElement('object');
                obj.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; pointer-events: none; z-index: -1;');
                obj.__resizeElement__ = element;
                obj.onload = objectLoad;
                obj.type = 'text/html';
                if (isIE) element.appendChild(obj);
                obj.data = 'about:blank';
                if (!isIE) element.appendChild(obj);
            }
        }
        element.__resizeListeners__.push(fn);
    };

    window.removeResizeListener = function (element, fn) {
        element.__resizeListeners__.splice(element.__resizeListeners__.indexOf(fn), 1);
        if (!element.__resizeListeners__.length) {
            if (attachEvent) element.detachEvent('onresize', resizeListener);
            else {
                element.__resizeTrigger__.contentDocument.defaultView.removeEventListener('resize', resizeListener);
                element.__resizeTrigger__ = !element.removeChild(element.__resizeTrigger__);
            }
        }
    }
})();

// Processes provided answer and outputs a synthesized waveform
function generateTrack(question, answered) {

    const notes = question["notes"];
    const beats = question["beats"];

    const skip_synthesis = question['skip_synthesis'];

    if (!skip_synthesis) {
        gen_call(notes, beats, answered);
    } else {
        console.log('Skipping synthesis.');
    }

} /* generate track */

function generate_matching(question, slot, answered) {

    const skip_synthesis = question['skip_synthesis'];

    if (!skip_synthesis) {
        gen_call(question['notes'][slot], question['beats'][slot], answered);
    } else {
        console.log('Skipping synthesis.');
    }
} /* generate matching */

function gen_call(notes, beats, utterance) {

    console.log("Calling xml_gen");

    const directory = "sites/default/files/utterances/";
    utterance = utterance.toString().toLowerCase();

    jQuery.each(notes, function (key, note) {
        console.log("key: " + key + " val: " + note);

        const filename = bpm + "_" + beats[key] + "_" + note + "_" + utterance;
        const path = directory + filename;
        const url = '/smiles/sites/default/files/synthesized/' + encodeURIComponent(filename) + '.wav';

        // Check to see if file exists, if not create it
        jQuery.ajax({
            type: 'HEAD',
            url: url,
            success: function () {
                console.log('File found: ' + filename + '.wav');
            },
            error: function () {
                console.log('File not found: ' + filename + '.wav');
                console.log('Synthesizing');
                jQuery.ajax({
                    type: "get",
                    url: "/smiles/xml_gen.php",
                    data: {
                        bpm: bpm,
                        beats: beats[key],
                        notes: note,
                        utterance: utterance
                    },
                    success: function () {
                        wav_gen(path, filename);
                    }
                });
            }
        });
    });
} /* gen call */

function wav_gen(path, filename) {
    jQuery.ajax({
        url: "/smiles/scripts/wav_gen.py",
        dataType: "json",
        data: {
            'utterance': filename,
            'output': filename + '.wav'
        }
    }).always(function (response) {
        console.log(response);
    });
} /* wav gen */

// Checks to see if a given file exists
function checkExists(path) {
    let exists = false;

    jQuery.ajax({
        type: 'HEAD',
        url: path,
        success: function () {
            console.log('File found: ' + path);
            exists = true;
        },
        error: function () {
            console.log('File not found: ' + path);
        }
    });

    return exists;
} /* check path exists */

const smaller = [
    "shorter", "shorter-than", "shorter-then", "short",
    "tighter", "tight", "tighter-than", "tighter-then",
    "smaller", "smaller-than", "smaller-then", "small",
    "decreased", "decrease",
    "lesser", "less", "less-than", "less-then",
    "little", "littler", "littler than", "littler-then",
    "lower", "lower-than", "lower-then",
    "tinier", "tinier-than", "tinier-then", "tiny",
    "reduced", "reduce",
    "shrunk", "shrunken", "shrink",
    "narrower", "narrower-than", "narrower-then", "narrow"
];

const bigger = [
    "wider", "wider-than", "wider-then", "wide",
    "bigger", "bigger-than", "bigger-then", "big",
    "larger", "larger-than", "larger-then", "large",
    "greater", "greater-than", "greater-then", "great",
    "increased", "increase",
    "higher", "higher-than", "higher-then"
];

const significant = ["significant", "significance", "signifigance", "signifigant"];

function correct_grammar(question, term = "") {
    const initial = term;
    let typo = false;

    term = (term.replace(/(than)|(then)|(-)/gi, '')).trim();

    switch (term) {

        /* Smaller */
        case 'short':
            term = 'shorter';
            break;
        case 'tight':
            term = 'tighter';
            break;
        case 'small':
            term = 'smaller';
            break;
        case 'decrease':
            term = 'decreased';
            break;
        case 'tiny':
            term = 'tinier';
            break;
        case 'reduce':
            term = 'reduced';
            break;
        case 'shrink':
            term = 'shrunk';
            break;
        case 'narrow':
            term = 'narrower';
            break;
        case 'little':
            term = 'littler';
            break;
        case 'lesser':
            term = 'less';
            break;

        /* Bigger */
        case 'wide':
            term = 'wider';
            break;
        case 'big':
            term = 'bigger';
            break;
        case 'high':
            term = 'higher';
            break;
        case 'large':
            term = 'larger';
            break;
        case 'great':
            term = 'greater';
            break;
        case 'increase':
            term = 'increased';
            break;

        case 'significance':
            term = 'significant';
            break;
        case 'signifigance':
            term = 'significant';
            typo = true;
            break;
        case 'signifigant':
            term = 'significant';
            typo = true;
            break;

        default:
        /* do nothing */
    }

    const corrected = initial != term;
    console.log('Corrected grammar: ' + corrected);

    if (corrected) {
        questions[0][question]['answered'] = term;
        document.querySelector("[name='" + question + "']").value = term;
        let message = '';

        if (typo) {
            message = '<b>Notice:</b> We made a slight change in spelling; <b>' + initial.charAt(0).toUpperCase() + initial.slice(1) + '</b> should be spelled <b>' + term + '</b>.';
        } else {
            message = '<b>Notice:</b> We made a slight change in grammar to fit the song better!';
        }

        showNotice(question, '<small>' + message + '</small>');
    } else {
        jQuery("[name='" + question + "_notice']").css('display', 'none');
    }

    return corrected;
}

function debounce(func, wait = 20, immediate = true) {
    var timeout;

    return function () {
        var context = this, args = arguments;
        var later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };

        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    }
}

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

Array.prototype.unique = function () {
    var prims = { "boolean": {}, "number": {}, "string": {} }, objs = [];

    return this.filter(function (item) {
        var type = typeof item;
        if (type in prims)
            return prims[type].hasOwnProperty(item) ? false : (prims[type][item] = true);
        else
            return objs.indexOf(item) >= 0 ? false : objs.push(item);
    });
}

// Production steps of ECMA-262, Edition 5, 15.4.4.18
// Reference: http://es5.github.io/#x15.4.4.18
if (!Array.prototype.forEach) {

    Array.prototype.forEach = function (callback/*, thisArg*/) {

        var T, k;

        if (this == null) {
            throw new TypeError('this is null or not defined');
        }

        // 1. Let O be the result of calling toObject() passing the
        // |this| value as the argument.
        var O = Object(this);

        // 2. Let lenValue be the result of calling the Get() internal
        // method of O with the argument "length".
        // 3. Let len be toUint32(lenValue).
        var len = O.length >>> 0;

        // 4. If isCallable(callback) is false, throw a TypeError exception.
        // See: http://es5.github.com/#x9.11
        if (typeof callback !== 'function') {
            throw new TypeError(callback + ' is not a function');
        }

        // 5. If thisArg was supplied, let T be thisArg; else let
        // T be undefined.
        if (arguments.length > 1) {
            T = arguments[1];
        }

        // 6. Let k be 0.
        k = 0;

        // 7. Repeat while k < len.
        while (k < len) {

            var kValue;

            // a. Let Pk be ToString(k).
            //    This is implicit for LHS operands of the in operator.
            // b. Let kPresent be the result of calling the HasProperty
            //    internal method of O with argument Pk.
            //    This step can be combined with c.
            // c. If kPresent is true, then
            if (k in O) {

                // i. Let kValue be the result of calling the Get internal
                // method of O with argument Pk.
                kValue = O[k];

                // ii. Call the Call internal method of callback with T as
                // the this value and argument list containing kValue, k, and O.
                callback.call(T, kValue, k, O);
            }
            // d. Increase k by 1.
            k++;
        }
        // 8. return undefined.
    };
}