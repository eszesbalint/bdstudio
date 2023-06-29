import * as THREE from 'three';

import { Selectable } from './selectable';
import { parseStateString, blockStateToString } from './BlockDisplay';
import { BlockstateResourcePath, ModelResourcePath } from './path';
import { loadModel } from './modelLoader';  

import { intersectDictionaries, mergeDictionaries } from '../utils';



class ItemDisplay extends Selectable {
    static loadedModels = {}

    constructor(editor) {
        super(editor);
        this.isItemDisplay = true;
        this.isDisplay = true;
        this._itemState = { name: '', variant: {'display': 'none'} };
        this._possibleVariants = {'display': ['none','ground','head','thirdperson_righthand','firstperson_righthand','fixed']};
        this.nbt = '';
    }

    async updateModel() {
        if (ItemDisplay.loadedModels[blockStateToString(this.itemState)]) {
            let { model } = ItemDisplay.loadedModels[this.name];
            var itemModelGroup = model.clone();
            itemModelGroup.isItemModel = true;
        } else {
            var itemModelGroup;

            try {
                itemModelGroup = await loadModel(new ModelResourcePath(`minecraft:item/${this.itemState.name}`), this.itemState.variant['display']);
            } catch (error) {
                console.log(error);
                itemModelGroup = await loadModel(new ModelResourcePath('placeholder:block/placeholder'));
            }

            itemModelGroup.isItemModel = true;

            ItemDisplay.loadedModels[blockStateToString(this.itemState)] = {
                model: itemModelGroup,
            };



        }
        // Remove previously loaded model
        let prevModelGroups = this.getObjectsByProperty('isItemModel', true);
        if (prevModelGroups) {
            for (let prevModelGroup of prevModelGroups) {
                prevModelGroup.parent.remove(prevModelGroup);
            }

        }

        // Add new model
        this.add(itemModelGroup);

        // Rename this object
        this.name = blockStateToString(this._itemState);

        // Update active selection
        if (this.selected) {
            this.selected = !this.selected;
            this.selected = !this.selected;
        }

        this.editor.update();
        console.log(ItemDisplay.loadedModels);
        return this._itemState;
    }

    get itemState() { return this._itemState }

    set itemState(a) {
        if (typeof a === 'string' || a instanceof String) {
            this._itemState = parseStateString(a);
        } else {
            this._itemState = a;
        }

        if (!this._itemState.variant['display']){
            this._itemState.variant['display'] = 'none';
        }

        // Rename this object
        this.name = blockStateToString(this._itemState);
        this.updateModel();
        return this._itemState;
    }

    toDict(keepUUID = false) {
        let dict = {
            isItemDisplay: true,
            name: this.name,
            nbt: this.nbt,
            transforms: this.matrix.clone().transpose().toArray(),
        };
        if (keepUUID) dict.uuid = this.uuid;
        return dict;
    }

    static async fromDict(editor, dict, keepUUID = false) {
        let { name, transforms, nbt, children, uuid } = dict;
        let newObject = new ItemDisplay(editor);
        newObject.itemState = name;
        newObject.nbt = nbt;
        if (keepUUID) newObject.uuid = uuid;
        await newObject.updateModel();

        let matrix = new THREE.Matrix4();
        matrix.set(...transforms);
        newObject.applyMatrix4(matrix);
        return newObject;
    }

    toNBT() {
        // Transformations tag
        let matrix = this.matrixWorld.clone();
        let array = matrix.transpose().toArray();
        let arrayTrunc = [];
        for (let x of array) {
            arrayTrunc.push(x.toFixed(4));
        }
        const transformation = JSON.stringify(arrayTrunc).replaceAll('"', '').replaceAll(',', 'f,').replace(']', 'f]');

        // Additional tags, inherited from parent
        let object = this;
        let nbt = '';
        while (object.parent) {
            if (object.nbt) {
                nbt += `,${object.nbt}`;
            }
            object = object.parent;
        }

        let nbtString = `{id:"minecraft:item_display",item:{id:"minecraft:${this.itemState.name}",Count:1},item_display:"${this.itemState.variant['display']}",transformation:${transformation}${nbt}}`;

        return nbtString;
    }
}


export { ItemDisplay };