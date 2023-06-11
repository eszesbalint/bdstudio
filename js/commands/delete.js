import { Command } from './command.js';


class DeleteCommand extends Command {
    constructor(editor, objects) {
        super(editor);
        this.parentUUID = objects[0].parent.uuid;
        this.objectsJSON = editor.objectsToJSON(objects, true);
        this.objectUUIDs = [];
        for (let object of objects) {
            this.objectUUIDs.push(object.uuid);
        }
    }

    async execute() {
        for (let uuid of this.objectUUIDs) {
            let object = this.editor.get(uuid);
            object.parent.remove(object);
        }
    }

    async revert() {
        let objects = await this.editor.objectsFromJSON(this.objectsJSON, true);
        for (let object of objects) {
            this.editor.get(this.parentUUID).add(object);
        }
    }
}

export { DeleteCommand };