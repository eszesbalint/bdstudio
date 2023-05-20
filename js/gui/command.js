import { GUI } from 'lil-gui';

import { minecraftSummonCommandFromObjects } from '../utils.js';

class CommandGUI extends GUI {
    constructor(editor, parentDom = document.getElementById('top_container')) {
        super({ autoPlace: false, title: 'Block Search' });
        this.parentDom = parentDom;
        this.domElement.id = 'commandGUI';
        this.parentDom.appendChild(this.domElement);
        this.editor = editor;
        commandGUI = this;
        const propsCommand = {
            'command': '',
            'Generate Command': async function () {
                await commandGUI.update();
            }
        }
        //let command = commandGUI.add(propsCommand, 'command').name('Command');
        let textarea = document.createElement('textarea');
        textarea.classList.add('children');
        textarea.setAttribute('readOnly', true);
        this.domElement.appendChild(textarea);
        this.add(propsCommand, 'Generate Command');
    }

    async update() {
        let textarea = this.domElement.getElementsByTagName('textarea')[0];
        textarea.value = minecraftSummonCommandFromObjects(this.editor.objects);
        textarea.style.height = '';
        textarea.style.height = textarea.scrollHeight + 'px';
    }
}

export { CommandGUI };