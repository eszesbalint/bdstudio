import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

import { arrayEquals, compressJSON, decompressJSON } from './utils.js';

class Controls {
    shiftDown = false;
    ctrlDown = false;

    constructor(editor) {
        editor.orbit = new OrbitControls(editor.currentCamera, editor.renderer.domElement);
        //editor.orbit.update();

        editor.control = new TransformControls(editor.currentCamera, editor.renderer.domElement);
        editor.control.setTranslationSnap(1 / 16);
        editor.control.setRotationSnap(THREE.MathUtils.degToRad(15));
        editor.control.setScaleSnap(1 / 16);
        editor.scene.add(editor.control);
        
        let controls = this;

        window.addEventListener('keydown', async function (event) {

            switch (event.keyCode) {

                case 81: // Q
                    editor.control.setSpace(editor.Controlscontrol.space === 'local' ? 'world' : 'local');
                    break;

                case 16: // Shift
                    editor.control.setTranslationSnap(null);
                    editor.control.setRotationSnap(null);
                    editor.control.setScaleSnap(null);
                    controls.shiftDown = true;
                    break;

                case 17: // Ctrl
                    controls.ctrlDown = true;
                    break;

                case 84: // T
                    editor.control.setMode('translate');
                    break;

                case 82: // R
                    editor.control.setMode('rotate');
                    break;

                case 83: // S
                    editor.control.setMode('scale');
                    break;

                case 79: // O
                    const position = editor.currentCamera.position.clone();

                    editor.currentCamera = editor.currentCamera.isPerspectiveCamera ? editor.cameraOrtho : editor.cameraPersp;
                    editor.currentCamera.position.copy(position);

                    editor.orbit.object = editor.currentCamera;
                    editor.control.camera = editor.currentCamera;

                    editor.currentCamera.lookAt(editor.orbit.target.x, editor.orbit.target.y, editor.orbit.target.z);
                    onWindowResize();
                    break;

                case 107: // +, =, num+
                    editor.control.setSize(editor.control.size + 0.1);
                    break;

                case 189:
                case 109: // -, _, num-
                    editor.control.setSize(Math.max(editor.control.size - 0.1, 0.1));
                    break;

                case 88: // X
                    editor.control.showX = !editor.control.showX;
                    break;

                case 89: // Y
                    editor.control.showY = !editor.control.showY;
                    break;

                case 90: // Z
                    editor.control.showZ = !editor.control.showZ;
                    break;

                case 32: // Spacebar
                    editor.control.enabled = !editor.control.enabled;
                    break;

                case 27: // Esc
                    editor.control.reset();
                    break;

                case 46: // Del
                    editor.deleteBlockDisplay();
                    editor.gui.elements.update();
                    editor.render();
                    break;

                case 67: // C
                    if (controls.ctrlDown) {
                        let selected = editor.objects.getObjectsByProperty('selected', true);
                        if (selected.length) {
                            editor.clipboard = await editor.duplicateBlockDisplay(selected, false);
                        }
                    }
                    break;

                case 86: // V
                    if (controls.ctrlDown) {
                        const duplicates = await editor.duplicateBlockDisplay(editor.clipboard);
                        editor.selectBlockDisplay();
                        for (let object of duplicates) {
                            object.selected = true;
                        }
                        editor.gui.elements.update();
                        editor.render();
                    }
                    break;

                case 71: // G

                    editor.toggleGrouping();
                    editor.gui.elements.update();
                    editor.render();

                    break;

                case 65: // A


                    for (let object of editor.objects.children) {
                        object.selected = true;
                    }
                    editor.render();

                    break;

            };

        });

        window.addEventListener('keyup', function (event) {

            switch (event.keyCode) {

                case 16: // Shift
                    editor.control.setTranslationSnap(1 / 16);
                    editor.control.setRotationSnap(THREE.MathUtils.degToRad(15));
                    editor.control.setScaleSnap(1 / 16);
                    controls.shiftDown = false;
                    break;

                case 17: // Ctrl
                    controls.ctrlDown = false;
                    break;

            }

        });

        editor.orbit.addEventListener('change', editor.render);

        editor.control.addEventListener('change', editor.render);

        editor.control.addEventListener('dragging-changed', function (event) {

            editor.orbit.enabled = !event.value;

        });

        let mouse;

        editor.renderer.domElement.addEventListener('mousedown', function (event) {
            mouse = [event.clientX, event.clientY];
        });


        editor.renderer.domElement.addEventListener('mouseup', function (event) {
            let prevMouse = mouse;
            mouse = [event.clientX, event.clientY];
            if (!arrayEquals(prevMouse, mouse)) { return };

            let mouseVector = new THREE.Vector2((event.clientX / window.innerWidth) * 2 - 1,
                -(event.clientY / window.innerHeight) * 2 + 1);

            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouseVector, editor.currentCamera);
            var intersects = raycaster.intersectObjects(editor.objects.children, true);
            for (let intersection of intersects) {
                let object = intersection.object;
                if (object.isBoundingBox) {
                    continue;
                } else {
                    while (!(object.parent === editor.objects)) {
                        object = object.parent;
                    }
                    editor.selectBlockDisplay(object);
                    editor.gui.elements.update();
                    editor.render();
                    return;
                }

            }

            editor.selectBlockDisplay();
            editor.gui.elements.update();
            editor.render();
        });

        window.addEventListener('resize', function (event) {
            const aspect = window.innerWidth / window.innerHeight;

            editor.cameraPersp.aspect = aspect;
            editor.cameraPersp.updateProjectionMatrix();

            editor.cameraOrtho.left = editor.cameraOrtho.bottom * aspect;
            editor.cameraOrtho.right = editor.cameraOrtho.top * aspect;
            editor.cameraOrtho.updateProjectionMatrix();

            editor.renderer.setSize(window.innerWidth, window.innerHeight);

            editor.render();
        });

        window.addEventListener("load", async function (e) {
            let json = await decompressJSON(localStorage.getItem('blockDisplayObjects'));
            await editor.objectsFromJSON(json);
            editor.render();
            editor.gui.elements.update();
        });
        window.addEventListener("beforeunload", async function (e) {
            localStorage.setItem('blockDisplayObjects', await compressJSON(editor.objectsToJSON()));
        });
    }
}

export { Controls };