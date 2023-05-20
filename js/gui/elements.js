import { GUI } from 'lil-gui';

class ElementsGUI extends GUI {
    constructor(editor, parentDom=document.getElementById('side_container')) {
        super({ autoPlace: false, title: 'Elements' });
        this.parentDom = parentDom;
        this.domElement.id = 'elementsGUI';
        this.parentDom.appendChild(this.domElement);
        this.editor = editor;
        this.update();
    }

    update() {
        let editor = this.editor;
        this.destroy();
        this.parentDom.appendChild(this.domElement);
        for (let object of editor.objects.children) {
            const folderBlockDisplay = this.addFolder(object.name);
            folderBlockDisplay.close();
            if (object.selected) {
                folderBlockDisplay.domElement.classList.add('selected');
                if (object.isCollection) {
                    folderBlockDisplay.domElement.classList.add('collection');
                }
                folderBlockDisplay.open();
            }
            folderBlockDisplay.onOpenClose(changedGUI => {
                editor.selectBlockDisplay(object);
                editor.control.attach(object);
                editor.gui.elements.update();
                editor.render();
            });
            const propBlockDisplay = {
                'Delete'() {
                    editor.deleteBlockDisplay(object);
                    editor.gui.elements.update();
                    editor.render();
                },
                'Duplicate': async function () {
                    await editor.duplicateBlockDisplay(object);
                    editor.gui.elements.update();
                    editor.render();
                }
            };
            if (object.isBlockDisplay) {
                for (let key of Object.keys(object._possibleVariants)) {

                    let controller = folderBlockDisplay.add(
                        object.blockState.variant,
                        key,
                        object._possibleVariants[key]
                    );
                    controller.onChange(async function (v) {
                        if (v) {
                            object.blockState.variant[key] = v;
                        }
                        await object.updateModel();
                        editor.render();
                        editor.gui.elements.update();
                    });
                }
            }
            folderBlockDisplay.add(propBlockDisplay, 'Duplicate');
            folderBlockDisplay.add(propBlockDisplay, 'Delete');


        }
    }
}

export { ElementsGUI };