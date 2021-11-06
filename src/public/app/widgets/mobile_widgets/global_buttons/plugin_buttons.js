import BasicWidget from "../../basic_widget.js";

const WIDGET_TPL = `
<style>
#plugin-buttons-placeholder {
    font-size: smaller;
    padding: 5px;
}
</style>

<div class="dropdown">
    <a title="Plugin buttons" class="icon-action bx bx-extension dropdown-toggle" data-toggle="dropdown"></a>

    <div id="plugin-buttons" class="dropdown-menu dropdown-menu-right">
        <p id="plugin-buttons-placeholder">No plugin buttons loaded yet.</p>
    </div>
</div>
`;


class PluginButtonsButton extends BasicWidget {
    doRender() {
        this.$widget = $(WIDGET_TPL);
    }
}

export default PluginButtonsButton;
