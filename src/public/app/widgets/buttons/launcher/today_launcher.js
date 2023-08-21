import NoteLauncher from "./note_launcher.js";
import dateNotesService from "../../../services/date_notes.js";
import appContext from "../../../components/app_context.js";

export default class TodayLauncher extends NoteLauncher {
    async getTargetNoteId() {
        const todayNote = await dateNotesService.getWeekNote();

        return todayNote.noteId;
    }

    getHoistedNoteId() {
        return appContext.tabManager.getActiveContext().hoistedNoteId;
    }
}
