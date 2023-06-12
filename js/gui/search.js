import { GUI } from 'lil-gui';

import { assetsPath } from '../elements/blockDisplay.js';

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
        folderResults.domElement.id = 'searchResults';

        this.update();
    }

    async update(searchTerm='') {
        let scope = this;
        this.folders[0].destroy();
        const folderResults = this.addFolder('Results');
        folderResults.domElement.id = 'searchResults';



        const response = await fetch(assetsPath + 'blockstates/blockstates.json');
        const json = await response.json();
        const blockStateList = json['blockstates'];

        let badboyz = [];
        for (let blockState of blockStateList) {
            if ((blockState + ' ').includes(searchTerm)) {
                
                const propResults = {
                    'add': async function () {
                        
                        let object = await scope.editor.add(blockState);
                        object.selected = true;
                        
                    }
                };
                folderResults.add(propResults, 'add').name(blockState);
                
            }
        }


    }
}

export { SearchGUI };