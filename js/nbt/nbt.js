class TAG {

    constructor(name = "", payload = undefined) {
        this.name = name;
        if (!(payload === undefined)){
            this.payload = payload;
        }
        
    }

    set name(newName) {
        this._name = String(newName);
    }

    get name() {
        return this._name;
    }

    set payload(newPayload) {
        this._payload = new this.constructor.payloadType(newPayload);
    }

    get payload() {
        return this._payload;
    }

    static loadPayload(rawData, dataOffset) {
        const data = rawData.subarray(dataOffset[0]);
        const [payload] = this.payloadFormat.unpack(data);
        const tag = new this('', payload);
        dataOffset[0] += this.payloadFormat.size;
        return tag;
    }

    writeTag(buffer) {
        buffer.push(this.tagType);
    }

    writeName(buffer) {
        if (this.name !== null) {
            const encoded = Buffer.from(this.name, "utf-8");
            buffer.push(encoded.length >> 8, encoded.length & 255, ...encoded);
        }
    }

    writePayload(buffer) {
        buffer.push(...this.payloadFormat.pack(this.payload));
    }
}

class TAG_Byte extends TAG {
    static tagType = 1;
    static payloadType = Number;
    static payloadFormat = new Int8Array().constructor;
}

class TAG_Short extends TAG {
    static tagType = 2;
    static payloadType = Number;
    static payloadFormat = new DataView(new ArrayBuffer(2));
    static loadPayload(rawData, dataOffset) {
        const data = rawData.subarray(dataOffset[0]);
        const payload = this.payloadFormat.getInt16(0, false);
        const tag = new this('', payload);
        dataOffset[0] += this.payloadFormat.byteLength;
        return tag;
    }
}

class TAG_Int extends TAG {
    static tagType = 3;
    static payloadType = Number;
    static payloadFormat = new DataView(new ArrayBuffer(4));
    static loadPayload(rawData, dataOffset) {
        const data = rawData.subarray(dataOffset[0]);
        const payload = this.payloadFormat.getInt32(0, false);
        const tag = new this('', payload);
        dataOffset[0] += this.payloadFormat.byteLength;
        return tag;
    }
}

class TAG_Long extends TAG {
    static tagType = 4;
    static payloadType = BigInt;
    static payloadFormat = new DataView(new ArrayBuffer(8));
    static loadPayload(rawData, dataOffset) {
        const data = rawData.subarray(dataOffset[0]);
        const payload = this.payloadFormat.getBigInt64(0, false);
        const tag = new this('', payload);
        dataOffset[0] += this.payloadFormat.byteLength;
        return tag;
    }
}

class TAG_Float extends TAG {
    static tagType = 5;
    static payloadType = Number;
    static payloadFormat = new DataView(new ArrayBuffer(4));
    static loadPayload(rawData, dataOffset) {
        const data = rawData.subarray(dataOffset[0]);
        const payload = this.payloadFormat.getFloat32(0, false);
        const tag = new this('', payload);
        dataOffset[0] += this.payloadFormat.byteLength;
        return tag;
    }
}

class TAG_Double extends TAG {
    static tagType = 6;
    static payloadType = Number;
    static payloadFormat = Float64Array;

    static loadPayload(rawData, dataOffset) {
        const data = rawData.subarray(dataOffset[0]);
        const payload = new this.payloadType(new this.payloadFormat(data.buffer, data.byteOffset, 8)[0]);
        const tag = new this('', payload);
        dataOffset[0] += this.payloadFormat.byteLength;
        return tag;
    }

    constructor(payload = 0.0) {
        super();
        this.payload = payload;
    }

    set payload(newPayload) {
        this._payload = this.payloadType(newPayload);
    }

    get payload() {
        return this._payload;
    }

    writePayload(buffer) {
        const float64Array = new this.payloadFormat(1);
        float64Array[0] = this.payload;
        buffer.push(...new Uint8Array(float64Array.buffer));
    }

    getFullLength() {
        return this.payloadFormat.byteLength;
    }
}

class TAG_Array extends TAG {
    constructor(name = "", payload = []) {
        super(name, payload);
    }

    set payload(newPayload) {
        this._payload = new this.constructor.payloadType(newPayload);
    }

    get payload() {
        return this._payload;
    }

    static loadPayload(rawData, dataOffset) {
        const data = rawData.subarray(dataOffset[0]);
        const arrayLength = new DataView(data.buffer, data.byteOffset, 4).getInt32(0, false);
        const payloadData = data.subarray(4, 4 + arrayLength * this.payloadType.BYTES_PER_ELEMENT);
        const payload = Array.from(new this.payloadType(payloadData));
        const tag = new this('', payload);
        dataOffset[0] += 4 + arrayLength * this.payloadType.BYTES_PER_ELEMENT;
        return tag;
    }

    writePayload(buffer) {
        const payloadArray = new this.dtype(this.payload);
        const payloadStr = Array.from(payloadArray.buffer);
        const payloadLength = this.payload.length;
        const payloadLengthBytes = new Uint8Array([
            payloadLength & 0xFF,
            (payloadLength >> 8) & 0xFF,
            (payloadLength >> 16) & 0xFF,
            (payloadLength >> 24) & 0xFF
        ]);
        const payloadBuffer = new Uint8Array(payloadLengthBytes.length + payloadStr.length);
        payloadBuffer.set(payloadLengthBytes);
        payloadBuffer.set(payloadStr, payloadLengthBytes.length);
        buffer.set(payloadBuffer);
    }
}


class TAG_Byte_Array extends TAG_Array {
    static payloadType = Uint8Array;
}

class TAG_Int_Array extends TAG_Array {
    static payloadType = Int32Array;
}

class TAG_Long_Array extends TAG_Array {
    static payloadType = BigInt64Array;
}


class TAG_String extends TAG {
    static tagType = 8;
    static payloadType = String;
    static loadPayload(rawData, dataOffset) {
        const data = rawData.subarray(dataOffset[0]);
        const stringLength = new DataView(data.buffer, data.byteOffset, 2).getUint16(0, false);
        const payload = new TextDecoder().decode(data.subarray(2, 2 + stringLength));
        const tag = new this('', payload);

        dataOffset[0] += 2 + stringLength;
        return tag;
    }
}

class TAG_List extends TAG {
    static tagType = 9;
    static payloadType = Array;
    static loadPayload(rawData, dataOffset) {
        const data = rawData.subarray(dataOffset[0]);
        const elementType = data[0];
        const listLength = new DataView(data.buffer, data.byteOffset + 1, 4).getInt32(0, false);
        const payload = [];
        let payloadOffset = 5;
        for (let i = 0; i < listLength; i++) {
            const element = TAG.loadPayload(rawData, [dataOffset[0] + payloadOffset]);
            payload.push(element);
            payloadOffset += element.getFullLength();
        }
        const tag = new this(payloadType, payload);
        dataOffset[0] += payloadOffset;
        return tag;
    }

    constructor(elementType = 0, payload = []) {
        super();
        this.elementType = elementType;
        this.payload = payload;
    }

    set payload(newPayload) {
        this._payload = this.payloadType(newPayload);
    }

    get payload() {
        return this._payload;
    }

    writePayload(buffer) {
        buffer.push(this.elementType);
        buffer.push(...new Uint32Array([this.payload.length]));
        this.payload.forEach((element) => element.writeTag(buffer));
    }

    getFullLength() {
        let length = 5;
        this.payload.forEach((element) => {
            length += element.getFullLength();
        });
        return length;
    }
}

class TAG_Compound extends TAG {
    static tagType = 10;
    static payloadType = Map;

    static loadPayload(rawData, dataOffset) {
        const payload = new Map();
        let payloadOffset = 0;
        while ((rawData[dataOffset[0]] !== 0) && dataOffset[0] < rawData.length) {
            const tagType = rawData[dataOffset[0]];
            dataOffset[0] += 1;

            const name = loadString(rawData, dataOffset);
            const tagClass = tagTypeToClass(tagType);
            const tag = tagClass.loadPayload(rawData, dataOffset);
            tag.name = name;
            payload.set(tag.name, tag);
        }

        dataOffset[0] += 1; // Skip the TAG_End byte
        const tag = new this('', payload);
        return tag;
    }

    constructor(name='', payload = new Map()) {
        super(name);
        this.payload = payload;
    }

    set payload(newPayload) {
        if (!(newPayload instanceof Map)) {
            throw new TypeError("TAG_Compound's payload is not a Map");
        }

        for (const [name, tag] of newPayload.entries()) {
            if (!(tag instanceof TAG)) {
                throw new TypeError("TAG_Compound's payload contains a non-TAG element");
            }
            tag.name = name;
        }

        this._payload = newPayload;
    }

    get payload() {
        return this._payload;
    }

    writePayload(buffer) {
        for (const [name, tag] of this.payload.entries()) {
            tag.writeTag(buffer);
            tag.writeName(buffer);
            tag.writePayload(buffer);
        }

        buffer.push(0); // Write the TAG_End byte
    }

    getFullLength() {
        let length = 1; // TAG_End byte
        for (const tag of this.payload.values()) {
            length += tag.getFullLength();
        }
        return length;
    }
}

function tagTypeToClass(tagType) {
    switch (tagType) {
        case 1:
            return TAG_Byte;
        case 2:
            return TAG_Short;
        case 3:
            return TAG_Int;
        case 4:
            return TAG_Long;
        case 5:
            return TAG_Float;
        case 6:
            return TAG_Double;
        case 7:
            return TAG_Byte_Array;
        case 8:
            return TAG_String;
        case 9:
            return TAG_List;
        case 10:
            return TAG_Compound;
        case 11:
            return TAG_Int_Array;
        case 12:
            return TAG_Long_Array;
        default:
            throw new Error(`Unknown tag type: ${tagType}`);
    }
}

function loadString(rawData, dataOffset) {
    const data = rawData.subarray(dataOffset[0]);
    const stringLength = (data[0] << 8) | data[1];
    const stringData = data.subarray(2, 2 + stringLength);
    const decodedString = new TextDecoder().decode(stringData);
    dataOffset[0] += 2 + stringLength;
    return decodedString;
}



// Usage Example:
const nbtData = new Uint8Array([
    10,0,9,83,99,104,101,109,97,116,105,99,10,0,7,80,97,108,101,116,116,101,3,0,13,109,105,110,101,99,114,97,102,116,58,97,105,114,0,0,0,0,3,0,22,109,105,110,101,99,114,97,102,116,58,114,101,100,95,99,111,110,99,114,101,116,101,0,0,0,1,0,3,0,10,80,97,108,101,116,116,101,77,97,120,0,0,0,1,2,0,5,87,105,100,116,104,0,5,2,0,6,72,101,105,103,104,116,0,5,2,0,6,76,101,110,103,116,104,0,5,7,0,9,66,108,111,99,107,68,97,116,97,0,0,0,125,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,7,86,101,114,115,105,111,110,0,0,0,2,3,0,11,68,97,116,97,86,101,114,115,105,111,110,0,0,7,184,0
]);

const tag = TAG_Compound.loadPayload(nbtData, [0]);
console.log(tag); // Outputs: TAG_Compound { name: 'example', payload: Map { '': TAG_String { payload: 'hello' } } }
