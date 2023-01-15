import options from "../../services/options.js";
import CommandButtonWidget from "./command_button.js";

export default class ToggleNoteContentMaximizedWidget extends CommandButtonWidget {
    constructor() {
        super();

        this.class("launcher-button");

        this.settings.icon = () => options.is('noteContentMaximized')
            ? "bx-exit-fullscreen"
            : "bx-fullscreen";

        this.settings.title = () => options.is('noteContentMaximized')
            ? "Unmaximize Note Content"
            : "Maximize Note Content";

        this.settings.command = () => options.is('noteContentMaximized')
            ? "hideNoteContentMaximized"
            : "showNoteContentMaximized";
    }

    refreshIcon() {
        super.refreshIcon();
    }

    entitiesReloadedEvent({loadResults}) {
        if (loadResults.isOptionReloaded("noteContentMaximized")) {
            this.refreshIcon();
        }
    }
}
