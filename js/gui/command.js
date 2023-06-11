import { GUI } from './guiClass.js';

class CommandGUI extends GUI {
    constructor(editor, parentDom = document.getElementById('top_container')) {
        super({ autoPlace: false, title: 'Command' });
        this.parentDom = parentDom;
        this.domElement.id = 'commandGUI';
        this.parentDom.appendChild(this.domElement);
        this.editor = editor;
        this.onOpenClose(changedGUI => {
            changedGUI.update();
        });

    }

    async update() {
        this.empty();
        let scope = this;
        const propsCommand = {
            'command': '',
            'Generate Command': async function () {
                await scope.update();
            }
        }
        
        scope.add(propsCommand, 'Generate Command');

        let commands = this.editor.generate();
        commands.forEach(function (value, i) {
            let prop = {
                get 'command'() { return value },
                set 'command'(v) { return value }
            }
            scope.add(prop, 'command').name(`Command ${i+1}`);
        });
            //let textarea = document.createElement('textarea');
            //textarea.classList.add('children');
            //textarea.setAttribute('readOnly', true);
            //textarea.value = command;
            //scope.domElement.appendChild(textarea);
        


    }
}


export { CommandGUI };