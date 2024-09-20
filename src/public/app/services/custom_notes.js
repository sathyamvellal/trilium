import froca from "./froca.js";
import server from "./server.js";
import ws from "./ws.js";

var defaultParams = {
    startOfTheWeek: 'monday',
    labeledDayNote: true,
    labeledWeekNote: true,
    labeledMonthNote: true,
};

/** @return {NoteShort} */
async function getDayNote(rootNoteLabel, date, params={}) {
    params = Object.assign({}, defaultParams, params);
    const note = await server.get('custom-notes/' + rootNoteLabel + '/date/' + date + '?' + new URLSearchParams(params), "custom-note");

    await ws.waitForMaxKnownEntityChangeId();

    return await froca.getNote(note.noteId);
}

/** @return {NoteShort} */
async function getWeekNote(rootNoteLabel, date, params={}) {
    params = Object.assign({}, defaultParams, params);
    const note = await server.get('custom-notes/' + rootNoteLabel + '/week/' + date + '?' + new URLSearchParams(params), "custom-note");

    await ws.waitForMaxKnownEntityChangeId();

    return await froca.getNote(note.noteId);
}

/** @return {NoteShort} */
async function getMonthNote(rootNoteLabel, date, params={}) {
    params = Object.assign({}, defaultParams, params);
    const note = await server.get('custom-notes/' + rootNoteLabel + '/month/' + date + '?' + new URLSearchParams(params), "custom-note");

    await ws.waitForMaxKnownEntityChangeId();

    return await froca.getNote(note.noteId);
}

/** @return {NoteShort} */
async function getYearNote(rootNoteLabel, date, params={}) {
    params = Object.assign({}, defaultParams, params);
    const note = await server.get('custom-notes/' + rootNoteLabel + '/year/' + date + '?' + new URLSearchParams(params), "custom-note");

    await ws.waitForMaxKnownEntityChangeId();

    return await froca.getNote(note.noteId);
}

export default {
    getDayNote,
    getWeekNote,
    getMonthNote,
    getYearNote,
}
