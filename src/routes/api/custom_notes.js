"use strict";

const customDateNoteService = require('../../services/custom_date_notes');

function getDateNote(req) {
    return customDateNoteService.getDateNote(req.params.date, req.params.customRoot);
}

module.exports = {
    getDateNote,
};