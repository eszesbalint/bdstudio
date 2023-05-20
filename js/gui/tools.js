import { GUI } from 'lil-gui';

class ToolsGUI extends GUI {
    constructor(editor, functions, parentDom = document.getElementById('tool_container')) {
        super({ autoPlace: false, title: '' });
        this.domElement.id = 'toolsGUI';
        this.parentDom = parentDom;
        this.editor = editor;
        this.parentDom.appendChild(this.domElement);

        for (let fun of functions) {
            let button = this.add(fun, 'function');
            button.domElement.title = fun['tooltip'];
            button.domElement.getElementsByClassName('name')[0].innerHTML = `<i class="bi bi-${fun['icon']}"></i>`;
        }
    }
}

class FileToolsGUI extends ToolsGUI {
    constructor(editor, parentDom = document.getElementById('tool_container')) {
        let functions = [
            {
                'tooltip': 'Load',
                'icon': 'folder2-open',
                'function': function () { editor.loadBlockDisplaysFromFile() },
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
                    const duplicates = await editor.duplicateBlockDisplay();
                    editor.selectBlockDisplay();
                    for (let object of duplicates) {
                        object.selected = true;
                    }
                    editor.gui.elements.update();
                    editor.render();
                },
            },
            {
                'tooltip': 'Group / Ungroup Selected (G)',
                'icon': 'collection-fill',
                'function': function () {
                    editor.toggleGrouping();
                    editor.gui.elements.update();
                    editor.render();
                },
            },
            {
                'tooltip': 'Delete Selected (DEL)',
                'icon': 'trash-fill',
                'function': function () {
                    editor.deleteBlockDisplay();
                    editor.gui.elements.update();
                    editor.render();
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

export { FileToolsGUI, ElementToolsGUI, TransformToolsGUI };