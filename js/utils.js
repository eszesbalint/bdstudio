import { parseStateString } from './elements/blockDisplay.js';

function minecraftSummonCommandFromObjects(objects) {
    let command = '/summon block_display ~-0.5 ~-0.5 ~-0.5 {Passengers:[';
    let passengers = '';
    for (let object of objects.getObjectsByProperty('isBlockDisplay', true)) {
        passengers += '{id:\"minecraft:block_display\",';
        passengers += 'block_state:'
        const { name, variant } = parseStateString(object.name);
        passengers += '{Name:\"' + name + '\"';
        if (Object.keys(variant).length === 0) {

        } else {
            passengers += ',Properties:{';
            for (let property of Object.keys(variant)) {
                passengers += property + ':\"' + variant[property] + '\",';
            }
            passengers = passengers.slice(0, -1);
            passengers += '}';
        }
        passengers += '},';
        passengers += 'transformation:'
        let matrix = object.matrixWorld.clone();
        let array = matrix.transpose().toArray();
        //array.forEach(function(part, index, theArray) {
        //    theArray[index] = theArray[index].toFixed(4);
        //  });
        passengers += JSON.stringify(array).replaceAll(',', 'f,').replace(']', 'f]')
        passengers += '},'
    }
    command += passengers.slice(0, -1);
    command += ']}';
    return command;
}





async function compressJSON(string) {
    // Convert JSON to Stream
    const stream = new Blob([string], {
        type: 'application/json',
    }).stream();
    // gzip stream
    const compressedReadableStream = stream.pipeThrough(
        new CompressionStream("gzip")
    );
    // create Response
    const compressedResponse = await new Response(compressedReadableStream);

    // Get response Blob
    const blob = await compressedResponse.blob();
    // Get the ArrayBuffer
    const buffer = await blob.arrayBuffer();

    // convert ArrayBuffer to base64 encoded string
    const compressedBase64 = btoa(
        String.fromCharCode(
            ...new Uint8Array(buffer)
        )
    );

    return compressedBase64;
}

async function decompressJSON(compressedBase64) {
    // base64 encoding to Blob
    const stream = new Blob([b64decode(compressedBase64)], {
        type: "application/json",
    }).stream();
    const compressedReadableStream = stream.pipeThrough(
        new DecompressionStream("gzip")
    );
    const resp = await new Response(compressedReadableStream);
    const blob = await resp.blob();
    const string = await blob.text()
    return string;
}

function b64decode(str) {
    const binary_string = window.atob(str);
    const len = binary_string.length;
    const bytes = new Uint8Array(new ArrayBuffer(len));
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
}

function printSceneGraph(scene) {
    scene.traverse(function (obj) {

        var s = '|___';

        var obj2 = obj;

        while (obj2 !== scene) {

            s = '\t' + s;

            obj2 = obj2.parent;

        }

        console.log(s + obj.name + ' <' + obj.type + '> ' + obj.uuid);

    });
}

function arrayEquals(a, b) {
    return Array.isArray(a) &&
        Array.isArray(b) &&
        a.length === b.length &&
        a.every((val, index) => val === b[index]);
}

function intersectDictionaries(dict1, dict2) {
    let result = {};
    for (let key in dict1) {
        if (key in dict2 && dict1[key] === dict2[key]) {
            result[key] = dict1[key];
        }
    }
    return result;
}

function mergeDictionaries(dict1, dict2) {
    let result = {};
    for (let key in dict1) {
        result[key] = dict1[key];
    }
    for (let key in dict2) {
        result[key] = dict2[key];
    }
    return result;
}

export { minecraftSummonCommandFromObjects, compressJSON, decompressJSON, b64decode, printSceneGraph, arrayEquals, intersectDictionaries, mergeDictionaries }