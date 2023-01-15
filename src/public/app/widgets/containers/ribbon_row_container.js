import options from "../../services/options.js";
import RibbonContainer from "./ribbon_container.js";
import ScriptExecutorWidget from "../ribbon_widgets/script_executor.js";
import SearchDefinitionWidget from "../ribbon_widgets/search_definition.js";
import EditedNotesWidget from "../ribbon_widgets/edited_notes.js";
import BookPropertiesWidget from "../ribbon_widgets/book_properties.js";
import NotePropertiesWidget from "../ribbon_widgets/note_properties.js";
import FilePropertiesWidget from "../ribbon_widgets/file_properties.js";
import ImagePropertiesWidget from "../ribbon_widgets/image_properties.js";
import PromotedAttributesWidget from "../ribbon_widgets/promoted_attributes.js";
import BasicPropertiesWidget from "../ribbon_widgets/basic_properties.js";
import OwnedAttributeListWidget from "../ribbon_widgets/owned_attribute_list.js";
import InheritedAttributesWidget from "../ribbon_widgets/inherited_attribute_list.js";
import NotePathsWidget from "../ribbon_widgets/note_paths.js";
import NoteMapRibbonWidget from "../ribbon_widgets/note_map.js";
import SimilarNotesWidget from "../ribbon_widgets/similar_notes.js";
import NoteInfoWidget from "../ribbon_widgets/note_info_widget.js";
import NoteRevisionsButton from "../buttons/note_revisions_button.js";
import NoteActionsWidget from "../buttons/note_actions.js";

export default class RibbonRowContainer extends RibbonContainer {
    constructor() {
        super();

        this.ribbon(new ScriptExecutorWidget())
            .ribbon(new SearchDefinitionWidget())
            .ribbon(new EditedNotesWidget())
            .ribbon(new BookPropertiesWidget())
            .ribbon(new NotePropertiesWidget())
            .ribbon(new FilePropertiesWidget())
            .ribbon(new ImagePropertiesWidget())
            .ribbon(new PromotedAttributesWidget())
            .ribbon(new BasicPropertiesWidget())
            .ribbon(new OwnedAttributeListWidget())
            .ribbon(new InheritedAttributesWidget())
            .ribbon(new NotePathsWidget())
            .ribbon(new NoteMapRibbonWidget())
            .ribbon(new SimilarNotesWidget())
            .ribbon(new NoteInfoWidget())
            .button(new NoteRevisionsButton())
            .button(new NoteActionsWidget())
    }

    entitiesReloadedEvent({loadResults}) {
        if (loadResults.isOptionReloaded("noteContentMaximized")) {
            this.toggleInt(options.is("noteContentMaximized"));
        }
    }
}