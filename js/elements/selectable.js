import * as THREE from 'three';

class Selectable extends THREE.Group {
    constructor(editor) {
        super();
        this.editor = editor;
        this._selected = false;
    }

    get selected() {
        return this._selected;
    }

    set selected(b) {
        // If object is already selected or deselected, don't do anything
        if (this._selected === b) return;

        if (b) {
            // Update selection
            if (this.editor.controls.shiftDown){
                for (let object of this.editor.find('selected')) {
                    if (!(object.parent === this.parent)) return;
                }
                this.editor.control.detach();
                this.editor.gui.properties.hide();
                this.editor.gui.transforms.hide();
            } else {
                for (let object of this.editor.find('selected')) {
                    object.selected = false;
                }
                this.editor.control.attach(this);
                this.editor.gui.properties.show();
                this.editor.gui.transforms.show();
            }
            // Creating bounding box
            let color = (this.isCollection) ? 0x00ff00 : 0xffff00;
            let parent = this.parent;
            if (parent) parent.remove(this);
            let matrix = this.matrix.clone();
            new THREE.Matrix4().decompose(this.position, this.quaternion, this.scale);
            let box = new THREE.BoxHelper(this, color);
            matrix.decompose(this.position, this.quaternion, this.scale);
            this.updateMatrix();
            if (parent) parent.add(this);
            box.isBoundingBox = true;
            this.add(box);

            

        } else {
            this.editor.control.detach();
            let boxes = this.getObjectsByProperty('isBoundingBox', true);
            for (let box of boxes) {
                this.remove(box);
            }
        }
        this._selected = b;
        this.editor.update();
        return this._selected;
    }
};

export { Selectable };