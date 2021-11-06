import BasicWidget from "../../basic_widget.js";

const WIDGET_TPL = `
<div class="dropdown">
    <a title="Global actions" class="icon-action bx bx-cog dropdown-toggle" data-toggle="dropdown"></a>

    <div class="dropdown-menu dropdown-menu-right">
        <a class="dropdown-item" data-trigger-command="switchToDesktopVersion"><span class="bx bx-laptop"></span> Switch to desktop version</a>
        <a class="dropdown-item" data-trigger-command="logout"><span class="bx bx-log-out"></span> Logout</a>
    </div>
</div>
`;


class GlobalActionsButton extends BasicWidget {
    doRender() {
        this.$widget = $(WIDGET_TPL);
    }
}

export default GlobalActionsButton;
