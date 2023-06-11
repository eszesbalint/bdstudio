import { GUI } from './guiClass';

import { PropertyCommand } from '../commands/commands';

class PropertiesGUI extends GUI {
    constructor(editor, parentDom = document.getElementById('side_container')) {
        super({ autoPlace: false, title: 'Properties' });
        this.parentDom = parentDom;
        this.domElement.id = 'propertiesGUI';
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
            for (let key of Object.keys(object._possibleVariants)) {
                let controller = scope.add(
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

                    await object.updateModel();
                    scope.editor.gui.elements.update();
                });
            }
            let props = {
                get 'Additional NBT'(){ return object.nbt },
                set 'Additional NBT'(v){ 
                    let command = new PropertyCommand(scope.editor, object, 'nbt', v);
                    scope.editor.history.push(command);
                    command.execute();
                    scope.editor.gui.elements.update();
                    return object.nbt;
                }
            };
            let nbtController = scope.add(props, 'Additional NBT').listen();
        } else if (object.isCollection) {
            let props = {
                get 'Name'(){ return object.name },
                set 'Name'(v){ 
                    let command = new PropertyCommand(scope.editor, object, 'name', v);
                    scope.editor.history.push(command);
                    command.execute();
                    scope.editor.gui.elements.update();
                    return object.name;
                },
                get 'Additional NBT'(){ return object.nbt },
                set 'Additional NBT'(v){ 
                    let command = new PropertyCommand(scope.editor, object, 'nbt', v);
                    scope.editor.history.push(command);
                    command.execute();
                    scope.editor.gui.elements.update();
                    return object.nbt;
                }
            };
            let nameController = scope.add(props, 'Name').listen();
            let nbtController = scope.add(props, 'Additional NBT').listen();
        }

    }
}



export { PropertiesGUI };