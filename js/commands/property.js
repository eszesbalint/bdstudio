import { Command } from './command.js';


class PropertyCommand extends Command {
    constructor(editor, object, property, value) {
        super(editor);
        this.objectUUID = object.uuid;
        this.property = property;
        this.beforeValue = undefined;
        this.afterValue = value;
    }

    async execute() {
        let object = this.editor.get(this.objectUUID);
        if (!this.beforeValue) this.beforeValue = object[this.property];
        object[this.property] = this.afterValue;
    }

    async revert() {
        let object = this.editor.get(this.objectUUID);
        object[this.property] = this.beforeValue;
    }
}

export { PropertyCommand };