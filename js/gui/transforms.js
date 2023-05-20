import { GUI } from 'lil-gui';

class TransformsGUI extends GUI {
    constructor(editor, parentDom = document.getElementById('side_container')) {
        super({ autoPlace: false, title: 'Transforms' });
        this.parentDom = parentDom;
        this.domElement.id = 'transformsGUI';
        this.parentDom.appendChild(this.domElement);
        this.editor = editor;

        const folderPosition = this.addFolder('Position');
        const propsPosition = {

            get 'X'() {

                return editor.currentObject.position.x;

            },
            set 'X'(v) {

                editor.currentObject.position.setX(v);
                editor.render();

            },

            get 'Y'() {

                return editor.currentObject.position.y;

            },
            set 'Y'(v) {

                editor.currentObject.position.setY(v);
                editor.render();

            },

            get 'Z'() {

                return editor.currentObject.position.z;

            },
            set 'Z'(v) {

                editor.currentObject.position.setZ(v);
                editor.render();

            },

        };
        folderPosition.add(propsPosition, 'X', -1, 1, 1 / 16).listen();
        folderPosition.add(propsPosition, 'Y', -1, 1, 1 / 16).listen();
        folderPosition.add(propsPosition, 'Z', -1, 1, 1 / 16).listen();

        const folderRotation = this.addFolder('Rotation');
        const propsRotation = {

            get 'X'() {

                return editor.currentObject.rotation.x;

            },
            set 'X'(v) {

                editor.currentObject.rotation.x = v;
                editor.render();

            },

            get 'Y'() {

                return editor.currentObject.rotation.y;

            },
            set 'Y'(v) {

                editor.currentObject.rotation.y = v;
                editor.render();

            },

            get 'Z'() {

                return editor.currentObject.rotation.z;

            },
            set 'Z'(v) {

                editor.currentObject.rotation.z = v;
                editor.render();

            },

        };
        folderRotation.add(propsRotation, 'X', -Math.PI, Math.PI, Math.PI / 12).listen();
        folderRotation.add(propsRotation, 'Y', -Math.PI, Math.PI, Math.PI / 12).listen();
        folderRotation.add(propsRotation, 'Z', -Math.PI, Math.PI, Math.PI / 12).listen();

        const folderScale = this.addFolder('Scale');
        const propsScale = {

            get 'X'() {

                return editor.currentObject.scale.x;

            },
            set 'X'(v) {

                editor.currentObject.scale.setX(v);
                editor.render();

            },

            get 'Y'() {

                return editor.currentObject.scale.y;

            },
            set 'Y'(v) {

                editor.currentObject.scale.setY(v);
                editor.render();

            },

            get 'Z'() {

                return editor.currentObject.scale.z;

            },
            set 'Z'(v) {

                editor.currentObject.scale.setZ(v);
                editor.render();

            },

        };
        folderScale.add(propsScale, 'X', 0, 1, 1 / 16).listen();
        folderScale.add(propsScale, 'Y', 0, 1, 1 / 16).listen();
        folderScale.add(propsScale, 'Z', 0, 1, 1 / 16).listen();
    }


}

export { TransformsGUI };