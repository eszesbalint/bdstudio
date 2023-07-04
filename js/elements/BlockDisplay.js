import * as THREE from 'three';

import { Selectable } from './selectable';
import { BlockstateResourcePath, ModelResourcePath } from './path';
import { loadModel } from './modelLoader';  

import { intersectDictionaries, mergeDictionaries } from '../utils';

const assetsPath = '1.20/assets/minecraft/';
const placeholderAssetsPath = 'placeholder/assets/minecraft/';




class BlockDisplay extends Selectable {
    static loadedModels = {}

    constructor(editor) {
        super(editor);
        this.isBlockDisplay = true;
        this.isDisplay = true;
        this._blockState = { name: '', variant: {} };
        this._possibleVariants = {};
        this.nbt = '';
    }

    async updateModel() {
        let blockStateString = blockStateToString(this.blockState);
        if (BlockDisplay.loadedModels[blockStateString]) {
            let { model, possibleVariants } = BlockDisplay.loadedModels[blockStateString];
            var blockModelGroup = model.clone();
            blockModelGroup.isBlockModel = true;
            this._possibleVariants = possibleVariants;
            var correctedVariant = {};
        } else {
            const { name, variant } = this.blockState;
            var blockModelGroup;
            var correctedVariant = {}; // Best fitting variant from the blockstate.json
            this._possibleVariants = {};

            const response = await fetch(new BlockstateResourcePath(name).toPath());

            const json = await response.json();

            if ('variants' in json) {
                let max_matches = 0;
                let best_match = Object.keys(json.variants)[0];
                for (let v in json.variants) {
                    const d2 = parseVariantString(v);
                    for (let key of Object.keys(d2)) {
                        if (key in this._possibleVariants) {
                            if (!this._possibleVariants[key].includes(d2[key])) {
                                this._possibleVariants[key].push(d2[key]);
                            }
                        } else {
                            this._possibleVariants[key] = [undefined];
                            if (d2[key] === 'true') {
                                this._possibleVariants[key].push('false');
                            } else if (d2[key] === 'false'){
                                this._possibleVariants[key].push('true');
                            }
                            this._possibleVariants[key].push(d2[key]);
                        }
                    }
                    const intersection = intersectDictionaries(variant, d2);
                    const len = Object.keys(intersection).length
                    if (len > max_matches) {
                        max_matches = len;
                        best_match = v;
                    }
                }
                let modelId, rotation;
                if (Array.isArray(json.variants[best_match])) {
                    let { model, x, y, z } = json.variants[best_match][0];
                    modelId = model;
                    x = x ? x : 0;
                    y = y ? y : 0;
                    z = z ? z : 0;
                    rotation = { 'x': x, 'y': y, 'z': z };

                } else {
                    let { model, x, y, z } = json.variants[best_match];
                    modelId = model;
                    x = x ? x : 0;
                    y = y ? y : 0;
                    z = z ? z : 0;
                    rotation = { 'x': x, 'y': y, 'z': z };
                }


                correctedVariant = parseVariantString(best_match);
                try {
                    blockModelGroup = await loadModel(new ModelResourcePath(modelId));
                } catch (error) {
                    console.log(error);
                    blockModelGroup = await loadModel(new ModelResourcePath('placeholder:block/placeholder'));
                }

                for (let axis of Object.keys(rotation)) {
                    blockModelGroup = rotateBlockModelGroup(blockModelGroup, axis, rotation[axis]);
                }


            } else if ('multipart' in json) {
                const models = [];
                for (let i = 0; i < json.multipart.length; i++) {
                    const part = json.multipart[i];
                    if ('when' in part) {
                        let d2 = {};
                        if (part.when['AND'] || part.when['AND']) {
                            for (let condition of part.when['AND']) {
                                d2 = mergeDictionaries(condition, d2);
                            }
                        } else {
                            d2 = part.when;
                        }
                        const intersection = intersectDictionaries(variant, d2);
                        for (let key of Object.keys(d2)) {
                            if (key in this._possibleVariants) {
                                if (!this._possibleVariants[key].includes(d2[key])) {
                                    this._possibleVariants[key].push(d2[key]);
                                }
                            } else {
                                this._possibleVariants[key] = [undefined];
                                if (d2[key] === 'true') {
                                    this._possibleVariants[key].push('false');
                                } else if (d2[key] === 'false'){
                                    this._possibleVariants[key].push('true');
                                }
                                this._possibleVariants[key].push(d2[key]);
                            }
                        }

                        if (Object.keys(intersection).length) {
                            if (
                                (!part.when['AND'])
                                ||(part.when['AND'] && Object.keys(intersection).length === Object.keys(part.when['AND']).length)
                                ) {
                                if (Array.isArray(part.apply)) {
                                    models.push(part.apply[0]);
                                } else {
                                    models.push(part.apply);
                                }
                                correctedVariant = mergeDictionaries(correctedVariant, intersection);
                            }
                        }
                    } else {
                        if (Array.isArray(part.apply)) {
                            models.push(part.apply[0]);
                        } else {
                            models.push(part.apply);
                        }
                        models.push(part.apply);
                    }
                }

                blockModelGroup = new THREE.Group();
                for (let modelPart of models) {
                    let { model, x, y, z } = modelPart;
                    let modelId = model;
                    x = x ? x : 0;
                    y = y ? y : 0;
                    z = z ? z : 0;
                    let rotation = { 'x': x, 'y': y, 'z': z };
                    let blockModelPartGroup;
                    try {
                        blockModelPartGroup = await loadModel(new ModelResourcePath(modelId));
                    } catch (error) {
                        console.log(error);
                        blockModelPartGroup = await loadModel(new ModelResourcePath('placeholder:block/placeholder'));
                    }
                    for (let axis of Object.keys(rotation)) {
                        blockModelPartGroup = rotateBlockModelGroup(blockModelPartGroup, axis, rotation[axis]);
                    }

                    blockModelGroup.add(blockModelPartGroup);
                }
            } else {
                throw 'Couldn\'t parse .json for "' + name + '"!'
            }



            this._blockState = { name: name, variant: correctedVariant }
            blockModelGroup.isBlockModel = true;

            blockStateString = blockStateToString(this.blockState);
            BlockDisplay.loadedModels[blockStateString] = {
                model: blockModelGroup,
                possibleVariants: this._possibleVariants,

            };



        }
        // Remove previously loaded model
        let prevModelGroups = this.getObjectsByProperty('isBlockModel', true);
        if (prevModelGroups) {
            for (let prevModelGroup of prevModelGroups) {
                prevModelGroup.parent.remove(prevModelGroup);
            }

        }

        // Add new model
        this.add(blockModelGroup);

        // Rename this object
        this.name = blockStateToString(this._blockState);

        // Update active selection
        if (this.selected) {
            this.selected = !this.selected;
            this.selected = !this.selected;
        }

        this.editor.update();

        return this._blockState;
    }

    get blockState() { return this._blockState }

    set blockState(a) {
        if (typeof a === 'string' || a instanceof String) {
            this._blockState = parseStateString(a);
        } else {
            this._blockState = a;
        }

        // Rename this object
        this.name = blockStateToString(this._blockState);
        this.updateModel();
        return this._blockState;
    }

    toDict(keepUUID = false) {
        let dict = {
            isBlockDisplay: true,
            name: this.name,
            nbt: this.nbt,
            transforms: this.matrix.clone().transpose().toArray(),
        };
        if (keepUUID) dict.uuid = this.uuid;
        return dict;
    }

    static async fromDict(editor, dict, keepUUID = false) {
        let { name, transforms, nbt, children, uuid } = dict;
        let newObject = new BlockDisplay(editor);
        newObject.blockState = name;
        newObject.nbt = nbt;
        if (keepUUID) newObject.uuid = uuid;
        await newObject.updateModel();

        let matrix = new THREE.Matrix4();
        matrix.set(...transforms);
        newObject.applyMatrix4(matrix);
        return newObject;
    }

    toNBT() {
        const { name, variant } = this.blockState;

        // Properties tag
        let properties = '';
        for (let key of Object.keys(variant)) {
            properties += `${key}:"${variant[key]}",`
        }
        properties = properties.slice(0, -1);

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

        let nbtString = `{id:"minecraft:block_display",block_state:{Name:"minecraft:${name}",Properties:{${properties}}},transformation:${transformation}${nbt}}`;

        return nbtString;
    }
}


export function parseStateString(blockState) {
    // Block state should be in the format
    // "name" or
    // "minecraft:name" or
    // "name[param1=val1,param2=val2...paramn=valn]"
    // "minecraft:name[param1=val1,param2=val2...paramn=valn]"
    const blockStatePattern = /^((minecraft:)?[a-z_]+(\[([A-Za-z0-9_]+=[A-Za-z0-9_]+,)*[A-Za-z0-9_]+=[A-Za-z0-9_]+\])?)$/;
    if (!blockStatePattern.test(blockState)) {
        throw 'Couldn\'t parse block state. Block state "' + blockState + '" is not in a valid format.';
    }
    const variantPattern = /\[([A-Za-z0-9_]+=[A-Za-z0-9_]+,)*[A-Za-z0-9_]+=[A-Za-z0-9_]+\]/;
    const name = blockState.replace('minecraft:', '').replace(variantPattern, '');

    var variant = {};
    if (blockState.includes('[')) {
        let variantString = blockState.split('[')[1].replace(']', '');
        variant = parseVariantString(variantString);
    }

    return { name, variant };
}

export function parseVariantString(variantString) {
    const variantPattern = /^(([A-Za-z0-9_]+=[A-Za-z0-9_]+,)*([A-Za-z0-9_]+=[A-Za-z0-9_]+)*)$/;
    if (!variantPattern.test(variantString)) {
        throw 'Couldn\'t parse block variant. variant "' + variantString + '" is not in a valid format.';
    }
    var variant = {};
    if (variantString === "") {
        return variant;
    }
    let variantStrings = variantString.split(',');
    for (let str of variantStrings) {
        let key = str.split("=")[0];
        let val = str.split("=")[1];
        variant[key] = val;
    }
    return variant;
}





function rotateBlockModelGroup(blockModelGroup, axis, deg) {
    let newBlockModelGroup = new THREE.Group();
    let rotationGroup = new THREE.Group();
    let origin_vec = new THREE.Vector3(-0.5, -0.5, -0.5);
    const meshPos = new THREE.Vector3(0, 0, 0).add(origin_vec);
    blockModelGroup.position.set(...(meshPos.toArray()));
    rotationGroup.add(blockModelGroup);

    let rad = THREE.MathUtils.degToRad(deg - 180);
    switch (axis) {
        case 'x':
            rotationGroup.rotateX(rad);
            break;

        case 'y':
            rotationGroup.rotateY(rad);
            break;

        case 'z':
            rotationGroup.rotateZ(rad);
            break;
    }


    rotationGroup.position.set(...(origin_vec.multiplyScalar(-1).toArray()));
    newBlockModelGroup.add(rotationGroup);
    return newBlockModelGroup;
}

export function blockStateToString(blockState) {
    if (Object.keys(blockState.variant).length === 0) {
        return blockState.name;
    } else {
        return blockState.name + JSON.stringify(blockState.variant).replace('{', '[').replace('}', ']').replaceAll('\"', '').replaceAll(':', '=');
    }
}



export { BlockDisplay, assetsPath };