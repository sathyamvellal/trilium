"use strict";

const customDateNoteService = require('../../services/custom_date_notes.js');

function getDateNote(req) {
    return customDateNoteService.getDateNote(req.params.date, req.params.customRoot, null, req.query.startOfTheWeek);
}

function getWeekNote(req) {
    return customDateNoteService.getWeekNote(req.params.date, req.params.customRoot, null, req.query.startOfTheWeek);
}

function getMonthNote(req) {
    return customDateNoteService.getMonthNote(req.params.date, req.params.customRoot);
}

module.exports = {
    getDateNote,
    getWeekNote,
    getMonthNote,
};