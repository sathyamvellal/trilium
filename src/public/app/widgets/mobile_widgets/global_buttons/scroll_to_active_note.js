import BasicWidget from "../../basic_widget.js";

const WIDGET_TPL = `
<a data-trigger-command="scrollToActiveNote" title="Scroll to active note" class="icon-action bx bx-crosshair"></a>
`;


class ScrollToActiveNoteButton extends BasicWidget {
    doRender() {
        this.$widget = $(WIDGET_TPL);
    }
}

export default ScrollToActiveNoteButton;
