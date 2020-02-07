/* Checks to see if jQuery has loaded */
if (typeof jQuery === 'undefined') {
    throw new Error('jQuery is required')
} /* if: jQuery not defined */

/* Checks to see if browser is Chrome */
//const isChrome = typeof window.chrome !== 'undefined' ? true : false;

const started = new Date();
let matching_questions = [];
let ended = null;

/* * *
 *   -=-=-=-=-=-=- EVENT LISTENERS -=-=-=-=-=-=-
 */
document.addEventListener("DOMContentLoaded", function() {
    console.info("Activity Started: " + started);

    const keys = Object.keys(questions[0]);

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (questions[0][key]['validateOn']['type'] == 'matching') {
            initialize_matches(key, questions[0][key]);
            matching_questions.push(key);
        } /* if: question set has matching items 0*/
    } /* for: each question - check for matching elements */

    /* Clears any form inputs that may have carried over on reload */
    const form = jQuery('form');
    form[0].reset();

    jQuery('.selectpicker').on('change', function() {
        if (jQuery(this).val() == '') {
            resetInput(this.name);
        } /* if: empty select */
    }); /* on: selectpicker - change */

    /* * *
     *  Handles click event for a given matching question's reset button.
     *  Clears all data from matching items.
     *  Reverts draggable items back to their initial positions.
     *  Unlocks droppable items.
     */
    jQuery(".reset-matches").on("click", function(e) {
        const element = jQuery(this).data("id");
        const question = questions[0][element];
        question.attempt = !question.attempt ? 1 : question.attempt += 1;
        const slot_elements = document.getElementById(element + '_matches').getElementsByClassName('ui-droppable');

        for (let i = 0; i < questions[0][element]["validateOn"]["num_matches"]; i++) {
            reset_match(element, i + 1, i + 1);
            jQuery(slot_elements[i]).droppable("enable");
        } /* for: all matches - reset match */
    }); /* reset-matches */

    jQuery(".toggleHint").on("click", function(e) {
        console.log("Hint toggled for: " + e.currentTarget.id + ".");
        toggleHint(e.currentTarget.id);
    }); /* on: hint toggled */

    jQuery(":input").on("click", function(e) {
        console.log("Interacted with: " + e.currentTarget.name);
        interacted_xAPI((e.currentTarget.name + "-" + e.currentTarget.className).replace(/\s/g, "-"));
    }); /* on: click::input */

    jQuery(":input").on("change", function(e) {
        /* ignoring in favor of focusout and key events to prevent double validation */
        if(e.currentTarget.tagName == 'SELECT'){
            input__checkInputEvent(event);
        }
    }); /* on: change::input */

    jQuery(":input").on('keypress', function(event){
        if(event.which == 13 && !jQuery(this).hasClass('no-validate')){
            input__checkInputEvent(event);
        } /* if: enter key is pressed */
    }); /* on: input keypress */

    jQuery(":input").focusin(function (e) {
      input__setIcon(e.target, 'focused');
    }); /* on: click::input */

    jQuery(":input").focusout(function(e) {
      input__setIcon(jQuery(e.target));

        if(!jQuery(this).hasClass('no-validate')){
            input__checkInputEvent(event);
        } /* if: type change or key is enter - validate */    

        if (!e.target.value.trim() && jQuery(e.target).prop("tagName") !== "BUTTON") {
            console.log("Input empty: " + e.target.name);
            resetInput(e.target.name);
            checklist();
        }

        jQuery(event.target).data('value', event.target.value);
    }); /* on: input - focusout */

    form.on("keypress", function(event) {
        return event.which != 13;
    });

    form.on('submit',function(event){
        if (checklist()) {
            const ended = new Date();
            console.info("Activity submitted: " + ended + " | duration: " + (ended - started) / 1000 + " seconds.");
            completed_xAPI();
            return true;
        } else {
            event.preventDefault();
            showMessage("Please answer all questions correctly before continuing:<br/>"+get_progressbar());
        } /* if: passes checklist - submit */
        return false;
    });

    /* When the window or div is resized, matching items need to follow their containers */
    if (matching_questions) {
        jQuery(window).resize(function() {
            debounce(reposition_matches);
        }); /* window resize */
        const _matching = jQuery('.matching');
        for (let i = 0; i < _matching.length; i++) {
            addResizeListener(_matching[i], reposition_matches);
        } /* matching div resize */
    } /* if: there are matching questions - set resize listeners */
}); /* document ready */

/* * *
 *   -=-=-=-=-=-=- VALIDATION FUNCTIONS -=-=-=-=-=-=-
 */

/* * *
 *   Sets appropriate classes for correct answers
 *   Updates associated variables
 *   Hides feedback when appropriate
 *   Logs input in LearningLocker
 */
function markCompleted(element, question, answered, skip = false) {

    input__setValid(element);

    question.passed = true;

    const related = questions[0][element]['relationship']['question'];
    const unlocks = question.relationship['unlocks'];

    if ((related || unlocks) && !skip) {
        if (related != "self_check") {
            for (let i = 0; i < related.length; i++) {
                if (questions[0][related[i]]['answered']) {
                    validateAnswer(related[i], questions[0][related[i]]['answered']);
                }
            }
        } /* if: not self check - run relationship check */
        if (unlocks) {
            for (let i = 0; i < unlocks.length; i++) {
                unlock_question(unlocks[i]);
            }
        } /* if: question unlocks a question */
    } /* if: question is related to or unlocks another question and we're not skipping the check - validate or unlock questions */

    answered_xAPI(element, questions[0][element], answered, true);

    hideFeedback(element);

    if (questions[0][element]["validateOn"]["type"] !== "float" && questions[0][element]["validateOn"]["type"] !== "matching" && !question['skip_synthesis']) {
        generateTrack(question, answered);
    } /* if: question type is not a number or matching question and we are not skipping synthesis - generate synthesis track */
} /* mark completed */

/* * *
 *   Sets appropriate classes for incorrect answers
 *   Updates associated variables
 *   Displays question feedback
 *   Logs input in LearningLocker
 */
function markIncorrect(element, feedback) {
    input__setInvalid(element);

    if (typeof questions[0][element]['spelling'] && questions[0][element]['spelling'] == 'failed') {
        feedback = '<i class="fas fa-times" aria-hidden="true"></i>&nbsp;<b>Please check spelling.</b>';
    }
    if (typeof questions[0][element]['isFoul'] !== 'undefined' && questions[0][element]['isFoul']){
        feedback = '<i class="fas fa-fw fa-exclamation-triangle" aria-hidden="true"></i>&nbsp;<b>Please watch your language.</b>';
    }
    if (typeof questions[0][element]['countExceeded'] !== 'undefined' && questions[0][element]['countExceeded']){
        feedback = '<i class="fas fa-fw fa-exclamation-triangle" aria-hidden="true"></i>&nbsp;<b>Please shorten your answer to <u>' + questions[0][element]['validateOn']['max_count'] + '</u> or fewer syllables.</b>';
    }

    hideNotice(element);
    showFeedback(element, feedback);

    questions[0][element]['passed'] = false;

    const related = questions[0][element]['relationship']['question'];

    if (related) {
        console.log(related);
        if (related !== "self_check") {
            for (let i = 0; i < related.length; i++) {
                if (questions[0][related[i]]['answered']) {
                    markIncorrect(related[i], "");
                } /* if: related question has been answered - mark incorrect too */
            } /* for: all related questions */
        } /* if: relationship not a self check */
    } /* if: relationship set */

    answered_xAPI(element, questions[0][element], questions[0][element]['answered'], false);
} /* mark incorrect */

function unlock_question(question) {
    document.getElementById(question + '_locked').style.display = "none";
    document.getElementById(question + '_unlocked').style.display = "inline";
    jQuery('#question_5_unlocked').parent().css('padding-left', '15px');
} /* unlock_question */

/* * *
 *   Sets appropriate classes for valid answers
 */
function input__setValid(question) {

    const element = jQuery("[name='" + question + "']");
    const addon = jQuery(element).next('.input-group-addon');

    if (element.hasClass('selectpicker')) {
        element.selectpicker('setStyle', 'select-invalid', 'remove');
        element.selectpicker('setStyle', 'select-valid', 'add');
    } else {
        element.removeClass('invalid');
        element.addClass('valid');
        element.attr('aria-invalid', false);
        input__setIcon(element, 'valid');
    } /* if: dropdown select - set style | else - set style normally */
} /* input - set valid */

/* * *
 *   Sets appropriate classes for invalid answers
 */
function input__setInvalid(question) {

    const element = jQuery("[name='" + question + "']");
    const addon = jQuery(element).next('.input-group-addon');

    if (element.hasClass('selectpicker')) {
        element.selectpicker('setStyle', 'select-valid', 'remove');
        element.selectpicker('setStyle', 'select-invalid', 'add');
    } else {
        element.removeClass('valid');
        element.addClass('invalid');
        element.attr('aria-invalid', true);
        input__setIcon(element, 'invalid');
    } /* if: dropdown select - set style | else - set style normally */
} /* input - set invalid */

function input__setIcon(element, state){
  let addon, is_dropdown = false, icon = 'fa-circle', prefix = 'far', transform = 'shrink-10', enable_reset = false;

  element = jQuery(element);
  addon = element.next('.input-group-addon');

  if (state == 'focused') {
    prefix = 'fas';
  } else if (element.hasClass('invalid') || state == 'invalid') {
    icon = 'fa-times reset-input';
    prefix = 'fas';
    transform = 'shrink-6';
    enable_reset = true;
  } else if (element.hasClass('valid') || state == 'valid'){
    icon = 'fa-check';
    prefix = 'fas';
    transform = 'shrink-6';
  } else if (state == 'focusout') {
    icon = 'fa-circle';
    prefix = 'far';
  }

  addon.html('<i class="fa-fw ' + prefix + ' ' + icon + '" aria-hidden="true" data-fa-transform="' + transform + '">&nbsp;</i>');

  if(enable_reset && !is_dropdown){
    setTimeout(() => {
      element.next('.input-group-addon').find('.reset-input').on('click', function (e) {
        resetInput(element.attr('name'));
      });
    }, 200);
  }
}

function input__getCurrentValue(question){
    return document.querySelector("[name='" + question + "']").value;
}

function input__checkInputEvent(event){
    if (event.target.value.trim()) {
        let currentValue = event.target.value;
        let dataValue = jQuery(event.target).data('value');

        if(currentValue != dataValue){
            console.log("Input changed: " + event.target.name + ", value set to: " + event.target.value);
            validateEvent(event);
            checklist();    
        } else {
            console.log("No change: " + event.target.name);
        }
    } /* if: input is not empty */
}

/* * *
 *   Resets a given element to initial state
 */
function resetInput(question) {
    console.log("Clearing: " + question);

    hideFeedback(question);
    hideNotice(question);

    const element = document.querySelector("[name='" + question + "']");
    const addon = jQuery(element).next('.input-group-addon');

    jQuery(element).data('value', '');

    if (typeof element.className !== 'undefined' && element.className === "selectpicker") {
        jQuery(element).selectpicker('val', ' ');
        jQuery(element).parent().children('.btn').removeClass('select-invalid');
        jQuery(element).parent().children('.btn').removeClass('select-valid');
    } else {
        element.classList.remove('valid');
        element.classList.remove('invalid');
        element.value = '';
        jQuery(element).attr('aria-invalid', false);
        input__setIcon(element, 'focusout');
    } /* if: selectpicker */

    jQuery("[name='" + question + "_hint']").hide();
    jQuery("[name='" + question + "_valid_feedback']").hide();

    questions[0][question]['answered'] = '';
    questions[0][question]['passed'] = false;
    questions[0][question]['spelling'] = null;
    questions[0][question]['isFoul'] = null;
    questions[0][question]['countExceeded'] = null;

    const related = questions[0][question]['relationship']['question'];

    if (related && related != 'self_check') {
        for (let i = 0; i < related.length; i++) {
            if (typeof questions[0][related[i]] != undefined && questions[0][related[i]] != '') {
                resetInput(related[i]);
            } /* if: question has set relationship */
        } /* for: all related questions */
    } /* if: question has relationship and it's not a self check - reset related */
} /* input - reset */

/* * *
 *   Toggles the visibility of a given hint
 */
function toggleHint(element) {
    hideFeedback(element);
    jQuery("[name='" + element + "_hint']").toggle();
    hintToggled_xAPI(element);
} /* toggle hint */

/* * *
 *   Shows feedback for a given question
 */
function showFeedback(question, feedback) {
    const element = document.querySelector("[name='" + question + "_feedback']");

    if (element && typeof feedback !== 'undefined') {
        element.innerHTML = feedback;
        element.style.display = 'block';
        jQuery("[name='" + question + "_hint']").hide();
    } /* if: feedback element exists */
    else {
        hideFeedback(element);
    }
} /* show feedback */

/* * *
 *   Hides feedback for a given question
 */
function hideFeedback(element) {
    jQuery("[name='" + element + "_feedback']").hide();
} /* hide feedback */

/* * *
 *   Shows feedback for a given question
 */
function showNotice(question, notice){
	let element = document.querySelector("[name='" + question + "_notice']");

	if(!element) {
		jQuery("[name='"+question+"']").closest('li').append('<div name="'+question+'_notice" class="hint"></div>');
		element = document.querySelector("[name='" + question + "_notice']");
	}

	element.innerHTML = notice;
    element.style.display = 'flex';
    jQuery("[name='" + question + "_hint']").hide();
}

/* * *
 *   Hides feedback for a given question
 */
function hideNotice(element){
	jQuery("[name='" + element + "_notice']").hide();
}

/* * *
 *   -=-=-=-=-=-=- MATCH ITEM FUNCTIONS -=-=-=-=-=-=-
 */

/* * *
 *      Globals used for matching question start/stop event handling.
 */
let start_position = null;
let end_position = null;

/* * *
 *      Sets up jQueryUI draggable/droppable elements for matching questions.
 *      Event order: initialize_matches -> draggable.start -> droppable.drop -> draggable.stop
 */
function initialize_matches(element, question) {
    const match_items = question["validateOn"];
    match_items.matched = [];
    match_items["matches"].correct = 0;

    for (let i = 1; i <= match_items.slots; i++) {
        jQuery("#" + element + "-slot_" + i).data("number", i).droppable({
            accept: "#" + element + "_match_items div",
            hoverClass: "hovered",
            drop: handleMatchDrop,
            activeClass: "ui-state-highlight"
        });
        question["validateOn"].matched[i] = {
            valid: null,
            match_num: null,
            slot_num: null
        };
    } /* for: all match slots - set to defaults */

    for (let index = 1; index <= Object.keys(match_items["matches"]).length; index++) {
        if (index) {
            jQuery("#" + element + "-match_" + index).data({
                question: element,
                value: jQuery("#" + element + "-match_" + index).data('value'),
                number: index,
                reverted: false
            }).draggable({
                containment: "#" + element + "_matches",
                stack: ".match_items div",
                cursor: "pointer",
                revert: function(dropped) {
                    if (!dropped) {
                        jQuery(this).hide();

                        jQuery(this).css({
                            left: 0,
                            top: 0
                        });

                        jQuery(this).data("uiDraggable").originalPosition = {
                            top: 0,
                            left: 0
                        };

                        jQuery(this).show();

                        jQuery(this).data({
                            "reverted": true
                        });

                        reset_match(element, jQuery(this).data('number'), jQuery(this).data('slot'));
                    } else {
                        jQuery(this).data({
                            "reverted": false
                        });
                    } /* if: not dropped in slot - revert */

                    /* draggable items like to move around freely, this will keep them in line */
                    reposition_matches();

                    return !dropped;
                },
                /* drag::revert */
                start: function(event, ui) {
                    const curr_match_num = jQuery(this).data("number"); // match item being dragged
                    const curr_drag = jQuery(this); // match object being dragged
                    start_position = null; // clear starting position
                    end_position = null; // clear ending position

                    /* fix word-wrap caused by partial pixels on auto widths */
                    if (curr_drag.hasClass('input-auto')) {
                        if (!jQuery(this).data("width")) {
                            jQuery(this).data({
                                "width": curr_drag.width() + 1
                            });
                        } /* if: initial width hasn't been stored, store it */
                        curr_drag.width(curr_drag.width());
                    } /* if: auto sizing input */

                    /* * *
                     *      Scan through a given question's match slots to see if the match item being dragged started in a slot.
                     *      Matches need to be able to revert to starting position if they are not dropped into new slot.
                     *      Starting slot will need to be unlocked and cleared if match item moves (done on draggable.stop event).
                     */
                    jQuery.each(jQuery("#" + element + "_matches").find('.ui-droppable'), function(index, value) {
                        for (let j = 1; j < question["validateOn"]["matched"].length; j++) {
                            let curr_match = question["validateOn"].matched[j];
                            if (curr_match_num == curr_match.match_num) {
                                start_position = j;
                            } /* if: matching numbers - set starting position */
                        } /* for: all matched items - check slots */
                    });
                },
                /* drag::start */
                stop: function(event, ui) {
                    /* * *
                     *      If end position is not set, set it to starting position.
                     *      If end position is starting position, lock corresponding droppable slot (match item has not moved).
                     *      If starting position is set, unlock initial droppable slot (match item has moved to a new slot).
                     */
                    end_position = end_position ? end_position : start_position;

                    if (end_position != start_position) {
                        if (start_position) {
                            jQuery("#" + element + "-slot_" + start_position).droppable("enable");
                        } /* if: start postion is set */
                    } /* if: not same slot - unlock slot */

                    /* If it has reverted, don't reposition again. */
                    if (!jQuery(this).data('reverted')) {
                        //reposition_matches();
                    } /* if: reverted */
                } /* drag::stop */
            }); /* draggable::match item */
        } /* if: match index set */
    } /* for: all match items */
} /* initialize_matches */

/* * *
 *   Returns match item to initial state.
 */
function reset_match(element, index, slot) {

    let e = jQuery('#' + element + '-match_' + index);

    if (slot) {
        jQuery('#' + element + "-slot_" + slot).droppable('enable');

        questions[0][element]["validateOn"].matched[slot] = {
            valid: null,
            match_num: null,
            slot_num: null
        };
    } /* if: slot is set */

    e.removeClass("valid");
    e.removeClass("invalid");
    e.data({
        "slot": null
    });

    e.attr("readonly", false);
    e.css("position", "relative");

    if (e.hasClass('input-auto')) {
        e.width('auto');
        e.parent().width('auto');
        e.parent().css('margin', '');
    } /* if: match item auto sizes */

    e.draggable("enable");

    e.addClass('ui-state-highlight');

    e.css({
        left: 0,
        top: 0
    });

    e.removeClass('ui-state-highlight', 400);

} /* reset_match */

/* * *
 *      Validates match item drop events.
 */
function handleMatchDrop(event, ui) {

    const element = ui.draggable.data("question");
    const question = questions[0][element];
    const matches = question["validateOn"]["matches"];
    const slots = question["validateOn"]["slots"];
    const slot_num = jQuery(this).data("number");
    const match_num = ui.draggable.data("number");
    const value = ui.draggable.data("value");
    const previous = question["validateOn"].matched[start_position];
    const drop_zone = jQuery(this).hasClass('drop-zone');
    end_position = slot_num;

    ui.draggable.data({
        "slot": slot_num
    });

    /* * *
     *      If previous is set and is not the same as the end position, clear data for previous slot.
     *      Disable current slot so that no more drops can be accepted.
     *      Position draggable to the top left of the slot container.
     *      Disable draggable from reverting to initial state.
     */
    if (previous) {
        if (end_position != previous.slot_num) {
            question["validateOn"].matched[previous.slot_num] = {
                valid: null,
                match_num: null,
                slot_num: null
            };
        }
    }

    /* disables container from accepting additional drops */
    jQuery(this).droppable("disable");

    /* * *
     *  If dropped item's value matches the accepted input, mark correct.
     *  Otherwise mark slot incorrect.
     *  When all slots have been filled mark all correct or all incorrect.
     *  Does not show which slots are correct.
     */
    if (jQuery.inArray(value.toLowerCase(), question['answers']['slot'][slot_num]) !== -1) {
        valid_match(ui.draggable[0]);
        question["validateOn"].matched[slot_num] = {
            valid: true,
            match_num: match_num,
            slot_num: slot_num
        };
    } else {
        invalid_match(ui.draggable[0]);
        question["validateOn"].matched[slot_num] = {
            valid: false,
            match_num: match_num,
            slot_num: slot_num
        };
    } /* if: valid match - set match true | else: set match false */

    let num_matches = 0;
    let num_correct = 0;

    for (let i = 1; i < slots + 1; i++) {
        if (question["validateOn"].matched[i].valid != null) {
            num_matches++;
        }
        if (question["validateOn"].matched[i].valid == true) {
            num_correct++;
        }
    } /* for: all match slots - check if valid and increment counters */

    const match_elements = jQuery("#" + element + "_match_items").find('.ui-draggable');
    const matched = question['validateOn'].matched;

    /* * *
     *  Check if all slots are filled.
     *  If they are, see if they're all filled correctly and generate tracks.
     *  Otherwise, mark incorrect and continue letting the slots be arranged.
     */
    if (num_matches == slots) {
        let xAPI_answer = '';

        if (num_correct == slots) {
            let markup = '';

            question.passed = true;

            for (let i = 1; i < matched.length; i++) {
                const a = question['validateOn']['matches'][question['validateOn']['matched'][i].match_num];
                if (matched[i].match_num && a) {
                    markup += '<input type="hidden" name="' + element + '-slot_' + (i) + '" value="' + a + '" />';
                    generate_matching(question, i, a);
                    xAPI_answer += "[" + a + "] ";
                } /* if: match is set and answer is set - generate synthesized tracks and xAPI info */
            } /* for: all matches - generate hidden inputs to pass data to playback */

            const match_reset = document.querySelector("[name='" + element + "_match_reset']");

            match_reset.innerHTML = "<i class='far fa-check'></i>";
            match_reset.className += " valid-border";
            match_reset.setAttribute('disabled', true);

            jQuery('#activity').append(markup);

            markCompleted(element, question, xAPI_answer);
        } else {
            const attempt = !question['attempt'] ? 1 : question['attempt'] += 1;
            question['answered'] = xAPI_answer;
            markIncorrect(element, question['feedback'][attempt]);
        } /* if: all slots are correct */
    } /* if: all slots are filled */

    /* sets position of the match to the position of the container */
    ui.draggable.position({ of: jQuery(this),
        my: "left top",
        at: "left top"
    });

} /* handleMatchDrop */

/* * *
 *   Sets appropriate classes for valid match items
 */
function valid_match(element) {
    element.classList.remove('invalid');
    element.className += ' valid';
    jQuery(element).draggable('disable');
} /* valid match */

/* * *
 *   Sets appropriate classes for invalid match items
 */
function invalid_match(element) {
    element.classList.remove('valid');
    element.className += ' invalid';
} /* invalid match */

/* * *
 *   Positions matching items to stay in their containers.
 */
function reposition_matches() {

    const matches = document.querySelectorAll('.ui-draggable.valid, .ui-draggable.invalid');

    for (let i = 0; i < matches.length; i++) {

        const match = matches[i];
        const question = jQuery(match).data("question");
        const slot = document.getElementById(question + "-slot_" + jQuery(match).data("slot"));

        if (slot.classList.contains('drop-zone')) {
            match.parentNode.style.width = 0;
            match.parentNode.style.margin = "0px -2.25px";
            match.style.width = slot.offsetWidth + "px";
        } else {
            // match.style.width = 'inherit';
        } /* if: match is a drop zone - set node styles | else: style to default */

        jQuery(match).position({ of: slot,
            my: "left top",
            at: "left top"
        });
    }

} /* reposition_matches */

function get_progressbar(){
    let hidden = [];

    let progressbar = '<div class="progress" id="question_progress">';
    let bg = ''
    let valuenow = 0;
    let name = '';

    for (let i in progress){
        if(isNumeric(i)){
            let current_question = questions[0][progress[i][0]];
            if(typeof current_question['hidden'] !== 'undefined' && current_question['hidden'] == true){
                hidden.push(parseInt(i));
            }
        }
    }

    let segment = 100 / (progress.length - hidden.length);

    for (let i = 0; i < progress.length; i++){
        if(!hidden.includes(i)){
            name = progress[i][0].replace(/question_/, '');

            if(typeof progress[i][1] == 'undefined'){
                bg = 'bg-empty';
            } else {
                bg = progress[i][1] ? 'bg-success' : 'bg-danger';
            }

            valuenow = segment * i;
            progressbar += '<div class="progress-bar '+bg+'" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: '+segment+'%">'+name+'</div>';
        }
    }

    progressbar += '</div>';

    return progressbar;
}