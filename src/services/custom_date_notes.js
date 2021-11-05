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
    console.log("customRootLabel:", customRootLabel);
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
function getYearNote(dateStr, rootNoteLabel, rootNote) {
    if (!rootNote) {
        rootNote = getRootNote(rootNoteLabel);
    }

    const yearStr = dateStr.substr(0, 4);

    let yearNote = attributeService.getNoteWithLabel(getYearLabel(rootNoteLabel), yearStr)
        || getNoteStartingWith(rootNote.noteId, yearStr);

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

function getMonthNoteTitle(rootNote, monthNumber, dateObj) {
    const pattern = rootNote.getOwnedLabelValue("monthPattern") || "{monthNumberPadded} - {month}";
    const monthName = MONTHS[dateObj.getMonth()];

    return pattern
        .replace(/{monthNumberPadded}/g, monthNumber)
        .replace(/{month}/g, monthName);
}

/** @return {Note} */
function getMonthNote(dateStr, rootNoteLabel, rootNote) {
    if (!rootNote) {
        rootNote = getRootNote(rootNoteLabel);
    }

    const monthStr = dateStr.substr(0, 7);
    const monthNumber = dateStr.substr(5, 2);

    let monthNote = attributeService.getNoteWithLabel(getMonthLabel(rootNoteLabel), monthStr);

    if (monthNote) {
        return monthNote;
    }

    const yearNote = getYearNote(dateStr, rootNoteLabel, rootNote);

    monthNote = getNoteStartingWith(yearNote.noteId, monthNumber);

    if (monthNote) {
        return monthNote;
    }

    const dateObj = dateUtils.parseLocalDate(dateStr);

    const noteTitle = getMonthNoteTitle(rootNote, monthNumber, dateObj);

    sql.transactional(() => {
        monthNote = createNote(yearNote, noteTitle);

        attributeService.createLabel(monthNote.noteId, getMonthLabel(rootNoteLabel), monthStr);
        attributeService.createLabel(monthNote.noteId, 'sorted');

        const monthTemplateAttr = rootNote.getOwnedAttribute('relation', 'monthTemplate');

        if (monthTemplateAttr) {
            attributeService.createRelation(monthNote.noteId, 'template', monthTemplateAttr.value);
        }
    });

    return monthNote;
}

function getStartOfTheWeek(date, startOfTheWeek) {
    const day = date.getDay();
    let diff;

    if (startOfTheWeek === 'monday') {
        diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    }
    else if (startOfTheWeek === 'sunday') {
        diff = date.getDate() - day;
    }
    else {
        throw new Error("Unrecognized start of the week " + startOfTheWeek);
    }

    return new Date(date.setDate(diff));
}

function getWeekNoteTitle(rootNote, dayNumber, dateObj) {
    const pattern = rootNote.getOwnedLabelValue("weekPattern") || "Week of {monthNumberPadded}-{dayInMonthPadded}";
    const monthNumber = dateUtils.utcDateStr(dateObj).substr(5, 2);

    return pattern
        .replace(/{monthNumberPadded}/g, monthNumber)
        .replace(/{dayInMonthPadded}/g, dayNumber);
}

/** @return {Note} */
function getWeekNote(dateStr, rootNoteLabel, rootNote) {
    const dateObj = getStartOfTheWeek(dateUtils.parseLocalDate(dateStr), 'monday');
    dateStr = dateUtils.utcDateStr(dateObj);

    if (!rootNote) {
        rootNote = getRootNote(rootNoteLabel);
    }

    let weekNote = attributeService.getNoteWithLabel(getWeekLabel(rootNoteLabel), dateStr);

    if (weekNote) {
        return weekNote;
    }

    const monthNote = getMonthNote(dateStr, rootNoteLabel, rootNote);
    const dayNumber = dateStr.substr(8, 2);

    weekNote = getNoteEndingith(monthNote.noteId, dayNumber);

    if (weekNote) {
        return weekNote;
    }

    const noteTitle = getWeekNoteTitle(rootNote, dayNumber, dateObj);

    sql.transactional(() => {
        weekNote = createNote(monthNote, noteTitle);

        attributeService.createLabel(weekNote.noteId, getWeekLabel(rootNoteLabel), dateStr);
        attributeService.createLabel(weekNote.noteId, 'sorted');

        const weekTemplateAttr = rootNote.getOwnedAttribute('relation', 'weekTemplate');

        if (weekTemplateAttr) {
            attributeService.createRelation(weekTemplateAttr.noteId, 'template', weekTemplateAttr.value);
        }
    });

    return weekNote;
}

function getDateNoteTitle(rootNote, dayNumber, dateObj) {
    const pattern = rootNote.getOwnedLabelValue("datePattern") || "{dayInMonthPadded} - {weekDay}";
    const weekDay = DAYS[dateObj.getDay()];

    return pattern
        .replace(/{dayInMonthPadded}/g, dayNumber)
        .replace(/{isoDate}/g, dateUtils.localNowDate())
        .replace(/{weekDay}/g, weekDay)
        .replace(/{weekDay3}/g, weekDay.substr(0, 3))
        .replace(/{weekDay2}/g, weekDay.substr(0, 2));
}

/** @return {Note} */
function getDateNote(dateStr, rootNoteLabel, rootNote) {
    console.log("rootNoteLabel:", rootNoteLabel);
    console.log("rootNote:", rootNote);
    let dateNote = attributeService.getNoteWithLabel(getDateLabel(rootNoteLabel), dateStr);

    if (dateNote) {
        return dateNote;
    }

    rootNote = rootNote || getRootNote(rootNoteLabel);
    const weekNote = getWeekNote(dateStr, rootNoteLabel, rootNote);
    const dayNumber = dateStr.substr(8, 2);

    dateNote = getNoteStartingWith(weekNote.noteId, dayNumber);

    if (dateNote) {
        return dateNote;
    }

    const dateObj = dateUtils.parseLocalDate(dateStr);

    const noteTitle = getDateNoteTitle(rootNote, dayNumber, dateObj);

    sql.transactional(() => {
        dateNote = createNote(weekNote, noteTitle);

        attributeService.createLabel(dateNote.noteId, getDateLabel(rootNoteLabel), dateStr.substr(0, 10));

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