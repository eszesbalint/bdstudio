import * as THREE from 'three';

let selectable = {
    _selected: false,
    get() {
        return this._selected;
    },
    set(b) {
        this._selected = b;
        if (b) {
            let color = (this.isCollection) ? 0x00ff00 : 0xffff00;
            if (this.isCollection) {
                this.getObjectsByProperty('isBoundingBox', true)[0].visible = true;
            } else if (this.isBlockDisplay) {
                const box = new THREE.Box3();
                box.setFromCenterAndSize(new THREE.Vector3(0.5 - 0.001, 0.5 - 0.001, 0.5 - 0.001), new THREE.Vector3(1 + 0.001, 1 + 0.001, 1 + 0.001));

                const helper = new THREE.Box3Helper(box, color);
                helper.isBoundingBox = true;
                this.add(helper);
            }
        } else {
            if (this.isCollection) {
                this.getObjectsByProperty('isBoundingBox', true)[0].visible = false;
            } else if (this.isBlockDisplay) {
                let boxes = this.getObjectsByProperty('isBoundingBox', true);
                for (let box of boxes) {
                    this.remove(box);
                }
            }

        }
        return this._selected;
    }
};

export { selectable };