import { GUI } from './guiClass.js';
import { ModalGUI } from './dialog.js';

import { PropertyCommand } from '../commands/property.js';
import { assetsPath } from '../elements/BlockDisplay.js';

class SearchGUI extends ModalGUI {
    constructor(editor, args, items=[], prop) {
        super(editor, args);
        this.domElement.classList.add('searchGUI');
        this.parentDom.appendChild(this.domElement);

        this.items = items;
        this.prop = prop;

        let searchGUI = this;
        const propsSearch = {
            searchTerm: '',
            get 'text'() {

                return this.searchTerm;

            },
            set 'text'(v) {

                searchGUI.update(v);
                this.searchTerm = v;

            },
        }

        this.add(propsSearch, 'text').name('Search').listen();
        const folderResults = this.addFolder('Results');
        folderResults.domElement.id = 'searchResults';

        this.update();
    }

    async update(searchTerm = '') {
        let scope = this;
        scope.folders[0].destroy();
        const folderResults = this.addFolder('Results');
        folderResults.domElement.id = 'searchResults';

        for (let item of scope.items) {
            if ((item + ' ').includes(searchTerm)) {
                folderResults.add({'function':scope.prop['function'].bind(this,item)}, 'function').name(item);
            }
        }


    }
}

class BlockSearchGUI extends SearchGUI {
    constructor(editor, args, items=[]) {

        const prop = {
            'function': async function (item) {
                let objects = editor.find('selected');

                if (objects.length) {
                    let isAllBlockDisplays = objects.every(function (element, index) {
                        return element.isBlockDisplay;
                    });
                    if (isAllBlockDisplays) {
                        for (let object of objects) {
                            const before = JSON.parse(JSON.stringify(object.blockState));
                            object.blockState = item;
                            const after = JSON.parse(JSON.stringify(object.blockState));
                            let command = new PropertyCommand(editor, object, 'blockState', after);
                            command.beforeValue = before;
                            editor.history.push(command);

                            //await object.updateModel();
                            //scope.editor.gui.elements.update();
                            
                        }
                        //scope.editor.selectAll(objects);
                    } else if (objects.length === 1 && objects[0].isCollection) {
                        let object = await editor.add(item, 'BlockDisplay', objects[0]);
                        object.selected = true;
                    } else {
                        let object = await editor.add(item, 'BlockDisplay');
                        object.selected = true;
                    }
                } else {
                    let object = await editor.add(item, 'BlockDisplay');
                    object.selected = true;
                }
            }
        };

        super(editor, args, items, prop);
        this.updateItems();
    }

    async updateItems(){
        let response = await fetch(assetsPath + 'blockstates.json');
        let json = await response.json();
        this.items = json['blockstates'];
        this.update();
    }
}


class ItemSearchGUI extends SearchGUI {
    constructor(editor, args, items=[]) {
        
        const prop = {
            'function': async function (item) {
                let objects = editor.find('selected');

                if (objects.length) {
                    let isAllItemDisplays = objects.every(function (element, index) {
                        return element.isItemDisplay;
                    });
                    if (isAllItemDisplays) {
                        for (let object of objects) {
                            const before = JSON.parse(JSON.stringify(object._itemState));
                            object.itemState = item;
                            const after = JSON.parse(JSON.stringify(object._itemState));
                            let command = new PropertyCommand(editor, object, 'itemState', after);
                            command.beforeValue = before;
                            editor.history.push(command);

                            //await object.updateModel();
                            //scope.editor.gui.elements.update();
                            
                        }
                        //scope.editor.selectAll(objects);
                    } else if (objects.length === 1 && objects[0].isCollection) {
                        let object = await editor.add(item, 'ItemDisplay', objects[0]);
                        object.selected = true;
                    } else {
                        let object = await editor.add(item, 'ItemDisplay');
                        object.selected = true;
                    }
                } else {
                    let object = await editor.add(item, 'ItemDisplay');
                    object.selected = true;
                }
            }
        };

        super(editor, args, items, prop);
        this.updateItems();
    }

    async updateItems(){
        let response = await fetch(assetsPath + 'items.json');
        let json = await response.json();
        this.items = json['items'];
        this.update();
    }
}

export { BlockSearchGUI, ItemSearchGUI };