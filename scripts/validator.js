const MAX_SYLLABLES = 3;
let spelling = null;

/* * *
 *   Uses an event to process answers instead of validating them directly
 */
function validateEvent(event) {
    validateAnswer(event.target.name, event.target.value);
} /* validate event */

/* * *
 *   Processes user input and marks answers accordingly
 */
function validateAnswer(element, answered) {

    var question = questions[0][element];
    question.attempt = !question.attempt ? 1 : question.attempt += 1;
    var correct = false;
    var syllable_count = null;
    var wordPassed = null;
    var type = question["validateOn"]["type"];
    if (!type) {
        type = "default";
    }
    console.log("Attempt: " + question.attempt);
    console.log("ValidateOn: " + question["validateOn"]["type"]);

    // Trim leading/trail white spaces and strip any non-alphanumeric character plus a few special characters
    answered = jQuery.trim(answered).replace(/[^a-zA-Z0-9Α-Ωα-ωίϊΐόάέύϋΰήώ\-\'\\\/\s.]/g, '');
    question.answered = answered;
    jQuery("[name='" + element + "']").val(jQuery.trim(jQuery("[name='" + element + "']").val()));

    // Check to see if the answer provided matches what is outlined in question_set.js
    console.log(element + " answered with: " + answered);

    // Skips validation steps
    if (question["validateOn"]["check"] == "skip") {
        correct = true;
    } else if (type) {
        switch (type) {
            case "index":
                correct = validate_index(element, question, answered);
                break;
            case "calc":
            case "calculation":
                correct = validate_calc(question, answered);
                break;
            case "str":
            case "string":
                correct = validate_string(element, question, answered);
                break;
            case "dec":
            case "float":
                correct = validate_float(element, question, answered);
                break;
            case "int":
            case "integer":
                correct = validate_int(element, question, answered);
                break;
            case "default":
                correct = validate_default(question, answered);
                break;
            default:
                correct = validate_default(question, answered);
                break;
        }
    }

    if (correct) {
        // Answer is related to another question's answer and must be validated
        if (question["relationship"]) {
            var passed = false;

            if (typeof question["relationship"].checkRelation == 'function') {
                passed = question["relationship"].checkRelation();
            } else {
                passed = true;
            }

            console.log('Passed: ' + passed);
            if (passed > 0) {
                markCompleted(element, question, question.answered);
                return true;
            } else if (passed == -1) {
                // do nothing
            } else if (wordPassed != false) {
                markIncorrect(element, getFeedback(question));
                return false;
            }
        }
        // Answer is not tied to other question and is correct
        else {
            markCompleted(element, question, question.answered);
            return true;
        }
    } else {
        console.log("Incorrect answer");
        markIncorrect(element, getFeedback(question));
        return false;
    }
} /* validate answer */

/* * *
 *   Validate string based on:
 *   -- Spelling requirements
 *   -- Syllable requirements
 */
function validate_string(element, question, answered) {

    /* * *
     *   Sanitize input:
     *   -- Replace all spaces with hyphens
     *   -- Remove possessives and contractions
     *   -- Hyphenate spaces
     */
    answered = answered.sanitize();
    document.querySelector("[name='" + element + "']").value = answered;
    answered = answered.toLowerCase().replaceSpaces();
    question["answered"] = answered;

    questions[0][element]['spelling'] = null;
    questions[0][element]['isFoul'] = null;
    questions[0][element]['countExceeded'] = null;

    const operator = question["validateOn"]["operator"];

    let correct = false;

    switch (operator) {
        case "==":
        case "===":
            if (question["answers"].indexOf(answered.toLowerCase()) == -1) {
                return false;
            }
            break;
        case "!=":
        case "!==":
            if (question["answers"].indexOf(answered.toLowerCase()) != -1) {
                return false;
            }
            break;
        case "ending":
            for (let answer of question["answers"]) {
                if (!answered.endsWith(answer)) {
                    return false;
                }
            }
            break;
        case "autocomplete":
            correct = true;
            break;
        default:
            return false;
    } /* switch */

    /* if: in list of alt terms - correct grammar if needed */
    const alt_terms = [smaller, bigger, significant];
    if (alt_terms.indexOf(question['answered']) != -1) {
        correct_grammar(element, answered);
        correct = true;
    }

     /* * *
     *   else:  split word by hyphens and check spelling of each segment
     *          if the operator is autocomplete and the answer is a choice, skip count.
     */
    else {

        let syllable_count = 0;
        const split = answered.split(/[-]/);

        for (let part of split) {
            if (question["validateOn"]["spellcheck"] !== false) {

                db_check = lookup_word('lookup', part);

                if(typeof db_check[part].wordid == 'undefined'){
                    try {
                      part = part.lemma();
                      db_check = lookup_word('lookup', part);
                    } catch (error) {
                      console.warn('Could not lemmatize provided value; proceeding.');
                    }
                } /* if: word not found - try checking inflections (lemma) */

                questions[0][element]["isFoul"] =
                    typeof question["isFoul"] !== 'undefined' ?
                    Boolean(question["isFoul"] || db_check[part].foul) :
                    Boolean(db_check[part].foul);

                console.log(db_check[part]);

                if (question["isFoul"]) {
                    return false;
                }

                wordPassed = temp = true;
                var count = true;

                if (operator == "autocomplete") {
                    if ((question["answers"].indexOf(answered.toLowerCase()) !== -1)) {
                        count = false;
                    }
                } /* if: autocomplete */
                if (count) {
                    if (!db_check[part].wordid) {
                        questions[0][element].spelling = 'failed';
                        return false;
                    } /* if the wordid is not set it is most likely spelled incorrectly */
                } /* if: count set */
            } else {
                wordPassed = true;
            } /* if - not skip spellcheck */

            /* * *
             *   Count the number of syllables to see if word fits.
             *   If the operator is autocomplete and the answer is a choice, skip count.
             */
            if (!question['validateOn']['skip_count'] || typeof question['validateOn']['skip_count'] == undefined) {
                var count = true;
                if (operator == "autocomplete") {
                    if ((question["answers"].indexOf(answered.toLowerCase()) !== -1)) {
                        count = false;
                    }
                } /* if: autocomplete */

                if (count) {
                    let max = typeof question['validateOn']['max_count'] !== undefined ? question['validateOn']['max_count'] : MAX_SYLLABLES;
                    syllable_count += db_check[part].syllables ? db_check[part].syllables : countSyllables(element, answered);
                    questions[0][element]['countExceeded'] = syllable_check(element, syllable_count, max);
                } else {
                    questions[0][element]['countExceeded'] = false;
                } /* if - count */

            } /* if - not skip syllable count */

            /* * *
             *   If the word has passed the spell checker,
             *   Determine if the answer is correct.
             */
            if (wordPassed && !questions[0][element]['countExceeded']) {
                correct = true;
            } else {

            } /* if - passed checks */
        } /* for: all word segments - validate */
    } /* else: not in list of pre-defined terms */

    return correct;
} /* validate string */

function validate_index(element, question, answered) {
    var correct = false;
    console.log("Answered with index: " + answered);
    if (question["validateOn"]["operator"] == "!==") {
        if (question["answers"].indexOf(parseInt(answered)) == -1) {
            question.answered = jQuery("[name='" + element + "']").data('pronounce_as');
            correct = true;
        }
    }
    return correct;
} /* validate index */

function validate_calc(question, answered) {
    var correct = false;

    if (question["validateOn"].checkAnswer(answered)) {
        correct = true;
    }

    return correct;
} /* validate calculation */

function validate_float(element, question, answered) {
    var correct = false;
    var initial = answered;

    // The number 77 has too many syllables so we round up to 80.
    if (round(answered, 0) == 77) {
        answered = 80;
    } else {
        answered = round(answered, question["validateOn"]["dec"]);

        // If rounds to 0 try going out an extra decimal place
        if(answered == 0){
            answered = round(initial, question["validateOn"]["dec"]+1);
        }
    }

    var rounded = !(initial == answered);
    console.log('rounded: '+rounded);

    jQuery("[name='" + element + "']").val(answered);
    question["answered"] = answered;
    if (question["validateOn"]["operator"] == "between") {
        if (answered >= question["validateOn"]["min"] && answered <= question["validateOn"]["max"]) {
            correct = true;
        }
    }
    // Round the correct answer to a fixed number of decimal places, update input, and generate spoken version of number
    if (correct) {
        if(rounded){
            showNotice(element, '<small><b>Notice:</b> We rounded your answer to fit the song better.</small>');
        }
        generateTrack(question, decimal_to_word(question["answered"], question["validateOn"]["dec"]));
    }

    return correct;
} /* validate float */

function validate_int(element, question, answered) {
    let correct = false;

    const operator = question["validateOn"]["operator"];

    var temp = round(parseFloat(answered), 0);
        temp = isNaN(temp) ? text2num(answered) : temp;

    if (typeof temp == "number") {
        question["answered"] = answered = temp.toString();
    } else {
        return -1;
    }

    console.log("A: "+answered);
    switch (operator) {
        case "==":
        case "===":
        case "equals":
            correct = question['answers'].indexOf(answered) >= 0 ? true : false;
            break;
        case "between":
            if (answered >= question["validateOn"]["min"] && answered <= question["validateOn"]["max"]) {
                correct = true;
                if (question["answered"] < 0) {
                    answered = -answered;
                }
                question["answered"] = answered;
                jQuery("[name='" + element + "']").val(answered);
            }
            break;
        default:
            return false;
    }

    return correct;
} /* validate integer */

/* * *
 *   If no options are left, check to see if the question is related to any others
 */
function validate_default(question, answered) {
    var correct = false;

    if (typeof question["relationship"].checkRelation == 'function') {
        console.log('validate_default:: Marking Complete');
        correct = question["relationship"].checkRelation();
    } /* if checkRelation is defined - call it */

    return correct;
} /* validate default */

/* * *
 *   Used to determine if all questions on the page
 *   have been answered correctly before continuing
 */
function checklist() {
    completed = false;
    num_questions = 0;
    count = 0;
    let checklist = [];

    for (var question in questions[0]) {
        checklist.push(new Array(question, questions[0][question]['passed']));
        if (questions[0][question]['passed']) {
            count++;
        }
        num_questions++;
    }
    if (count == num_questions) {
        completed = true;
    }

    window.progress = checklist;

    return completed;
} /* checklist */

// Returns the feedback for a given question
function getFeedback(question) {

    // Checks to see how many responses there are in total.
    const responses = Object.keys(question["feedback"]).length;
    let feedback = '';

    if (!responses) {
        return feedback;
    }

    if (typeof question["feedback"].getFeedback == 'function') {
        feedback = question["feedback"].getFeedback(question.attempt);
    } else {
        // If your current attempt is greater than the number of responses, just use the last response.
        // If this is the first attempt set to position 1 otherwise increment by 1.
        question.attempt_feedback = question.attempt_feedback ? question.attempt_feedback >= responses ? responses : question.attempt_feedback += 1 : 1;
        feedback = question["feedback"][question.attempt_feedback];
    } /* if: feedback function is defined - use results | else: pull feedback from element based on attempt */

    return feedback;
} /* get feedback */