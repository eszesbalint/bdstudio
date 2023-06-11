import { GUI as lilGUI} from 'lil-gui';

class GUI extends lilGUI {
    constructor(args) {
        super(args);
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
}

export { GUI };