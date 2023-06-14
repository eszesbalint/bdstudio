import * as THREE from 'three';

import { Command } from './command.js';

import { BlockDisplay } from '../elements/blockDisplay.js'

class AddCommand extends Command {
    constructor(editor, blockStateString, parentObject) {
        super(editor);
        this.blockStateString = blockStateString;
        this.parentUUID = parentObject ? parentObject.uuid : editor.objects.uuid;
        this.resultObjectUUID = undefined;
    }

    async execute() {
        let blockDisplay = new BlockDisplay(this.editor);
        blockDisplay.blockState = this.blockStateString;
        await blockDisplay.updateModel();
        
        this.editor.get(this.parentUUID).add(blockDisplay);

        if (this.resultObjectUUID) {
            blockDisplay.uuid = this.resultObjectUUID;
        } else {
            this.resultObjectUUID = blockDisplay.uuid; 
        }

        return blockDisplay;
    }

    revert() {
        let object = this.editor.get(this.resultObjectUUID);
        object.parent.remove(object);
    }
}

export { AddCommand };