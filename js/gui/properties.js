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

        } else if (object.isTextDisplay) {
            let props = {
                get 'text'(){ return object.text },
                set 'text'(v){ 
                    toHistory(function () {
                        object.text = v;
                    }, scope.editor, object, 'text', v);
                    return object.text;
                },
                get 'text color'(){ return object.options.color },
                set 'text color'(v){
                    let after = JSON.parse(JSON.stringify(object.options));
                    after.color = v;
                    toHistory(function () {
                        object.options = after;
                    }, scope.editor, object, 'options', after);
                    return object.options.color;
                },
                get 'text alpha'(){ return object.options.alpha },
                set 'text alpha'(v){
                    let after = JSON.parse(JSON.stringify(object.options));
                    after.alpha = v;
                    toHistory(function () {
                        object.options = after;
                    }, scope.editor, object, 'options', after);
                    return object.options.alpha;
                },
                get 'background color'(){ return object.options.backgroundColor },
                set 'background color'(v){
                    let after = JSON.parse(JSON.stringify(object.options));
                    after.backgroundColor = v;
                    toHistory(function () {
                        object.options = after;
                    }, scope.editor, object, 'options', after);
                    return object.options.backgroundColor;
                },
                get 'background alpha'(){ return object.options.backgroundAlpha },
                set 'background alpha'(v){
                    let after = JSON.parse(JSON.stringify(object.options));
                    after.backgroundAlpha = v;
                    toHistory(function () {
                        object.options = after;
                    }, scope.editor, object, 'options', after);
                    return object.options.backgroundAlpha;
                },
                get 'bold'(){ return object.options.bold },
                set 'bold'(v){
                    let after = JSON.parse(JSON.stringify(object.options));
                    after.bold = v;
                    toHistory(function () {
                        object.options = after;
                    }, scope.editor, object, 'options', after);
                    return object.options.bold;
                },
                get 'italic'(){ return object.options.italic },
                set 'italic'(v){
                    let after = JSON.parse(JSON.stringify(object.options));
                    after.italic = v;
                    toHistory(function () {
                        object.options = after;
                    }, scope.editor, object, 'options', after);
                    return object.options.italic;
                },
                get 'underline'(){ return object.options.underline },
                set 'underline'(v){
                    let after = JSON.parse(JSON.stringify(object.options));
                    after.underline = v;
                    toHistory(function () {
                        object.options = after;
                    }, scope.editor, object, 'options', after);
                    return object.options.underline;
                },
                get 'strike through'(){ return object.options.strikeThrough },
                set 'strike through'(v){
                    let after = JSON.parse(JSON.stringify(object.options));
                    after.strikeThrough = v;
                    toHistory(function () {
                        object.options = after;
                    }, scope.editor, object, 'options', after);
                    return object.options.strikeThrough;
                },
                get 'line length'(){ return object.options.lineLength },
                set 'line length'(v){
                    let after = JSON.parse(JSON.stringify(object.options));
                    after.lineLength = v;
                    toHistory(function () {
                        object.options = after;
                    }, scope.editor, object, 'options', after);
                    return object.options.lineLength;
                },
                get 'align'(){ return object.options.align },
                set 'align'(v){
                    let after = JSON.parse(JSON.stringify(object.options));
                    after.align = v;
                    toHistory(function () {
                        object.options = after;
                    }, scope.editor, object, 'options', after);
                    return object.options.align;
                },
                get 'additional NBT'(){ return object.nbt },
                set 'additional NBT'(v){ 
                    toHistory(function () {
                        object.nbt = v;
                    }, scope.editor, object, 'nbt', v);
                    return object.nbt;
                }
            }

            scope.add(props, 'text').listen();
            scope.add(props, 'line length').listen();
            scope.add(props, 'align', ['left', 'center', 'right']).listen();

            const colorFolder = scope.addFolder('Colors');
            colorFolder.addColor(props, 'text color').listen();
            colorFolder.add(props, 'text alpha', 0.0, 1.0).listen();
            colorFolder.addColor(props, 'background color').listen();
            colorFolder.add(props, 'background alpha', 0.0, 1.0).listen();

            const effetctFolder = scope.addFolder('Effects');
            effetctFolder.add(props, 'bold').listen();
            effetctFolder.add(props, 'italic').listen();
            effetctFolder.add(props, 'underline').listen();
            effetctFolder.add(props, 'strike through').listen();

            const folder = scope.addFolder('NBT');
            folder.add(props, 'additional NBT').listen();
            //folder.add(props, 'apply to children').listen();

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

let toHistory = function (func, editor, object, property, value) {
    let command = new PropertyCommand(editor, object, property, value);

    command.beforeValue = JSON.parse(JSON.stringify(object[property]));

    func();

    //command.afterValue = value;
    editor.history.push(command);
    command.execute();
}

export { PropertiesGUI };