import * as THREE from 'three';

import { Selectable } from './selectable';





export class TextDisplay extends Selectable {
    static loadedModels = {}

    constructor(editor) {
        super(editor);
        this.isTextDisplay = true;
        this.isDisplay = true;
        this._text = '';
        this._options = {
            color: '#FFFFFF',
            alpha: 1.0,
            backgroundColor: '#000000',
            backgroundAlpha: 1.0,
            bold: false,
            italic: false,
            underline: false,
            strikeThrough: false,
            lineLength: 200 / 4,
            align: 'center'
        };
        this.nbt = '';
    }

    async updateModel() {
        let textModelGroup = createTextMesh(this.text, this.options);
        textModelGroup.isTextModel = true;


        // Remove previously loaded model
        let prevModelGroups = this.getObjectsByProperty('isTextModel', true);
        if (prevModelGroups) {
            for (let prevModelGroup of prevModelGroups) {
                prevModelGroup.parent.remove(prevModelGroup);
            }

        }

        // Add new model
        this.add(textModelGroup);

        // Update active selection
        //if (this.selected) {
        //    this.selected = !this.selected;
        //    this.selected = !this.selected;
        //}

        this.editor.gui.elements.update();
        this.editor.gui.command.update();
        this.editor.render();
        return this._text;
    }

    get text() { return this._text }

    set text(a) {
        this._text = a;
        // Rename this object
        this.name = this._text;
        this.updateModel();
        return this._text;
    }

    get options() { return this._options }

    set options(a) {
        this._options = a;
        this.updateModel();
        return this._options;
    }


    toDict(keepUUID = false) {
        let dict = {
            isTextDisplay: true,
            name: this.name,
            options: this.options,
            nbt: this.nbt,
            transforms: this.matrix.clone().transpose().toArray(),
        };
        if (keepUUID) dict.uuid = this.uuid;
        return dict;
    }

    static async fromDict(editor, dict, keepUUID = false) {
        let { name, options, transforms, nbt, uuid } = dict;
        let newObject = new TextDisplay(editor);
        newObject._text = name;
        newObject.name = name;
        newObject._options = options;
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

        let nbtString = `{id:"minecraft:text_display",text:"{\\"text\\":\\"${this.text}\\",\\"color\\":\\"${this.options.color}\\",\\"bold\\":\\"${this.options.bold}\\",\\"italic\\":\\"${this.options.italic}\\",\\"underlined\\":\\"${this.options.underline}\\",\\"strikethrough\\":\\"${this.options.strikeThrough}\\",\\"font\\":\\"minecraft:uniform\\"}",text_opacity:${hexStringToInteger(alphaToHex(this.options.alpha))},background:${hexStringToSignedInt(alphaToHex(this.options.backgroundAlpha) + this.options.backgroundColor.slice(1))},alignment:"${this.options.align}",line_width:${this.options.lineLength * 4.2},default_background:false,transformation:${transformation}${nbt}}`;

        return nbtString;
    }
}


function splitTextIntoLines(text, length) {
    const words = text.split(/\s+/u);
    const lines = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
        const word = words[i];

        if (currentLine.length + word.length + 1 <= length) {
            // Add word to the current line
            currentLine += (currentLine ? ' ' : '') + word;
        } else {
            // Current line is too long, add it to lines and start a new line with the current word
            lines.push(currentLine);
            currentLine = word;
        }
    }

    // Add the last line to lines array
    if (currentLine.length > 0) {
        lines.push(currentLine);
    }

    return lines;
}

function alphaToHex(alpha) {
    // Ensure alpha is in the valid range (0.0 to 1.0)
    alpha = Math.min(1.0, Math.max(0.0, alpha));

    // Convert alpha to a value between 0 and 255
    const alphaValue = Math.round(alpha * 255);

    // Convert alphaValue to a two-digit hexadecimal representation
    let hexValue = alphaValue.toString(16);

    // Pad the value with a leading zero if it's a single digit
    if (hexValue.length === 1) {
        hexValue = '0' + hexValue;
    }

    return hexValue;
}

function hexStringToInteger(hexString) {
    // Remove the '#' character if present
    if (hexString.startsWith('#')) {
        hexString = hexString.slice(1);
    }

    // Parse the hexadecimal string to an integer with radix 16
    const integerValue = parseInt(hexString, 16);
    return integerValue;
}

function hexStringToSignedInt(hexString) {
    // Remove the '#' character if present
    if (hexString.startsWith('#')) {
        hexString = hexString.slice(1);
    }

    // Parse the hexadecimal string to an unsigned integer with radix 16
    const unsignedValue = parseInt(hexString, 16);

    // Convert the unsigned integer to a signed integer using bitwise operators
    const signedValue = unsignedValue << 0; // Left shift by 0 to ensure the result is signed

    return signedValue;
}

function createTextMesh(text, options) {
    let { align, color, alpha, backgroundColor, backgroundAlpha, underline, strikeThrough } = options;
    let lines = splitTextIntoLines(text, options.lineLength);
    let textModelGroup = new THREE.Group();
    let lineModelGroups = [];
    let offsets = [];
    let maxOffset = 0;
    for (let [j, line] of lines.entries()) {
        let lineModelGroup = new THREE.Group();
        let offset = 0.0;
        for (let i = 0; i < line.length; i++) {
            let char;
            try {
                char = providers.default.getChar(line[i], options);
            } catch (error) {
                char = providers.unifont.getChar(line[i], options);
            }

            let { mesh, width, height, ascent } = char;

            mesh.position.set(offset, ascent, 0); // Position the characters side by side.
            offset += width;
            lineModelGroup.add(mesh);
        }
        if (offset > maxOffset) {
            maxOffset = offset
        }

        // Underline
        if (underline) {
            const geometry = new THREE.PlaneGeometry(offset, 2 * 0.0125);
            const material = new THREE.MeshBasicMaterial({ color: color, side: THREE.FrontSide, transparent: true, opacity: alpha, alphaTest: 0.01 });
            geometry.translate(offset / 2, 3 * 0.0125, 0.001);
            let underlineMesh = new THREE.Mesh(geometry, material);
            lineModelGroup.add(underlineMesh);
        }

        if (strikeThrough) {
            const geometry = new THREE.PlaneGeometry(offset, 2 * 0.0125);
            const material = new THREE.MeshBasicMaterial({ color: color, side: THREE.FrontSide, transparent: true, opacity: alpha, alphaTest: 0.01 });
            geometry.translate(offset / 2, 12 * 0.0125, 0.001);
            let underlineMesh = new THREE.Mesh(geometry, material);
            lineModelGroup.add(underlineMesh);
        }

        offsets.push(offset);
        lineModelGroups.push(lineModelGroup);
        textModelGroup.add(lineModelGroup)
    }
    for (let [j, lineModelGroup] of lineModelGroups.entries()) {
        let lineX, lineY;
        lineY = 0.0125 * 20 * (lines.length - j - 1);
        switch (align) {
            case 'center':
                lineX = -offsets[j] / 2;
                break;

            case 'left':
                lineX = -maxOffset / 2;
                break;

            case 'right':
                lineX = maxOffset / 2 - offsets[j];
                break;

            default:
                break;
        }

        lineModelGroup.position.set(lineX, lineY, 0);
    }
    const geometry = new THREE.PlaneGeometry(maxOffset + 2 * 2 * 0.0125, lines.length * 20 * 0.0125 + 2 * 0.0125);
    const material = new THREE.MeshBasicMaterial({ color: backgroundColor, side: THREE.FrontSide, transparent: true, opacity: backgroundAlpha, alphaTest: 0.01 });
    geometry.translate(0, (lines.length * 20 * 0.0125 + 2 * 0.0125) / 2, -0.001);
    let backgroundMesh = new THREE.Mesh(geometry, material);
    textModelGroup.add(backgroundMesh);
    return textModelGroup;
}

class FontProvider {
    constructor() {

    }

    getChar(character) {

    }

    async loadData() {

    }
}

class Default extends FontProvider {


    getChar(character) {
        throw `Unsupported character ${character}!`;
    }

    async loadData() {

    }
}

class UniFont extends FontProvider {
    constructor() {
        super();

    }

    async loadData() {
        const fileUrl = 'font/unifont/unifont-15.0.06.hex';
        this.fontData = await this.loadUnifontHex(fileUrl);
    }

    getChar(character, options) {
        let { color, alpha, bold, italic } = options;
        const charData = this.fontData.find(data => parseInt(data.codePoint, 16) === character.charCodeAt(0));

        if (!charData) throw `Unsupported UniFont character ${character}!`;

        const binary = this.hexToBinary(charData.bitmap);
        const charSize = this.getCharacterSize(binary);

        const canvas = document.createElement('canvas');
        canvas.width = bold ? charSize.width + 1 : charSize.width;
        canvas.height = charSize.height;
        const context = canvas.getContext('2d');

        for (let row = 0; row < charSize.height; row++) {
            for (let col = 0; col < charSize.width; col++) {
                const bitIndex = col + row * charSize.width;
                const pixelValue = binary[bitIndex];
                const pixelColor = pixelValue === '1' ? color : '#00000000'; // Black for 'on' pixel, white for 'off'.

                context.fillStyle = pixelColor;
                if (bold) {
                    context.fillRect(col, row, 2, 1);
                } else {
                    context.fillRect(col, row, 1, 1);
                }
            }
        }
        charSize.width = bold ? charSize.width + 1 : charSize.width;
        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;

        const geometry = new THREE.PlaneGeometry(charSize.width, charSize.height);
        if (italic) {
            const shearMatrix = new THREE.Matrix4().makeShear(0, 0, 0.4142, 0, 0, 0);
            geometry.applyMatrix4(shearMatrix);
        }
        geometry.translate(charSize.width / 2, charSize.height / 2, 0);
        geometry.scale(0.0125, 0.0125, 0.0125);


        const material = new THREE.MeshBasicMaterial({ side: THREE.FrontSide, transparent: true, opacity: alpha, alphaTest: 0.01 });
        material.map = texture;

        const mesh = new THREE.Mesh(geometry, material);

        return {
            mesh: mesh,
            width: 0.0125 * charSize.width,
            height: 0.0125 * charSize.height,
            ascent: 0.0125 * 4
        }
    }

    async loadUnifontHex(fileUrl) {
        try {
            const response = await fetch(fileUrl);
            const text = await response.text();
            const lines = text.split('\n').map(line => line.trim());
            let data = [];
            for (let line of lines) {
                data.push({
                    codePoint: line.split(':')[0],
                    bitmap: line.split(':')[1]
                });
            }
            return data;
        } catch (error) {
            console.error('Error loading .hex file:', error);
            return [];
        }
    }

    hexToBinary(hexString) {
        return hexString
            .split('')
            .map(hex => parseInt(hex, 16).toString(2).padStart(4, '0'))
            .join('');
    }

    getCharacterSize(binary) {
        return binary.length === 256 ? { width: 16, height: 16 } : { width: 8, height: 16 };
    }
}

let providers = {
    default: new Default(),
    unifont: new UniFont()
};
providers.default.loadData();
providers.unifont.loadData();