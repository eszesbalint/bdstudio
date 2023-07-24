import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

import { Selectable } from './selectable';
import { BlockstateResourcePath, ModelResourcePath, TextureResourcePath } from './path';

import { intersectDictionaries, mergeDictionaries } from '../utils';


async function loadModel(modelPath, display = 'none', isFirstRecursionLevel = true) {

    const response = await fetch(modelPath.toPath());
    let modelJson = await response.json();

    if (modelJson.parent) {
        let parentModelResourcePath = new ModelResourcePath(modelJson.parent);
        let parentModelJson;
        if (parentModelResourcePath.path === 'builtin/generated') {
            console.log(modelJson);
            parentModelJson = { textures: {}, elements: [{ generated: true }] };
        } else {
            parentModelResourcePath.namespace = modelPath.namespace;
            parentModelJson = await loadModel(parentModelResourcePath, display, false);
        }

        modelJson.textures = { ...parentModelJson.textures, ...modelJson.textures };
        modelJson.display = { ...parentModelJson.display, ...modelJson.display };
        modelJson.elements = modelJson.elements || parentModelJson.elements;
    }

    if (!isFirstRecursionLevel) {
        return modelJson;
    }

    if (modelJson.elements[0].generated) {
        modelJson.elements.splice(0, 1);
        let parentModelJson = await generateItemModel(new TextureResourcePath(modelJson.textures['layer0']));
        modelJson.textures = { ...parentModelJson.textures, ...modelJson.textures };
        modelJson.elements = modelJson.elements && parentModelJson.elements;
    }


    var blockModelGroup = new THREE.Group();
    const textureLoader = new THREE.TextureLoader();

    let geometries = [];
    let materials = [];
    let groups = [];
    let c = 0;
    for (const element of modelJson.elements) {
        const { from, to, faces } = element;
        const from_vec = new THREE.Vector3(...from).divideScalar(16);
        const to_vec = new THREE.Vector3(...to).divideScalar(16);
        const center_vec = new THREE.Vector3().addVectors(from_vec, to_vec).divideScalar(2);
        const size_vec = new THREE.Vector3(0, 0, 0).add(center_vec).sub(from_vec).multiplyScalar(2);
        const [sx, sy, sz] = size_vec.toArray();

        // Creating a box from planes


        let planes = [];
        let d = 0;
        let box_groups = [];
        let box_materials = [];
        for (const [faceName, face] of Object.entries(faces)) {
            let width, height, pos, rot;
            const deg90 = THREE.MathUtils.degToRad(90);
            switch (faceName) {
                case 'down':
                    width = sx;
                    height = sz;
                    rot = [deg90, 0, 0];
                    pos = [0, -sy / 2, 0];
                    break;

                case 'up':
                    width = sx;
                    height = sz;
                    rot = [-deg90, 0, 0];
                    pos = [0, sy / 2, 0];
                    break;

                case 'south':
                    width = sx;
                    height = sy;
                    rot = [0, 0, 0];
                    pos = [0, 0, sz / 2];
                    break;

                case 'north':
                    width = sx;
                    height = sy;
                    rot = [0, 2 * deg90, 0];
                    pos = [0, 0, -sz / 2];
                    break;

                case 'east':
                    width = sz;
                    height = sy;
                    rot = [0, deg90, 0];
                    pos = [sx / 2, 0, 0];
                    break;

                case 'west':
                    width = sz;
                    height = sy;
                    rot = [0, -deg90, 0];
                    pos = [-sx / 2, 0, 0];
                    break;

            }
            let plane = new THREE.PlaneGeometry(width, height);
            plane.rotateX(rot[0]);
            plane.rotateY(rot[1]);
            plane.rotateZ(rot[2]);
            plane.translate(...pos);



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

            let UVs = new Float32Array(8).fill(0);
            const offset = 0;
            for (const [index, value] of vertexUVs.entries()) {
                UVs[offset + index] = value;
            }

            UVs = new THREE.BufferAttribute(UVs, 2);
            plane.setAttribute('uv', UVs);



            // Loading and setting textures
            let plane_material = new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.0, alphaTest: 0.01 });

            let { texture } = face;
            let textureId = texture;
            while (textureId[0] == '#') {
                textureId = modelJson.textures[textureId.replace('#', '')];
            }

            let textureResourcePath = new TextureResourcePath(textureId);
            textureResourcePath.namespace = modelPath.namespace;

            // Crop the texture to the first 16x16 pixels
            const textureImage = new Image();
            textureImage.src = textureResourcePath.toPath();
            await new Promise((resolve) => {
                textureImage.onload = resolve;
            });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 16;
            canvas.height = 16;

            context.drawImage(
                textureImage,
                0,
                0,
                16,
                16,
                0,
                0,
                16,
                16
            );

            const croppedTexturePath = canvas.toDataURL();

            const textureFile = await textureLoader.loadAsync(croppedTexturePath);
            textureFile.magFilter = THREE.NearestFilter;
            const material = new THREE.MeshStandardMaterial({
                map: textureFile,
                transparent: true,
            });
            //const material = new THREE.MeshStandardMaterial({
            //    wireframe: true,
            //});
            material.alphaTest = 0.01;

            box_materials.push(material);

            box_groups.push({
                "start": groups.length * 6 + d * 6,
                "count": 6,
                "materialIndex": groups.length + d
            });

            planes.push(plane);

            d++;
        }

        let box = BufferGeometryUtils.mergeGeometries(planes);

        // Setting it's position
        box.translate(...(center_vec.toArray()));





        // Setting it's rotation
        //let rotationGroup = new THREE.Group();
        if ('rotation' in element) {
            let origin_vec = new THREE.Vector3(0, 0, 0);
            if ('origin' in element.rotation) {
                origin_vec = new THREE.Vector3(...(element.rotation.origin)).divideScalar(16);
                //rotationGroup.position.set(...(origin_vec.toArray()));
            }
            const meshPos = new THREE.Vector3().subVectors(center_vec, origin_vec);
            box.translate(...(new THREE.Vector3().add(origin_vec).multiplyScalar(-1).toArray()));

            const angle = THREE.MathUtils.degToRad(element.rotation.angle);

            let sX = 1;
            let sY = 1;
            let sZ = 1;
            let sF = Math.max(Math.abs(Math.cos(angle)), Math.abs(Math.sin(angle)));

            switch (element.rotation.axis) {
                case 'x':
                    if (element.rotation.rescale) {
                        box.scale(sX, sY / sF, sZ / sF);
                    }
                    box.rotateX(angle);
                    break;

                case 'y':
                    if (element.rotation.rescale) {
                        box.scale(sX / sF, sY, sZ / sF);
                    }
                    box.rotateY(angle);
                    break;

                case 'z':
                    if (element.rotation.rescale) {
                        box.scale(sX / sF, sY / sF, sZ);
                    }
                    box.rotateZ(angle);
                    break;
            }

            box.translate(...(origin_vec.toArray()));

        } else {
            //rotationGroup.add(mesh);
        }


        geometries.push(BufferGeometryUtils.mergeVertices(box));
        //geometries.push(box);
        materials = Array.prototype.concat(materials, box_materials);
        groups = Array.prototype.concat(groups, box_groups);
        c++;
    }

    let geometry = BufferGeometryUtils.mergeGeometries(geometries);

    for (let group of groups) {
        let { start, count, materialIndex } = group;
        geometry.addGroup(start, count, materialIndex);
    }
    let mesh = new THREE.Mesh(geometry, materials);

    if (modelJson.display) {
        let transforms = modelJson.display[display];
        if (transforms) {
            if (transforms.rotation) {
                
                let [x, y, z] = transforms.rotation;
                x = THREE.MathUtils.degToRad(x);
                y = THREE.MathUtils.degToRad(y);
                z = THREE.MathUtils.degToRad(z);
                
                
                mesh.rotateY(y);
                mesh.rotateX(-x);
                mesh.rotateZ(-z);
                
            }
            if (transforms.translation) {
                let [x, y, z] = transforms.translation;
                mesh.geometry.translate(x / 16, y / 16, z / 16);
                //mesh.geometry.translateX(x / 16);
                //mesh.geometry.translateY(y / 16);
                //mesh.geometry.translateZ(z / 16);
            }
            if (transforms.scale) {
                let [x, y, z] = transforms.scale;
                mesh.scale.set(x, y, z);
            }
        }
    }

    blockModelGroup.add(mesh);

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

async function generateItemModel(textureResourcePath) {
    let modelJson = {
        elements: [
            {
                from: [-8, -8, -0.5],
                to: [8, 8, 0.5],
                faces: {
                    south: { uv: [16, 0, 0, 16], texture: "#layer0" },
                    north: { uv: [0, 0, 16, 16], texture: "#layer0" },
                }
            }
        ]
    }
    // Crop the texture to the first 16x16 pixels
    const textureImage = new Image();
    textureImage.src = textureResourcePath.toPath();
    await new Promise((resolve) => {
        textureImage.onload = resolve;
    });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 16;
    canvas.height = 16;

    context.translate(canvas.width, 0);
    context.scale(-1, 1);

    context.drawImage(
        textureImage,
        0,
        0,
        16,
        16,
        0,
        0,
        16,
        16
    );

    let width = 16;
    let height = 16;

    let testNeighbour = function (x, y) {
        if (x === width || x < 0) return true;
        if (y === height || y < 0) return true;
        let a = !context.getImageData(x, y, 1, 1).data[3];
        if (a) return true;
    }

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let a = !context.getImageData(x, y, 1, 1).data[3];
            // If empty pixel, skip
            if (a) continue;

            let neighbours = {
                up: [x, y - 1],
                down: [x, y + 1],
                east: [x + 1, y],
                west: [x - 1, y]
            }

            let element = {
                from: [x - 8, 16 - (y + 1) - 8, -0.5],
                to: [(x + 1) - 8, 16 - y - 8, 0.5],
                faces: {

                }
            }
            let atleastOne = false;
            for (let [faceName, direction] of Object.entries(neighbours)) {
                let b = testNeighbour(...direction);
                if (b) {
                    atleastOne = true;
                    element.faces[faceName] = { uv: [15-x, y, 15-x + 1, y + 1], texture: "#layer0" };
                }
            }
            if (atleastOne) {
                modelJson.elements.push(element);
            }

        }
    }



    return modelJson;

}

generateItemModel(new TextureResourcePath('item/diamond_sword'));

export { loadModel };