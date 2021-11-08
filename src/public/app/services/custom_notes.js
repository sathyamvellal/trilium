import froca from "./froca.js";
import server from "./server.js";
import ws from "./ws.js";

/** @return {NoteShort} */
async function getDateNote(rootNoteLabel, date) {
    const note = await server.get('custom-notes/' + rootNoteLabel + '/date/' + date, "custom-note");

    await ws.waitForMaxKnownEntityChangeId();

    return await froca.getNote(note.noteId);
}

/** @return {NoteShort} */
async function getWeekNote(rootNoteLabel, date) {
    const note = await server.get('custom-notes/' + rootNoteLabel + '/week/' + date, "custom-note");

    await ws.waitForMaxKnownEntityChangeId();

    return await froca.getNote(note.noteId);
}

/** @return {NoteShort} */
async function getMonthNote(rootNoteLabel, date) {
    const note = await server.get('custom-notes/' + rootNoteLabel + '/month/' + date, "custom-note");

    await ws.waitForMaxKnownEntityChangeId();

    return await froca.getNote(note.noteId);
}

export default {
    getDateNote,
    getWeekNote,
    getMonthNote,
}
