"use strict";

const customDateNoteService = require('../../services/custom_date_notes.js');

function getDateNote(req) {
    return customDateNoteService.getDateNote(req.params.date, req.params.customRoot, null, req.query);
}

function getWeekNote(req) {
    return customDateNoteService.getWeekNote(req.params.date, req.params.customRoot, null, req.query);
}

function getMonthNote(req) {
    return customDateNoteService.getMonthNote(req.params.date, req.params.customRoot, null, req.query);
}

function getYearNote(req) {
    return customDateNoteService.getYearNote(req.params.date, req.params.customRoot, null, req.query);
}

module.exports = {
    getDateNote,
    getWeekNote,
    getMonthNote,
    getYearNote,
};