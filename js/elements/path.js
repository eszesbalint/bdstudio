class ResourcePath {
    basePath = '1.20'
    constructor(string, subfolder, extention) {
        if (string.includes(':')) {
            this.namespace = string.split(':')[0];
            this.path = string.split(':')[1];
        } else {
            this.namespace = 'minecraft';
            this.path = string;
        }
        this.subfolder = subfolder;
        this.extention = extention;
        this.filename = this.path.split('/').slice(-1);
    }

    toPath() {
        return `${this.basePath}/assets/${this.namespace}/${this.subfolder}/${this.path}.${this.extention}`;
    }
}

class BlockstateResourcePath extends ResourcePath {
    constructor(string){
        super(string, 'blockstates', 'json');
    }
}

class ModelResourcePath extends ResourcePath {
    constructor(string){
        super(string, 'models', 'json');
    }
}

class TextureResourcePath extends ResourcePath {
    constructor(string){
        super(string, 'textures', 'png');
    }
}

export { BlockstateResourcePath, ModelResourcePath, TextureResourcePath };