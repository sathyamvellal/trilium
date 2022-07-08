"use strict";

const noteService = require('./notes');
const attributeService = require('./attributes');
const dateUtils = require('./date_utils');
const becca = require('../becca/becca');
const sql = require('./sql');
const protectedSessionService = require('./protected_session');

const CALENDAR_ROOT_LABEL = 'calendarRoot';
const YEAR_LABEL_SUFFIX = 'yearNote';
const MONTH_LABEL_SUFFIX = 'monthNote';
const WEEK_LABEL_SUFFIX = 'weekNote';
const DATE_LABEL_SUFFIX = 'dateNote';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function createNote(parentNote, noteTitle) {
    return noteService.createNewNote({
        parentNoteId: parentNote.noteId,
        title: noteTitle,
        content: '',
        isProtected: parentNote.isProtected && protectedSessionService.isProtectedSessionAvailable(),
        type: 'text'
    }).note;
}

function getYearLabel(rootNoteLabel) {
    return rootNoteLabel + "_" + YEAR_LABEL_SUFFIX;
}

function getMonthLabel(rootNoteLabel) {
    return rootNoteLabel + "_" + MONTH_LABEL_SUFFIX;
}

function getWeekLabel(rootNoteLabel) {
    return rootNoteLabel + "_" + WEEK_LABEL_SUFFIX;
}

function getDateLabel(rootNoteLabel) {
    return rootNoteLabel + "_" + DATE_LABEL_SUFFIX;
}

function getNoteStartingWith(parentNoteId, startsWith) {
    const noteId = sql.getValue(`SELECT notes.noteId FROM notes JOIN branches USING(noteId) 
                                    WHERE parentNoteId = ? AND title LIKE '${startsWith}%'
                                    AND notes.isDeleted = 0 AND isProtected = 0 
                                    AND branches.isDeleted = 0`, [parentNoteId]);

    return becca.getNote(noteId);
}

function getNoteEndingith(parentNoteId, endsWith) {
    const noteId = sql.getValue(`SELECT notes.noteId FROM notes JOIN branches USING(noteId) 
                                    WHERE parentNoteId = ? AND title LIKE '${endsWith}%'
                                    AND notes.isDeleted = 0 AND isProtected = 0 
                                    AND branches.isDeleted = 0`, [parentNoteId]);

    return becca.getNote(noteId);
}

/** @return {Note} */
function getRootNote(customRootLabel) {
    let rootNote = attributeService.getNoteWithLabel(customRootLabel);

    if (!rootNote) {
        sql.transactional(() => {
            rootNote = noteService.createNewNote({
                parentNoteId: 'root',
                title: 'Calendar',
                target: 'into',
                isProtected: false,
                type: 'text',
                content: ''
            }).note;

            attributeService.createLabel(rootNote.noteId, customRootLabel);
            attributeService.createLabel(rootNote.noteId, 'sorted');
        });
    }

    return rootNote;
}

/** @return {Note} */
function getYearNote(dateStr, rootNoteLabel, rootNote, params) {
    if (!rootNote) {
        rootNote = getRootNote(rootNoteLabel);
    }

    const yearStr = dateStr.substr(0, 4);

    let yearNote = attributeService.getNoteWithLabel(getYearLabel(rootNoteLabel), yearStr);

    if (yearNote) {
        return yearNote;
    }

    sql.transactional(() => {
        yearNote = createNote(rootNote, yearStr);

        attributeService.createLabel(yearNote.noteId, getYearLabel(rootNoteLabel), yearStr);
        attributeService.createLabel(yearNote.noteId, 'sorted');

        const yearTemplateAttr = rootNote.getOwnedAttribute('relation', 'yearTemplate');

        if (yearTemplateAttr) {
            attributeService.createRelation(yearNote.noteId, 'template', yearTemplateAttr.value);
        }
    });

    return yearNote;
}

function getMonthNoteTitle(monthNoteTitlePattern, rootNote, monthNumber, dateObj) {
    const pattern = monthNoteTitlePattern || rootNote.getOwnedLabelValue("monthPattern") || "{monthNumberPadded} - {month}";
    const monthName = MONTHS[dateObj.getMonth()];

    return pattern
        .replace(/{monthNumberPadded}/g, monthNumber)
        .replace(/{month}/g, monthName);
}

/** @return {Note} */
function getMonthNote(dateStr, rootNoteLabel, rootNote, params) {
    if (!rootNote) {
        rootNote = getRootNote(rootNoteLabel);
    }

    const monthStr = dateStr.substr(0, 7);
    const monthNumber = dateStr.substr(5, 2);

    let monthNote = attributeService.getNoteWithLabel(getMonthLabel(rootNoteLabel), monthStr);

    if (monthNote) {
        return monthNote;
    }

    const yearNote = getYearNote(dateStr, rootNoteLabel, rootNote, params);

    const dateObj = dateUtils.parseLocalDate(dateStr);
    const noteTitle = getMonthNoteTitle(params.monthNoteTitlePattern, rootNote, monthNumber, dateObj);

    sql.transactional(() => {
        monthNote = createNote(yearNote, noteTitle);

        if (params.labeledMonthNote == "true") {
            attributeService.createLabel(monthNote.noteId, getMonthLabel(rootNoteLabel), monthStr);
        }
        attributeService.createLabel(monthNote.noteId, 'sorted');

        const monthTemplateAttr = rootNote.getOwnedAttribute('relation', 'monthTemplate');

        if (monthTemplateAttr) {
            attributeService.createRelation(monthNote.noteId, 'template', monthTemplateAttr.value);
        }
    });

    return monthNote;
}

function getStartDateOfTheWeek(date, startOfTheWeek) {
    const day = date.getDay();
    let diff;

    if (startOfTheWeek === 'monday') {
        diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    } else if (startOfTheWeek === 'tuesday') {
        diff = date.getDate() - day + (day === 0 ? -5 : 2); // adjust when day is sunday
    } else if (startOfTheWeek === 'wednesday') {
        diff = date.getDate() - day + (day === 0 ? -4 : 3); // adjust when day is sunday
    } else if (startOfTheWeek === 'thursday') {
        diff = date.getDate() - day + (day === 0 ? -3 : 4); // adjust when day is sunday
    } else if (startOfTheWeek === 'friday') {
        diff = date.getDate() - day + (day === 0 ? -2 : 5); // adjust when day is sunday
    } else if (startOfTheWeek === 'saturday') {
        diff = date.getDate() - day + (day === 0 ? -1 : 6); // adjust when day is sunday
    } else if (startOfTheWeek === 'sunday') {
        diff = date.getDate() - day;
    }
    else {
        throw new Error("Unrecognized start of the week " + startOfTheWeek);
    }

    return new Date(date.setDate(diff));
}

function getWeekNoteTitle(weekNoteTitlePattern, rootNote, dayNumber, dateObj) {
    const pattern = weekNoteTitlePattern || rootNote.getOwnedLabelValue("weekPattern") || "Week of {monthNumberPadded}-{dayInMonthPadded}";
    const monthNumber = dateUtils.utcDateStr(dateObj).substr(5, 2);

    return pattern
        .replace(/{monthNumberPadded}/g, monthNumber)
        .replace(/{dayInMonthPadded}/g, dayNumber);
}

/** @return {Note} */
function getWeekNote(dateStr, rootNoteLabel, rootNote, params) {
    const dateObj = getStartDateOfTheWeek(dateUtils.parseLocalDate(dateStr), params.startOfTheWeek);
    dateStr = dateUtils.utcDateStr(dateObj).substr(0, 10);
    console.log("dateObj (getStartDateOfTheWeek)", dateObj);
    console.log("dateStr (getStartDateOfTheWeek)", dateStr);

    if (!rootNote) {
        rootNote = getRootNote(rootNoteLabel);
    }
    console.log("rootNote (getRootNote)", rootNote);

    let weekNote = attributeService.getNoteWithLabel(getWeekLabel(rootNoteLabel), dateStr);
    console.log("weekNote (getNoteWithLabel)", weekNote);

    if (weekNote) {
        return weekNote;
    }

    const monthNote = getMonthNote(dateStr, rootNoteLabel, rootNote, params);
    const dayNumber = dateStr.substr(8, 2);
    console.log("dayNumber (getMonthNote)", dayNumber);

    const noteTitle = getWeekNoteTitle(params.weekNoteTitlePattern, rootNote, dayNumber, dateObj);

    sql.transactional(() => {
        weekNote = createNote(monthNote, noteTitle);
        console.log("weekNote (createNote)", weekNote);

        if (params.labeledWeekNote == "true") {
            attributeService.createLabel(weekNote.noteId, getWeekLabel(rootNoteLabel), dateStr);
        }
        attributeService.createLabel(weekNote.noteId, 'sorted');

        const weekTemplateAttr = rootNote.getOwnedAttribute('relation', 'weekTemplate');

        if (weekTemplateAttr) {
            attributeService.createRelation(weekTemplateAttr.noteId, 'template', weekTemplateAttr.value);
        }
    });

    return weekNote;
}

function getDateNoteTitle(dateNoteTitlePattern, rootNote, dayNumber, dateObj) {
    const pattern = dateNoteTitlePattern || rootNote.getOwnedLabelValue("datePattern") || "{dayInMonthPadded} - {weekDay}";
    const weekDay = DAYS[dateObj.getDay()];
    const monthNumber = dateUtils.utcDateStr(dateObj).substr(5, 2);

    return pattern
        .replace(/{monthNumber}/g, monthNumber)
        .replace(/{dayInMonthPadded}/g, dayNumber)
        .replace(/{isoDate}/g, dateUtils.localNowDate())
        .replace(/{weekDay}/g, weekDay)
        .replace(/{weekDay3}/g, weekDay.substr(0, 3))
        .replace(/{weekDay2}/g, weekDay.substr(0, 2));
}

/** @return {Note} */
function getDateNote(dateStr, rootNoteLabel, rootNote, params) {
    let dateNote = attributeService.getNoteWithLabel(getDateLabel(rootNoteLabel), dateStr);

    if (dateNote) {
        return dateNote;
    }

    rootNote = rootNote || getRootNote(rootNoteLabel);
    const weekNote = getWeekNote(dateStr, rootNoteLabel, rootNote, params);
    const dayNumber = dateStr.substr(8, 2);

    const dateObj = dateUtils.parseLocalDate(dateStr);
    const noteTitle = getDateNoteTitle(params.dateNoteTitlePattern, rootNote, dayNumber, dateObj);

    sql.transactional(() => {
        dateNote = createNote(weekNote, noteTitle);

        if (params.labeledDateNote == "true") {
            attributeService.createLabel(dateNote.noteId, getDateLabel(rootNoteLabel), dateStr.substr(0, 10));
        }

        const dateTemplateAttr = rootNote.getOwnedAttribute('relation', 'dateTemplate');

        if (dateTemplateAttr) {
            attributeService.createRelation(dateNote.noteId, 'template', dateTemplateAttr.value);
        }
    });

    return dateNote;
}

module.exports = {
    getRootNote,
    getYearNote,
    getMonthNote,
    getWeekNote,
    getDateNote,
};
