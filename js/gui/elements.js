import { GUI } from './guiClass';


class ElementsGUI extends GUI {
    constructor(editor, args) {
        super(editor, args);
        this.domElement.classList.add('elementsGUI');
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

                if (object.isBlockDisplay) {
                    folder.domElement.classList.add('blockdisplay');
                }
                if (object.isItemDisplay) {
                    folder.domElement.classList.add('itemdisplay');
                }
                if (object.isCollection) {
                    folder.domElement.classList.add('collection');
                }

                if (object.selected) {
                    folder.domElement.classList.add('selected');
                    

                } else if (object.getObjectByProperty('selected', true)) {

                } else {
                    folder.domElement.classList.add('closed');
                    return;
                }

                
            }



            if (object.isDisplay) {

            } else if (object.isCollection) {
                forEachChild(object, function (child) {
                    if (child.isBlockDisplay || child.isItemDisplay || child.isCollection) {
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