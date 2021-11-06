import BasicWidget from "../../basic_widget.js";

const WIDGET_TPL = `
<a data-trigger-command="createNoteIntoInbox" title="New note" class="icon-action bx bx-folder-plus"></a>
`;


class CreateNoteIntoInboxButton extends BasicWidget {
    doRender() {
        this.$widget = $(WIDGET_TPL);
    }
}

export default CreateNoteIntoInboxButton;
