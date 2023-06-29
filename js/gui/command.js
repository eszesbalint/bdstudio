import { GUI } from './guiClass.js';
import { DialogGUI } from './dialog.js';

class CommandGUI extends DialogGUI {
    constructor(editor, args) {
        super(editor, args);

        this.domElement.classList.add('commandGUI');

        this.onOpenClose(changedGUI => {
            changedGUI.update();
        });

        this.update();
    }

    async update() {
        this.empty();
        let scope = this;

        let commands = this.editor.generate();
        commands.forEach(function (value, i) {
            let prop = {
                get 'command'() { return value },
                set 'command'(v) { return value }
            }
            scope.add(prop, 'command').name(`Command ${i+1}`);
        });
            
    }
}


export { CommandGUI };