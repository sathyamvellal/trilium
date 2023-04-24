import options from "../../services/options.js";
import FlexContainer from "./flex_container.js";
import NoteIconWidget from "../note_icon.js";
import NoteTitleWidget from "../note_title.js";
import SpacerWidget from "../spacer.js";
import ClosePaneButton from "../buttons/close_pane_button.js";
import CreatePaneButton from "../buttons/create_pane_button.js";

export default class TitleRowContainer extends FlexContainer {
    constructor() {
        super('row');
        
        this.class('title-row')
            .css("height", "50px")
            .css("min-height", "50px")
            .css('align-items', "center")
            .cssBlock('.title-row > * { margin: 5px; }')
            .child(new NoteIconWidget())
            .child(new NoteTitleWidget())
            .child(new SpacerWidget(0, 1))
            .child(new ClosePaneButton())
            .child(new CreatePaneButton());
    }
}