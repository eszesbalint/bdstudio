import * as THREE from 'three';

import { Scene } from './scene.js';
import { Controls } from './controls.js';

import { 
    ElementsGUI, 
    TransformsGUI,
    SearchGUI,
    CommandGUI,
    FileToolsGUI,
    ElementToolsGUI,
    TransformToolsGUI
} from './gui/gui.js';

import { loadBlockState } from './loaders/BlockModelLoader.js';
import { selectable } from './selection.js';
import { compressJSON, decompressJSON } from './utils.js';

let renderer, scene, currentCamera;

class Editor {
    scene; renderer; control; orbit;
    cameraPersp; cameraOrtho; currentCamera;
    objects; currentObject;
    clipboard = [];
    gui = {};

    constructor () {
        

        new Scene(this);

        this.objects = new THREE.Group();
        this.scene.add(this.objects);
        this.currentObject = this.objects;

        this.controls = new Controls(this);
        this.gui = {
            elements: new ElementsGUI(this),
            transforms: new TransformsGUI(this),
            search: new SearchGUI(this).close(),
            command: new CommandGUI(this).close(),
            tools: {
                file: new FileToolsGUI(this),
                element: new ElementToolsGUI(this),
                transform: new TransformToolsGUI(this),
            },
        }
        renderer = this.renderer;
        scene = this.scene;
        currentCamera = this.currentCamera;

        this.render();
    }

    render () {
        renderer.render(scene, currentCamera);
    }

    async addBlockDisplay(blockStateString, addToScene = true) {
        let blockModelGroup = await loadBlockState(blockStateString);
    
        const box = new THREE.Box3();
        box.setFromCenterAndSize(new THREE.Vector3(0.5 - 0.001, 0.5 - 0.001, 0.5 - 0.001), new THREE.Vector3(1 + 0.001, 1 + 0.001, 1 + 0.001));
    
    
        blockModelGroup.position.set(0, 0, 0);
        blockModelGroup.isBlockDisplay = true;
    
        Object.defineProperty(blockModelGroup, 'selected', selectable);
    
        if (addToScene) {
            this.objects.add(blockModelGroup);
    
        }
    
        return blockModelGroup;
    }

    groupBlockDisplays(objectList, name = 'Group', addToScene = true) {
        let group = new THREE.Group();
        group.name = name;
        group.isCollection = true;
        for (let object of objectList) {
            if (addToScene) { this.objects.remove(object) };
            group.add(object);
            object.selected = false;
        }
        let box = new THREE.Box3().setFromObject(group);
        for (let object of objectList) {
            object.position.set(...object.position.add(box.min.clone().negate()).toArray());
        }
        group.position.add(box.min);
    
        box = new THREE.BoxHelper(group, 0x00ff00);
        box.isBoundingBox = true;
        box.visible = false;
        group.attach(box);
    
        Object.defineProperty(group, 'selected', selectable);
        group.selected = false;
    
        if (addToScene) {
            this.objects.add(group);
        }
        return group;
    }
    
    unGroupBlockDisplays(group) {
        this.control.detach();
        let objectList = group.getObjectsByProperty('isBlockDisplay', true);
        for (let object of objectList) {
            group.remove(object);
            object.applyMatrix4(group.matrix);
            this.objects.add(object);
            object.selected = true;
        }
        this.objects.remove(group);
        return objectList;
    }
    
    toggleGrouping() {
        let selected = this.objects.getObjectsByProperty('selected', true);
        if (selected.length > 1) {
            for (let object of selected) {
                if (object.isCollection) {
                    return;
                }
            }
            this.groupBlockDisplays(selected).selected = true;
        } else if (this.currentObject.isCollection) {
            this.unGroupBlockDisplays(this.currentObject);
        }
    }
    
    selectBlockDisplay(object) {
        this.control.detach();
        if (!this.controls.shiftDown) {
            let selected = this.objects.getObjectsByProperty('selected', true);
            for (let object of selected) {
                object.selected = false;
            }
        }
    
        if (object) {
            object.selected = true;
            this.currentObject = object;
            if (!this.controls.shiftDown) {
                this.control.attach(object);
                this.gui.transforms.show();
            } else {
                this.gui.transforms.hide();
            }
    
        } else {
            this.currentObject = this.objects;
            this.control.detach();
            this.gui.transforms.hide();
    
        }
    
    }
    
    deleteBlockDisplay(object) {
        let selected = [];
        if (!object) {
            selected = this.objects.getObjectsByProperty('selected', true);
        } else {
            selected = [object];
        }
        for (let object of selected) {
            this.objects.remove(object);
        }
        this.selectBlockDisplay();
    }
    
    async duplicateBlockDisplay(object, addToScene = true) {
        this.control.detach();
        let objectsToDuplicate = [];
        let objectDuplicates = [];
        if (!object) {
            objectsToDuplicate = this.objects.getObjectsByProperty('selected', true);
        } else if (Array.isArray(object)) {
            objectsToDuplicate = object;
        } else {
            objectsToDuplicate.push(object);
        }
        for (let object of objectsToDuplicate) {
            if (object.isBlockDisplay) {
                const newObject = await this.addBlockDisplay(object.name, true);
                newObject.applyMatrix4(object.matrix);
                newObject.updateMatrix();
                this.objects.remove(newObject);
                objectDuplicates.push(newObject);
    
            } else if (object.isCollection) {
                let dupliObjectList = await this.duplicateBlockDisplay(object.children, false);
                const newGroup = this.groupBlockDisplays(dupliObjectList, object.name, false);
                newGroup.applyMatrix4(object.matrix);
                this.objects.remove(newGroup);
                objectDuplicates.push(newGroup);
            }
        }
        if (addToScene) {
            for (let object of objectDuplicates) {
                this.objects.add(object);
            }
        }
    
        return objectDuplicates;
    }

    async saveBlockDisplaysToFile() {
        let compressed = await compressJSON(this.objectsToJSON())
        // Create a programmatic download link
        const elem = window.document.createElement("a");
        elem.href = window.URL.createObjectURL(new Blob([compressed]));
        elem.download = 'block_display_model';
        document.body.appendChild(elem);
        elem.click();
        document.body.removeChild(elem);
    
    
    }
    
    loadBlockDisplaysFromFile() {
        var input = document.createElement('input');
        input.type = 'file';
    
        input.onchange = e => {
    
            // getting a hold of the file reference
            var file = e.target.files[0];
    
            // setting up the reader
            var reader = new FileReader();
            reader.readAsText(file, 'UTF-8');
    
            // here we tell the reader what to do when it's done reading...
            reader.onload = async readerEvent => {
                var content = readerEvent.target.result; // this is the content!
                await this.objectsFromJSON(await decompressJSON(content));
                render();
                updateElementsGUI();
            }
    
        }
    
        input.click();
    }

    objectsToJSON() {
        let list = [];
        for (let object of this.objects.children) {
            if (object.isBlockDisplay) {
                let dict = {
                    name: object.name,
                    transforms: object.matrix.clone().transpose().toArray(),
                };
                list.push(dict);
            } else if (object.isCollection) {
                let groupList = [];
                for (let child of object.getObjectsByProperty('isBlockDisplay', true)) {
                    let dict = {
                        name: child.name,
                        transforms: child.matrix.clone().transpose().toArray(),
                    };
                    groupList.push(dict);
                }
                let dict = {
                    nam: object.name,
                    transforms: object.matrix.clone().transpose().toArray(),
                    children: groupList,
                };
                list.push(dict);
            }
        }
        return JSON.stringify(list);
    }
    
    async objectsFromJSON(string, addToScene = true) {
        const data = JSON.parse(string);
        let newObjects = []
        for (let dict of data) {
            let { name, transforms, children } = dict;
            if (!children) {
                let newObject = await this.addBlockDisplay(name);
                let matrix = new THREE.Matrix4();
                matrix.set(...transforms);
                newObject.applyMatrix4(matrix);
                newObjects.push(newObject);
            } else {
                let objectList = [];
                for (let child of children) {
                    let { name, transforms, children } = child;
                    let newObject = await this.addBlockDisplay(name);
                    let matrix = new THREE.Matrix4();
                    matrix.set(...transforms);
                    newObject.applyMatrix4(matrix);
                    objectList.push(newObject);
                }
    
                const newGroup = this.groupBlockDisplays(objectList, name, false);
                let matrix = new THREE.Matrix4();
                matrix.set(...transforms);
                newGroup.applyMatrix4(matrix);
                newObjects.push(newGroup);
            }
        }
        if (addToScene) {
            for (let object of newObjects) {
                this.objects.add(object);
                object.selected = false;
    
            }
        }
    
        return newObjects;
    }
}

export { Editor };