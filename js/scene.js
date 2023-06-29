import * as THREE from 'three';

import { InfiniteGridHelper } from './addons/InfiniteGridHelper';

import { Collection } from './elements/elements.js';

import { red, green, blue, yellow } from './gui/colors.js';

class Scene {
    constructor( editor ) {
        let canvas = document.getElementById('canvas');
        editor.renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
        editor.renderer.setPixelRatio(window.devicePixelRatio);
        canvas.width = editor.domElement.clientWidth;
        canvas.height = editor.domElement.clientHeight;
        editor.renderer.setSize(canvas.width, canvas.height);
        //document.body.appendChild(editor.renderer.domElement);

        const aspect = canvas.width / canvas.height;

        editor.cameraPersp = new THREE.PerspectiveCamera(50, aspect, 0.01, 30000);
        editor.cameraOrtho = new THREE.OrthographicCamera(- 6 * aspect, 6 * aspect, 6, - 6, 0.0001, 30000);
        editor.currentCamera = editor.cameraPersp;

        editor.currentCamera.position.set(-3, 3, -3);
        editor.currentCamera.lookAt(0, 0, 0);

        editor.scene = new THREE.Scene();
        editor.scene.background = new THREE.Color(0x111111)

        // Adding grid helper
        // const grid = new InfiniteGridHelper(4, 64, new THREE.Color(0.2, 0.2, 0.2));
        // grid.material.alphaTest = 0.5;
        // grid.scale.set(1 / 64, 1 / 64, 1 / 64);
        // grid.position.set(0, -0.001, 0);
        // editor.scene.add(grid);
        const gridHelper = new THREE.GridHelper( 16*16, 16*16, 0x222222, 0x222222);
        gridHelper.position.set(0,-0.000001,0);
        editor.scene.add( gridHelper );


        // Adding axes helper
        const axesHelper1 = new THREE.AxesHelper(500);
        axesHelper1.setColors(red, green, blue);
        const axesHelper2 = new THREE.AxesHelper(-500);
        axesHelper2.setColors(red, green, blue);
        editor.scene.add(axesHelper1);
        editor.scene.add(axesHelper2);

        // Adding box helper
        const box = new THREE.Box3();
        box.setFromCenterAndSize(new THREE.Vector3(0.5, 0.5, 0.5), new THREE.Vector3(0.9999, 0.9999, 0.9999));
        const helper = new THREE.Box3Helper(box, 0x444444);
        editor.scene.add(helper);

        // Lights

        editor.scene.add(new THREE.AmbientLight(0xCCCCCC));
        const light = new THREE.DirectionalLight(0xffffff, 0.5);
        light.position.set(1, 1.5, 0.5);
        editor.scene.add(light);



        
        

        

        

        

        
    }
}

export { Scene }