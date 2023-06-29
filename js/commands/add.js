import * as THREE from 'three';

import { Command } from './command.js';

import { BlockDisplay, ItemDisplay } from '../elements/elements'

class AddCommand extends Command {
    constructor(editor, identifier, type, parentObject) {
        super(editor);
        this.identifier = identifier;
        this.type = type;
        this.parentUUID = parentObject ? parentObject.uuid : editor.objects.uuid;
        this.resultObjectUUID = undefined;
    }

    async execute() {
        let display;
        switch (this.type) {
            case 'BlockDisplay':
                display = new BlockDisplay(this.editor);
                display.blockState = this.identifier;
                break;

            case 'ItemDisplay':
                display = new ItemDisplay(this.editor);
                display.itemState = this.identifier;
                break;

        }
        
        await display.updateModel();

        this.editor.get(this.parentUUID).add(display);

        if (this.resultObjectUUID) {
            display.uuid = this.resultObjectUUID;
        } else {
            this.resultObjectUUID = display.uuid;
        }

        return display;
    }

    revert() {
        let object = this.editor.get(this.resultObjectUUID);
        object.parent.remove(object);
    }
}

export { AddCommand };