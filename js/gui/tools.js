import { GUI } from 'lil-gui';

class ToolsGUI extends GUI {
    constructor(editor, functions, parentDom = document.getElementById('tool_container')) {
        super({ autoPlace: false, title: '' });
        this.domElement.id = 'toolsGUI';
        this.parentDom = parentDom;
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
            button.domElement.getElementsByClassName('name')[0].innerHTML = `<i class="bi bi-${fun['icon']}"></i>`;
            button.domElement.getElementsByClassName('bi')[0].style.color = fun['color'] ? fun['color'] : 'inherit';
        }
    }
}

class FileToolsGUI extends ToolsGUI {
    constructor(editor, parentDom = document.getElementById('tool_container')) {
        let functions = [
            {
                'tooltip': 'New Project',
                'icon': 'file-earmark-plus',
                'function': function () { 
                    editor.control.detach(); 
                    editor.new(); 
                    editor.update();
                 },
            },
            {
                'tooltip': 'Load',
                'icon': 'folder2-open',
                'function': async function () {
                    editor.history.clear();
                    await editor.loadBlockDisplaysFromFile();
                },
            },
            {
                'tooltip': 'Save',
                'icon': 'save',
                'function': function () { editor.saveBlockDisplaysToFile() },
            },
        ];
        super(editor, functions, parentDom);
    }
}

class HistoryToolsGUI extends ToolsGUI {
    constructor(editor, parentDom = document.getElementById('tool_container')) {
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

class ElementToolsGUI extends ToolsGUI {
    constructor(editor, parentDom = document.getElementById('tool_container')) {
        let functions = [
            {
                'tooltip': 'Add Block Display',
                'icon': 'plus-square-fill',
                'function': function () { editor.gui.search.open() },
            },
            {
                'tooltip': 'Duplicate Selected',
                'icon': 'intersect',
                'function': async function () {
                    await editor.duplicate();
                    editor.update();
                    
                },
            },
            {
                'tooltip': 'Group / Ungroup Selected (G)',
                'icon': 'collection-fill',
                'function': function () {
                    editor.group();
                    editor.update();
                },
            },
            {
                'tooltip': 'Delete Selected (DEL)',
                'icon': 'trash-fill',
                'function': function () {
                    editor.delete();
                    editor.update();
                },
            },
        ];
        super(editor, functions, parentDom);
    }
}

class TransformToolsGUI extends ToolsGUI {
    constructor(editor, parentDom = document.getElementById('tool_container')) {
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
        super(editor, functions, parentDom);
    }
}

class FlipToolsGUI extends ToolsGUI {
    constructor(editor, parentDom = document.getElementById('tool_container')) {
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
        super(editor, functions, parentDom);
    }
}

class MiscGUI extends ToolsGUI {
    constructor(editor, parentDom = document.getElementById('tool_container')) {
        let functions = [
            {
                'tooltip': 'Report a bug!',
                'icon': 'bug-fill',
                'function': function () { 
                    window.open('https://github.com/eszesbalint/bdstudio/issues', '_blank');
                },
            },
        ];
        super(editor, functions, parentDom);
    }
}

export { FileToolsGUI, ElementToolsGUI, TransformToolsGUI, HistoryToolsGUI, FlipToolsGUI, MiscGUI };