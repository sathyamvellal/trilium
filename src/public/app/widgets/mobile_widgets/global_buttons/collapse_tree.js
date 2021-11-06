import BasicWidget from "../../basic_widget.js";

const WIDGET_TPL = `
<a data-trigger-command="collapseTree" title="Collapse note tree" class="icon-action bx bx-layer-minus"></a>
`;


class CollapseTreeButton extends BasicWidget {
    doRender() {
        this.$widget = $(WIDGET_TPL);
    }
}

export default CollapseTreeButton;
