import * as THREE from 'three';

import { Selectable } from './selectable';

import { intersectDictionaries, mergeDictionaries } from '../utils';

const assetsPath = '1.20/assets/minecraft/';

class BlockDisplay extends Selectable {
    static loadedModels = {}

    constructor(editor) {
        super(editor);
        this.isBlockDisplay = true;
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

            const response = await fetch(assetsPath + 'blockstates/' + name + '.json');
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
                    modelId = model.split('/')[1];
                    x = x ? x : 0;
                    y = y ? y : 0;
                    z = z ? z : 0;
                    rotation = [x, y, z];

                } else {
                    let { model, x, y, z } = json.variants[best_match];
                    modelId = model.split('/')[1];
                    x = x ? x : 0;
                    y = y ? y : 0;
                    z = z ? z : 0;
                    rotation = [x, y, z];
                }


                correctedVariant = parseVariantString(best_match);
                blockModelGroup = await loadModel(modelId);
                blockModelGroup = rotateBlockModelGroup(blockModelGroup, rotation);

            } else if ('multipart' in json) {
                const models = [];
                for (let i = 0; i < json.multipart.length; i++) {
                    const part = json.multipart[i];
                    if ('when' in part) {
                        let d2 = {};
                        if ('AND' in part.when) { 
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
                                this._possibleVariants[key].push(d2[key]);
                            }
                        }

                        if (Object.keys(intersection).length) {
                            if (Array.isArray(part.apply)) {
                                models.push(part.apply[0]);
                            } else {
                                models.push(part.apply);
                            }
                            correctedVariant = mergeDictionaries(correctedVariant, intersection);
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
                    let modelId = model.split('/')[1];
                    x = x ? x : 0;
                    y = y ? y : 0;
                    z = z ? z : 0;
                    let rotation = [x, y, z];
                    let blockModelPartGroup = await loadModel(modelId);
                    blockModelPartGroup = rotateBlockModelGroup(blockModelPartGroup, rotation);
                    blockModelGroup.add(blockModelPartGroup);
                }
            } else {
                throw 'Couldn\'t parse .json for "' + name + '"!'
            }

            this._blockState = { name: name, variant: correctedVariant }
            blockModelGroup.isBlockModel = true;

            BlockDisplay.loadedModels[blockStateString] = {
                model: blockModelGroup,
                possibleVariants: this._possibleVariants,

            };


            
        }
        // Remove previously loaded model
        let prevModelGroups = this.getObjectsByProperty('isBlockModel', true);
        if (prevModelGroups) { 
            for (let prevModelGroup of prevModelGroups){
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


function parseStateString(blockState) {
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

function parseVariantString(variantString) {
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

async function loadModel(modelPath, isFirstRecursionLevel = true) {
    const response = await fetch(assetsPath + 'models/block/' + modelPath + '.json');
    const modelJson = await response.json();

    if (modelJson.parent) {
        const parentModelJson = await loadModel(modelJson.parent.split('/').slice(-1), false);
        modelJson.textures = { ...parentModelJson.textures, ...modelJson.textures };
        modelJson.elements = modelJson.elements || parentModelJson.elements;
    }

    if (!isFirstRecursionLevel) {
        return modelJson;
    }


    var blockModelGroup = new THREE.Group();
    const textureLoader = new THREE.TextureLoader();

    for (const element of modelJson.elements) {
        const { from, to, faces } = element;
        const from_vec = new THREE.Vector3(...from).divideScalar(16);
        const to_vec = new THREE.Vector3(...to).divideScalar(16);
        const center_vec = new THREE.Vector3(0, 0, 0).add(from_vec).add(to_vec).divideScalar(2);
        const size_vec = new THREE.Vector3(0, 0, 0).add(center_vec).sub(from_vec).multiplyScalar(2);
        const [sx, sy, sz] = size_vec.toArray();

        // Creating a box
        const box = new THREE.BoxGeometry(sx, sy, sz);

        // Setting UVs
        let UVs = new Float32Array(48).fill(0);
        for (const [faceName, face] of Object.entries(faces)) {
            let { uv, rotation } = face;

            // Set UVs from cuboid automatically if no UV is specified
            if (!uv) {
                switch (faceName) {
                    case 'down':
                        uv = [from[0], from[2], to[0], to[2]];
                        break;
                    case 'up':
                        uv = [from[0], from[2], to[0], to[2]];
                        break;
                    case 'north':
                        uv = [from[0], from[1], to[0], to[1]];
                        break;
                    case 'south':
                        uv = [from[0], from[1], to[0], to[1]];
                        break;
                    case 'east':
                        uv = [from[2], from[1], to[2], to[1]];
                        break;
                    case 'west':
                        uv = [from[2], from[1], to[2], to[1]];
                        break;
                }
            } else {
                uv = [uv[0], 16 - uv[3], uv[2], 16 - uv[1]];
            }

            let [uvFrom, uvTo] = [
                [uv[0] / 16, uv[1] / 16],
                [uv[2] / 16, uv[3] / 16]
            ];

            const vertexUV0 = [uvFrom[0], uvTo[1]];
            const vertexUV1 = [uvTo[0], uvTo[1]];
            const vertexUV2 = [uvFrom[0], uvFrom[1]];
            const vertexUV3 = [uvTo[0], uvFrom[1]];

            let vertexUVs = vertexUV0.concat(vertexUV1, vertexUV2, vertexUV3);
            switch (rotation) {
                case 270:
                    vertexUVs = vertexUV1.concat(vertexUV3, vertexUV0, vertexUV2);
                    break;
                case 180:
                    vertexUVs = vertexUV3.concat(vertexUV2, vertexUV1, vertexUV0);
                    break;
                case 90:
                    vertexUVs = vertexUV2.concat(vertexUV0, vertexUV3, vertexUV1);
                    break;

            }

            const offset = getVertexIndicesForFace(faceName)[0] * 2;
            for (const [index, value] of vertexUVs.entries()) {
                UVs[offset + index] = value;
            }
        }
        UVs = new THREE.BufferAttribute(UVs, 2);
        box.setAttribute('uv', UVs);

        // Loading and setting textures
        let materials = Array(6).fill(new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.0, alphaTest: 0.01 }));
        for (const [faceName, face] of Object.entries(faces)) {
            let { texture } = face;
            let textureId = texture;
            while (textureId[0] == '#') {
                textureId = modelJson.textures[textureId.replace('#', '')];
            }
            let texturePath = textureId.replace('minecraft:', '').replace('block/', '');
            //texturePath = 'debug2';
            texturePath = assetsPath + 'textures/block/' + texturePath + '.png';
            const textureFile = await textureLoader.loadAsync(texturePath);
            textureFile.magFilter = THREE.NearestFilter;
            const material = new THREE.MeshStandardMaterial({
                map: textureFile,
                transparent: true,


            });
            material.alphaTest = 0.01;
            const materialIndex = getVertexIndicesForFace(faceName)[0] / 4;
            materials[materialIndex] = material;
        }

        let mesh = new THREE.Mesh(box, materials);
        mesh.material.wireframe = false;

        // Setting it's position
        mesh.position.set(...(center_vec.toArray()));

        // Setting it's rotation
        let rotationGroup = new THREE.Group();
        if ('rotation' in element) {
            let origin_vec = new THREE.Vector3(0, 0, 0);
            if ('origin' in element.rotation) {
                origin_vec = new THREE.Vector3(...(element.rotation.origin)).divideScalar(16);
                rotationGroup.position.set(...(origin_vec.toArray()));
            }
            switch (element.rotation.axis) {
                case 'x':
                    mesh.rotateX(THREE.MathUtils.degToRad(180));
                    break;

                case 'y':
                    mesh.rotateY(THREE.MathUtils.degToRad(180));
                    break;

                case 'z':
                    mesh.rotateZ(THREE.MathUtils.degToRad(180));
                    break;
            }
            const meshPos = new THREE.Vector3(0, 0, 0).add(origin_vec).sub(center_vec);
            mesh.position.set(...(meshPos.toArray()));
            rotationGroup.add(mesh);
            const angle = THREE.MathUtils.degToRad(element.rotation.angle + 180);
            switch (element.rotation.axis) {
                case 'x':
                    
                    rotationGroup.rotateX(angle);
                    break;

                case 'y':
                    rotationGroup.rotateY(angle);
                    break;

                case 'z':
                    
                    rotationGroup.rotateZ(angle);
                    break;
            }
        } else {
            rotationGroup.add(mesh);
        }

        blockModelGroup.add(rotationGroup);


    }

    return blockModelGroup;
}

function getVertexIndicesForFace(faceName) {
    switch (faceName) {
        case 'down':
            return [12, 13, 14, 15];
        case 'up':
            return [8, 9, 10, 11];
        case 'south':
            return [16, 17, 18, 19];
        case 'east':
            return [0, 1, 2, 3];
        case 'north':
            return [20, 21, 22, 23];
        case 'west':
            return [4, 5, 6, 7];
    }
}

function rotateBlockModelGroup(blockModelGroup, rotation = [0, 0, 0]) {
    let newBlockModelGroup = new THREE.Group();
    let rotationGroup = new THREE.Group();

    let origin_vec = new THREE.Vector3(-0.5, -0.5, -0.5);

    //    switch (element.rotation.axis) {
    //        case 'x':
    //            mesh.rotateX(THREE.MathUtils.degToRad(180));
    //            break;
    //
    //        case 'y':
    //            mesh.rotateY(THREE.MathUtils.degToRad(180));
    //            break;
    //
    //        case 'z':
    //            mesh.rotateZ(THREE.MathUtils.degToRad(180));
    //            break;
    //    }
    const meshPos = new THREE.Vector3(0, 0, 0).add(origin_vec);
    blockModelGroup.position.set(...(meshPos.toArray()));
    rotationGroup.add(blockModelGroup);

    rotationGroup.rotateX(THREE.MathUtils.degToRad(rotation[0] - 180));
    rotationGroup.rotateY(THREE.MathUtils.degToRad(rotation[1] - 180));
    rotationGroup.rotateZ(THREE.MathUtils.degToRad(rotation[2] - 180));

    rotationGroup.position.set(...(origin_vec.multiplyScalar(-1).toArray()));


    newBlockModelGroup.add(rotationGroup);
    return newBlockModelGroup;
}

function blockStateToString(blockState) {
    if (Object.keys(blockState.variant).length === 0) {
        return blockState.name;
    } else {
        return blockState.name + JSON.stringify(blockState.variant).replace('{', '[').replace('}', ']').replaceAll('\"', '').replaceAll(':', '=');
    }
}

export { BlockDisplay, assetsPath, parseStateString };