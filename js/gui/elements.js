import { GUI } from './guiClass';


class ElementsGUI extends GUI {
    constructor(editor, parentDom = document.getElementById('side_container')) {
        super({ autoPlace: false, title: 'Elements' });
        this.parentDom = parentDom;
        this.domElement.id = 'elementsGUI';
        this.parentDom.appendChild(this.domElement);
        this.editor = editor;
        this.update();
    }

    update() {
        let scope = this;
        scope.empty();



        let buildRecursively = function (parentGUI, object) {

            const folder = parentGUI.addFolder(object.name);
            //folder.closeFolders = true;

            if (!(object === scope.editor.objects)) {
                folder.onOpenClose(changedGUI => {
                    object.selected = true;
                });


                if (object.selected) {
                    folder.domElement.classList.add('selected');
                    if (object.isCollection) {
                        folder.domElement.classList.add('collection');
                    }

                } else if (object.getObjectByProperty('selected', true)) {

                } else {
                    folder.domElement.classList.add('closed');
                    return;
                }
            }



            if (object.isBlockDisplay) {

            } else if (object.isCollection) {
                forEachChild(object, function (child) {
                    if (child.isBlockDisplay || child.isCollection) {
                        buildRecursively(folder, child);
                    }
                });
            }
        }


        buildRecursively(scope, scope.editor.objects);

    }
}

function forEachChild(object, func) {
    let sorted = object.children.sort(function (a, b) {
        if (a.id < b.id) return -1;
        if (a.id > b.id) return 1;
    });
    for (let child of sorted) {
        func(child);
    }
}

export { ElementsGUI };