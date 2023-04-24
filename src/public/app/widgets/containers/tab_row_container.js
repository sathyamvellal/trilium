import options from "../../services/options.js";
import FlexContainer from "./flex_container.js";
import TabRowWidget from "../tab_row.js";
import TitleBarButtonsWidget from "../title_bar_buttons.js";

export default class TabRowContainer extends FlexContainer {
    constructor() {
        super('row');

        this.css('height', '40px')
            .child(new TabRowWidget())
            .child(new TitleBarButtonsWidget());
    }

    refresh() {
        this.toggleInt(options.is("noteContentMaximized"));
    }

    entitiesReloadedEvent({loadResults}) {
        if (loadResults.isOptionReloaded("noteContentMaximized")) {
            this.refresh();
        }
    }

    initialRenderCompleteEvent() {
        this.refresh();
    }
}