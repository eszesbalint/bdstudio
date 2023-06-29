import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from './addons/TransformControls.js';

import { arrayEquals, compressJSON, decompressJSON, changeTransformControlsColors,printSceneGraph } from './utils.js';

import { TransformCommand, DuplicateCommand } from './commands/commands.js'

class Controls {
    shiftDown = false;
    ctrlDown = false;

    constructor(editor) {
        editor.orbit = new OrbitControls(editor.currentCamera, editor.renderer.domElement);
        editor.orbit.target.set(0.5, 0.5, 0.5);
        editor.orbit.update();

        editor.control = new TransformControls(editor.currentCamera, editor.renderer.domElement);
        editor.control.setTranslationSnap(1 / 16);
        editor.control.setRotationSnap(THREE.MathUtils.degToRad(15));
        editor.control.setScaleSnap(1 / 16);
        
        editor.scene.add(editor.control);

        let controls = this;

        window.addEventListener('keydown', async function (event) {

            switch (event.key) {

                case 'q': // Q
                    editor.control.setSpace(editor.control.space === 'local' ? 'world' : 'local');
                    break;

                case 'Shift': // Shift
                    editor.control.setTranslationSnap(null);
                    editor.control.setRotationSnap(null);
                    editor.control.setScaleSnap(null);
                    controls.shiftDown = true;
                    break;

                case 'Control': // Ctrl
                    controls.ctrlDown = true;
                    break;

                case 't': // T
                    editor.control.setMode('translate');
                    break;

                case 'r': // R
                    editor.control.setMode('rotate');
                    break;

                case 's': // S
                    editor.control.setMode('scale');
                    break;

                case 'o': // O
                    const position = editor.currentCamera.position.clone();

                    editor.currentCamera = editor.currentCamera.isPerspectiveCamera ? editor.cameraOrtho : editor.cameraPersp;
                    editor.currentCamera.position.copy(position);

                    editor.orbit.object = editor.currentCamera;
                    editor.control.camera = editor.currentCamera;

                    editor.currentCamera.lookAt(editor.orbit.target.x, editor.orbit.target.y, editor.orbit.target.z);
                    onWindowResize();
                    break;

                case '+': // +, =, num+
                    editor.control.setSize(editor.control.size + 0.1);
                    break;

                case 189:
                case '-': // -, _, num-
                    editor.control.setSize(Math.max(editor.control.size - 0.1, 0.1));
                    break;

                case 'x': // X
                    editor.control.showX = !editor.control.showX;
                    break;

                case 'y': // Y

                    if (event.ctrlKey) {
                        editor.redo();
                    } else {
                        editor.control.showY = !editor.control.showY;
                    }
                    break;

                case 'z': // Z
                    if (event.ctrlKey) {
                        editor.undo();
                    } else {
                        editor.control.showZ = !editor.control.showZ;
                    }
                    break;

                case 'Delete': // Del
                    editor.control.detach();
                    editor.delete();
                    editor.update();
                    break;

                case 'c': // C
                    if (controls.ctrlDown) {
                        //    let objects = editor.find('selected');
                        //    editor.clipboard = editor.objectsToJSON(objects, false);
                    }
                    break;

                case 'v': // V
                    if (controls.ctrlDown) {
                        //this.gui.loading.show('Pasting');
                        //let objects = await this.editor.objectsFromJSON(editor.clipboard, false);
                        //this.control.detach();
                        //let command = new DuplicateCommand(this, objects);
                        //this.history.push(command);
                        //await command.execute();
                        //this.gui.loading.hide();
                    }
                    break;

                case 'd': // D
                    editor.duplicate();
                    editor.update();
                    break;

                case 'g': // G
                    editor.control.detach();
                    editor.group();
                    editor.update();

                    break;

                case 'a': // A
                    if (controls.ctrlDown) {
                        editor.selectAll();

                    }
                    editor.update();

                    break;

            };

        });

        window.addEventListener('keyup', function (event) {

            switch (event.key) {

                case 'Shift': // Shift
                    editor.control.setTranslationSnap(1 / 16);
                    editor.control.setRotationSnap(THREE.MathUtils.degToRad(15));
                    editor.control.setScaleSnap(1 / 16);
                    controls.shiftDown = false;
                    break;

                case 'Control': // Ctrl
                    controls.ctrlDown = false;
                    break;

            }

        });

        editor.orbit.addEventListener('change', editor.render);

        editor.control.addEventListener('change', function (event) {
            // Limit the scaling of collection to a uniform scaling
            // while keeping the ability to flip along axes
            let object = editor.control.object;
            if (editor.control.mode === 'scale' && object) {
                const x = object.scale.x;
                const y = object.scale.y;
                const z = object.scale.z;
                const xA = Math.abs(x);
                const yA = Math.abs(y);
                const zA = Math.abs(z);
                if (object.isCollection) {
                    switch (editor.control.axis) {
                        case 'X':
                            object.scale.set(xA, xA, xA);
                            break;
                        case 'Y':
                            object.scale.set(yA, yA, yA);
                            break;
                        case 'Z':
                            object.scale.set(zA, zA, zA);
                            break;
                    }

                } else if (object.isBlockDisplay || object.isItemDisplay) {
                    object.scale.set(xA, yA, zA);
                }
                object.updateMatrix();
            }

        });

        editor.control.addEventListener('change', editor.render);



        let transformCommand;

        editor.control.addEventListener('mouseDown', function (event) {
            transformCommand = new TransformCommand(editor, editor.control.object);
            editor.control.object.updateMatrix();
            transformCommand.beforeMatrix = editor.control.object.matrix.clone();
        });

        editor.control.addEventListener('mouseUp', function (event) {
            editor.control.object.updateMatrix();
            transformCommand.afterMatrix = editor.control.object.matrix.clone();
            editor.history.push(transformCommand);
            editor.gui.command.update();
        });

        editor.control.addEventListener('dragging-changed', function (event) {

            editor.orbit.enabled = !event.value;

        });

        let mouse;

        editor.renderer.domElement.addEventListener('mousedown', function (event) {
            mouse = [event.clientX, event.clientY];
        });


        editor.renderer.domElement.addEventListener('mouseup', function (event) {
            let canvas = editor.renderer.domElement;
            let rect = canvas.getBoundingClientRect();

            let prevMouse = mouse;
            mouse = [event.clientX, event.clientY];
            if (!arrayEquals(prevMouse, mouse)) return;

            let mouseVector = new THREE.Vector2(
                 ((event.clientX - rect.left) / canvas.width) * 2 - 1,
                -((event.clientY - rect.top) / canvas.height) * 2 + 1
                );

            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouseVector, editor.currentCamera);
            var intersects = raycaster.intersectObjects(editor.objects.children, true);
            for (let intersection of intersects) {
                let object = intersection.object;
                if (object.isBoundingBox) {
                    continue;
                } else {
                    while (object.parent && !(object.parent === editor.objects) && !(object.parent.selected && object.parent.isCollection)) {
                        object = object.parent;
                    }
                    object.selected = true;
                    return;
                }

            }

            for (let object of editor.find('selected')) {
                object.selected = false;
            }
        });

        window.addEventListener('resize', function (event) {
            //let canvas = editor.renderer.domElement;
            //canvas.width = editor.domElement.clientWidth;
            //canvas.height = editor.domElement.clientHeight;
            const aspect = editor.domElement.clientWidth / editor.domElement.clientHeight;

            editor.cameraPersp.aspect = aspect;
            editor.cameraPersp.updateProjectionMatrix();

            editor.cameraOrtho.left = editor.cameraOrtho.bottom * aspect;
            editor.cameraOrtho.right = editor.cameraOrtho.top * aspect;
            editor.cameraOrtho.updateProjectionMatrix();

            editor.renderer.setSize(editor.domElement.clientWidth, editor.domElement.clientHeight);

            editor.render();
        });

        window.addEventListener("load", async function (e) {
            editor.gui.loading.hide();
            editor.gui.version.showModal();
        });
        window.addEventListener("beforeunload", async function (e) {
            localStorage.setItem(
                'blockDisplayObjects',
                await compressJSON(
                    editor.objectsToJSON([editor.objects])
                )
            );
        });
    }
}

export { Controls };