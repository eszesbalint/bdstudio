import * as THREE from 'three';

import { Command } from './command.js';
import { Collection } from '../elements/collection.js';

class GroupCommand extends Command {
    constructor(editor, objects) {
        super(editor);
        this.objectUUIDs = [];
        for (let object of objects) {
            this.objectUUIDs.push(object.uuid);
        }
        this.groupUUID = undefined;
        this.groupMatrix = undefined;
        this.addToScene = true;
    }

    execute() {
        let objectList = [];
        

        for (let uuid of this.objectUUIDs){
            let object = this.editor.get(uuid);
            objectList.push(object);
        }
        let parent = objectList[0].parent

        let group = new Collection(this.editor);
        let n = this.editor.objects.getObjectsByProperty('isCollection', true).length;
        group.name = `Collection ${n}`;
        if (this.groupMatrix) {
            group.applyMatrix4(this.groupMatrix);
            //this.groupMatrix.decompose(group.position, group.quaternion, group.rotation);
            group.fromElements(objectList, true);
        } else {
            group.fromElements(objectList, false);
        }
        
        
        

        if (this.groupUUID) {
            group.uuid = this.groupUUID;
        } else {
            this.groupUUID = group.uuid; 
        }


        parent.add(group);
        

        return group;
    }

    revert() {
        let group = this.editor.get(this.groupUUID);
        group.updateMatrix();
        this.groupMatrix = group.matrix.clone();
        
        let objectList = group.toElements();

        this.objectUUIDs = [];
        for (let object of objectList) {
            this.objectUUIDs.push(object.uuid);
        }

        return objectList;
    }
}

class UngroupCommand extends GroupCommand {
    constructor(editor, group) {
        super(editor, []);

        this.objectUUIDs = [];
        this.groupUUID = group.uuid;
    }

    execute() {
        return super.revert();
    }

    revert() {
        return super.execute();
    }
}

export { GroupCommand, UngroupCommand };