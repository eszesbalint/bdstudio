import { GUI } from 'lil-gui';

import { assetsPath } from '../loaders/BlockModelLoader';

class SearchGUI extends GUI {
    constructor(editor, parentDom = document.getElementById('top_container')) {
        super({ autoPlace: false, title: 'Block Search' });
        this.parentDom = parentDom;
        this.domElement.id = 'searchGUI';
        this.parentDom.appendChild(this.domElement);
        this.editor = editor;

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

        this.update();
    }

    async update(searchTerm='') {
        this.folders[0].destroy();
        const folderResults = this.addFolder('Results');



        const response = await fetch(assetsPath + 'blockstates/blockstates.json');
        const json = await response.json();
        const blockStateList = json['blockstates'];

        for (let blockState of blockStateList) {
            if ((blockState + ' ').includes(searchTerm)) {
                let searchGUI = this;
                const propResults = {
                    'add': async function () {
                        searchGUI.editor.selectBlockDisplay(await searchGUI.editor.addBlockDisplay(blockState));
                        searchGUI.editor.gui.elements.update();
                        searchGUI.editor.render();
                    }
                };
                folderResults.add(propResults, 'add').name(blockState);
            }
        }


    }
}

export { SearchGUI };