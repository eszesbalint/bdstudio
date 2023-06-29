import { DialogGUI } from './dialog.js';
import { ToolsGUI } from './tools.js';

import { decompressJSON } from '../utils.js';

export class VersionGUI extends DialogGUI {
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

        let response = await fetch('version.json');
        let json = await response.json();

        let titleCard = document.createElement('div');
        titleCard.classList.add('titleCard');
        titleCard.innerHTML = `
            <div class="description">
                <h1>${json.title} ${json.stage} ${json.version_number}</h1>
                <p>
                    ${json.description}
                </p>
                <a href="${json.release_notes_link}">Release notes</a>
            </div>
            <div class="logo">
                <img src="images/logo_256x256.png">
            </div>
        `;
        scope.domElement.appendChild(titleCard);
        
        let tools = new FileToolsGUI(this.editor,{autoplace: false, title: '', parent: scope});


    }
}

class FileToolsGUI extends ToolsGUI {
    constructor(editor, args, vertical=false) {
        let functions = [
            {
                'title': 'Load',
                'tooltip': 'Load',
                'icon': 'folder2-open',
                'function': async function () {
                    editor.history.clear();
                    await editor.loadBlockDisplaysFromFile();
                    editor.gui.version.hideModal();
                },
            },
            {
                'title': 'Restore last session',
                'tooltip': 'Restore last session',
                'icon': 'arrow-clockwise',
                'function': async function () { 
                    try {
                        editor.gui.loading.show('Reloading last session');
                        let json = await decompressJSON(localStorage.getItem('blockDisplayObjects'));
                        let objects = await editor.objectsFromJSON(json);
                        if (objects.length === 0) {
                            editor.gui.loading.hide();
                            editor.gui.version.hideModal();
                            return;
                        }
                        editor.scene.remove(editor.objects);
                        editor.objects = objects[0];
                        editor.scene.add(editor.objects);
                        editor.update();
                        editor.gui.loading.hide();
                    } catch (error) {
                        console.log(error);
                        alert(`Couldn't load last session!`);
                        editor.gui.loading.hide();
                        editor.gui.version.hideModal();
                        return;
                    }
                 },
            },
            {
                'title': 'New',
                'tooltip': 'New Project',
                'icon': 'file-earmark-fill',
                'secondary_icon': 'plus-circle-fill',
                'function': function () { 
                    editor.control.detach(); 
                    editor.new(); 
                    editor.update();
                    editor.gui.version.hideModal();
                 },
            },
        ];
        super(editor, functions, args, vertical);
    }
}