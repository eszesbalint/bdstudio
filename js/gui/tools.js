import { GUI } from './guiClass.js';

export class ToolsGUI extends GUI {
    constructor(editor, functions, args, vertical=false) {
        super(editor, args);
        this.domElement.classList.add('toolsGUI');
        if (vertical) {
            this.domElement.classList.add('vertical');
        } else {
            this.domElement.classList.add('horizontal');
        }
        this.editor = editor;
        this.parentDom.appendChild(this.domElement);

        for (let fun of functions) {
            // Preventing button spamming
            let obj = {
                'function': async function () {
                    editor.gui.loading.show(fun['tooltip']);
                    button.disable(); // I have no idea why this button reference works
                    await fun['function']();
                    button.enable();
                    editor.gui.loading.hide();
                }
            }
            let button = this.add(obj, 'function');            
            button.domElement.title = fun['tooltip'];
            

                button.domElement.getElementsByClassName('name')[0].innerHTML = `
                <i class="bi bi-${fun['icon']}">
                    ${fun['secondary_icon']?`<i class="bi bi-${fun['secondary_icon']} secondary"></i>`:''}
                </i>
                ${fun['title']?`<span>${fun['title']}</span>`:''}
                `;

            button.domElement.getElementsByClassName('bi')[0].style.color = fun['color'] ? fun['color'] : 'inherit';
        }
    }
}

export class FileToolsGUI extends ToolsGUI {
    constructor(editor, args, vertical=false) {
        let functions = [
            {
                'title': 'Load',
                'tooltip': 'Load',
                'icon': 'folder2-open',
                'function': async function () {
                    editor.history.clear();
                    await editor.loadBlockDisplaysFromFile();
                },
            },
            {
                'title': 'Save',
                'tooltip': 'Save',
                'icon': 'save',
                'function': function () { editor.saveBlockDisplaysToFile() },
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
                 },
            },
        ];
        super(editor, functions, args, vertical);
    }
}

export class HistoryToolsGUI extends ToolsGUI {
    constructor(editor, parentDom) {
        let functions = [
            {
                'tooltip': 'Undo',
                'icon': 'arrow-counterclockwise',
                'function': async function () { await editor.undo() },
            },
            {
                'tooltip': 'Redo',
                'icon': 'arrow-clockwise',
                'function': async function () { await editor.redo() },
            },
        ];
        super(editor, functions, parentDom);
    }
}

export class ElementToolsGUI extends ToolsGUI {
    constructor(editor, args, vertical=false) {
        let functions = [
            {
                'title': 'Blocks',
                'tooltip': 'Add Block Display',
                'icon': 'box-fill',
                'secondary_icon': 'search',
                'function': function () { editor.gui.blockSearch.showModal() },
            },
            {
                'title': 'Items',
                'tooltip': 'Add Item Display',
                'icon': 'gem',
                'secondary_icon': 'search',
                'function': function () { editor.gui.itemSearch.showModal() },
            },
            {
                'title': 'Text',
                'tooltip': 'Add Text Display',
                'icon': 'textarea-t',
                'function': async function () { 
                    let object = await editor.add('Enter Text', 'TextDisplay');
                    object.selected = true;
                },
            },
            {   
                'title': 'Duplicate',
                'tooltip': 'Duplicate Selected',
                'icon': 'intersect',
                'function': async function () {
                    await editor.duplicate();
                    editor.update();
                    
                },
            },
            {
                'title': 'Group',
                'tooltip': 'Group / Ungroup Selected (G)',
                'icon': 'boxes',
                'function': function () {
                    editor.group();
                    editor.update();
                },
            },
            {
                'title': 'Delete',
                'tooltip': 'Delete Selected (DEL)',
                'icon': 'trash-fill',
                'function': function () {
                    editor.delete();
                    editor.update();
                },
            },
        ];
        super(editor, functions, args, vertical);
    }
}

export class TransformToolsGUI extends ToolsGUI {
    constructor(editor, args, vertical=false) {
        let functions = [
            {
                'tooltip': 'Translate Tool (T)',
                'icon': 'arrows-move',
                'function': function () { editor.control.setMode('translate'); },
            },
            {
                'tooltip': 'Rotate Tool (R)',
                'icon': 'arrow-repeat',
                'function': function () { editor.control.setMode('rotate'); },
            },
            {
                'tooltip': 'Scale Tool (S)',
                'icon': 'arrows-angle-expand',
                'function': function () { editor.control.setMode('scale'); },
            },
        ];
        super(editor, functions, args, vertical);
    }
}

export class FlipToolsGUI extends ToolsGUI {
    constructor(editor, args, vertical=false) {
        let functions = [
            {
                'tooltip': 'Flip along X',
                'icon': 'symmetry-vertical',
                'color': 'red',
                'function': function () { 
                    let object = editor.control.object
                    const x = object.scale.x;
                    const y = object.scale.y;
                    const z = object.scale.z;
                    object.scale.set(-x, y, z); 
                    editor.update();
                },
            },
            {
                'tooltip': 'Flip along Y',
                'icon': 'symmetry-horizontal',
                'color': 'green',
                'function': function () { 
                    let object = editor.control.object
                    const x = object.scale.x;
                    const y = object.scale.y;
                    const z = object.scale.z;
                    object.scale.set(x, -y, z);
                    editor.update();
                },
            },
            {
                'tooltip': 'Flip along Z',
                'icon': 'symmetry-vertical',
                'color': 'blue',
                'function': function () { 
                    let object = editor.control.object
                    const x = object.scale.x;
                    const y = object.scale.y;
                    const z = object.scale.z;
                    object.scale.set(x, y, -z);
                    editor.update();
                },
            },
        ];
        super(editor, functions, args, vertical);
    }
}

export class MiscGUI extends ToolsGUI {
    constructor(editor, args, vertical=true) {
        let functions = [
            {
                'tooltip': 'Report a bug!',
                'icon': 'bug-fill',
                'function': function () { 
                    window.open('https://github.com/eszesbalint/bdstudio/issues', '_blank');
                },
            },
            {
                'tooltip': 'Keyboard Shortcuts',
                'icon': 'keyboard',
                'function': function () { 
                    editor.gui.help.showModal();
                },
            },
            {
                'tooltip': 'Donate',
                'icon': 'piggy-bank-fill',
                'function': function () { 
                    editor.gui.donate.showModal();
                },
            },
        ];
        super(editor, functions, args, vertical);
    }
}

export class ExportToolsGUI extends ToolsGUI {
    constructor(editor, args, vertical=false) {
        let functions = [
            {   
                'title': 'Export to Minecraft',
                'tooltip': 'Export to Minecraft',
                'icon': 'box-arrow-right',
                'color': 'var(--spring-green)',
                'function': function () { 
                    editor.gui.command.update();
                    editor.gui.command.showModal();
                },
            },
        ];
        super(editor, functions, args, vertical);
    }
}

export class VersionToolsGUI extends ToolsGUI {
    constructor(editor, args) {
        let functions = [
            {
                'title': 'BDStudio',
                'tooltip': 'New Project',
                'icon': 'file-earmark-plus',
                'function': function () {
                    editor.gui.version.showModal();
                },
            }
        ];
        super(editor, functions, args);

        let button = this.controllers[0];
        button.domElement.getElementsByClassName('name')[0].innerHTML = `
                <img src="images/logo_28x28.png" width="28" height="28">
                ${functions[0]['title']?`<span>${functions[0]['title']}</span>`:''}
                `;
    }
}

