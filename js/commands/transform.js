import { Command } from './command.js';


class TransformCommand extends Command {
    constructor(editor, object) {
        super(editor);
        this.objectUUID = object.uuid;
        this.beforeMatrix = undefined;
        this.afterMatrix = undefined;
    }

    execute() {
        let object = this.editor.objects.getObjectByProperty('uuid', this.objectUUID);
        
        this.afterMatrix.decompose(object.position, object.quaternion, object.scale);
        object.updateMatrix();

    }

    revert() {
        let object = this.editor.objects.getObjectByProperty('uuid', this.objectUUID);

        this.beforeMatrix.decompose(object.position, object.quaternion, object.scale);
        object.updateMatrix();

    }
}

export { TransformCommand };