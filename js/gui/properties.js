import { GUI } from './guiClass';

import { PropertyCommand } from '../commands/commands';

class PropertiesGUI extends GUI {
    constructor(editor, args) {
        super(editor, args);
        this.domElement.classList.add('propertiesGUI');
        this.parentDom.appendChild(this.domElement);
        this.editor = editor;
        this.update();
    }

    update() {
        let scope = this;
        scope.empty();
        

        let object = scope.editor.find('selected')[0];

        if (!object) object = scope.editor.objects;

        if (object.isBlockDisplay) {
            const blockStateFolder = scope.addFolder('Blockstate');
            for (let key of Object.keys(object._possibleVariants)) {
                let controller = blockStateFolder.add(
                    object.blockState.variant,
                    key,
                    object._possibleVariants[key]
                );
                const before = JSON.parse(JSON.stringify(object._blockState));
                controller.onChange(async function (v) {
                    const after = JSON.parse(JSON.stringify(object._blockState));
                    let command = new PropertyCommand(scope.editor, object, 'blockState', after);
                    command.beforeValue = before;
                    scope.editor.history.push(command);
                    command.execute();

                    //await object.updateModel();
                    scope.editor.gui.elements.update();
                });
            }
            let props = {
                get 'additional NBT'(){ return object.nbt },
                set 'additional NBT'(v){ 
                    let command = new PropertyCommand(scope.editor, object, 'nbt', v);
                    scope.editor.history.push(command);
                    command.execute();
                    scope.editor.gui.elements.update();
                    return object.nbt;
                }
            };
            const nbtFolder = scope.addFolder('NBT');
            nbtFolder.add(props, 'additional NBT').listen();

        } else if (object.isItemDisplay) {
            const blockStateFolder = scope.addFolder('Display');
            for (let key of Object.keys(object._possibleVariants)) {
                let controller = blockStateFolder.add(
                    object.itemState.variant,
                    key,
                    object._possibleVariants[key]
                );
                const before = JSON.parse(JSON.stringify(object._itemState));
                controller.onChange(async function (v) {
                    console.log(object);
                    const after = JSON.parse(JSON.stringify(object._itemState));
                    let command = new PropertyCommand(scope.editor, object, 'itemState', after);
                    command.beforeValue = before;
                    scope.editor.history.push(command);
                    command.execute();

                    //await object.updateModel();
                    scope.editor.gui.elements.update();
                });
            }
            let props = {
                get 'additional NBT'(){ return object.nbt },
                set 'additional NBT'(v){ 
                    let command = new PropertyCommand(scope.editor, object, 'nbt', v);
                    scope.editor.history.push(command);
                    command.execute();
                    scope.editor.gui.elements.update();
                    return object.nbt;
                }
            };
            const nbtFolder = scope.addFolder('NBT');
            nbtFolder.add(props, 'additional NBT').listen();

        } else if (object.isCollection) {
            let props = {
                get 'name'(){ return object.name },
                set 'name'(v){ 
                    let command = new PropertyCommand(scope.editor, object, 'name', v);
                    scope.editor.history.push(command);
                    command.execute();
                    scope.editor.gui.elements.update();
                    return object.name;
                },
                get 'additional NBT'(){ return object.nbt },
                set 'additional NBT'(v){ 
                    let command = new PropertyCommand(scope.editor, object, 'nbt', v);
                    scope.editor.history.push(command);
                    command.execute();
                    scope.editor.gui.elements.update();
                    return object.nbt;
                },
                get 'apply to children'(){ return object.nbtInheritance },
                set 'apply to children'(v){ 
                    let command = new PropertyCommand(scope.editor, object, 'nbtInheritance', v);
                    scope.editor.history.push(command);
                    command.execute();
                    scope.editor.gui.elements.update();
                    return object.nbtInheritance;
                }
            };

            scope.add(props, 'name').listen();

            const folder = scope.addFolder('NBT');
            folder.add(props, 'additional NBT').listen();
            //folder.add(props, 'apply to children').listen();
        }

    }
}



export { PropertiesGUI };