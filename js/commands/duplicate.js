import * as THREE from 'three';

import { Command } from './command.js';

import { BlockDisplay } from '../elements/blockDisplay.js'

class DuplicateCommand extends Command {
    constructor(editor, objects) {
        super(editor);
        this.parentUUID = objects[0].parent.uuid;
        this.objectsJSON = editor.objectsToJSON(objects, true);
        this.resultJSON = undefined;

    }

    async execute() {
        if (this.resultJSON){
            let objects = await this.editor.objectsFromJSON(this.resultJSON, true);
            for (let object of objects) {
                this.editor.get(this.parentUUID).add(object);
            }
        } else {
            let objects = await this.editor.objectsFromJSON(this.objectsJSON, false);
            for (let object of objects) {
                this.editor.get(this.parentUUID).add(object);
            }
            this.resultJSON = this.editor.objectsToJSON(
                objects,
                true
            );
        }

    }

    revert() {
        let list = JSON.parse(this.resultJSON);
        for (let dict of list){
            let object = this.editor.get(dict.uuid);
            object.parent.remove(object);
        }
    }
}

export { DuplicateCommand };