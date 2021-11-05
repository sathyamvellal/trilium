import froca from "./froca.js";
import server from "./server.js";
import ws from "./ws.js";

/** @return {NoteShort} */
async function getCustomNote(rootNoteLabel, date) {
    const note = await server.get('custom-notes/' + rootNoteLabel + '/' + date, "custom-note");

    await ws.waitForMaxKnownEntityChangeId();

    return await froca.getNote(note.noteId);
}

export default {
    getCustomNote,
}
