import { GUI as lilGUI} from 'lil-gui';

class GUI extends lilGUI {
    constructor(editor, args) {
        super(args);
        this.editor = editor;
    }

    empty(){
        let children = [];
        for (let child of this.children){
            child.hide();
            children.push(child);
        }
        for (let child of children){
            child.destroy();
        }

        
        
    }

    get parentDom(){
        if (this.parent) {
            return this.parent.domElement
        } else {
            return this.domElement.parentElement;
        }
    }
}

export { GUI };