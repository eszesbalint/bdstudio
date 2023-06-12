import * as THREE from 'three';

import { Scene } from './scene.js';
import { Controls } from './controls.js';

import {
    ElementsGUI,
    PropertiesGUI,
    TransformsGUI,
    SearchGUI,
    CommandGUI,
    HelpGUI,
    FileToolsGUI,
    ElementToolsGUI,
    TransformToolsGUI,
    HistoryToolsGUI,
    FlipToolsGUI,
    LoadingGUI,
    MiscGUI,
} from './gui/gui.js';

import { History } from './history.js';

import {
    AddCommand,
    DeleteCommand,
    GroupCommand,
    UngroupCommand,
    DuplicateCommand,
} from './commands/commands.js';

import { BlockDisplay, Collection } from './elements/elements.js';
import { compressJSON, decompressJSON } from './utils.js';

let renderer, scene, currentCamera;

class Editor {
    scene; renderer; control; orbit;
    cameraPersp; cameraOrtho; currentCamera;
    objects; currentObject;
    clipboard = [];
    gui = {};

    constructor() {


        new Scene(this);

        this.objects = new THREE.Group();
        this.objects = new Collection(this);
        this.objects.name = 'Project';

        this.scene.add(this.objects);
        this.currentObject = this.objects;

        this.controls = new Controls(this);
        this.initGUI();
        renderer = this.renderer;
        scene = this.scene;
        currentCamera = this.currentCamera;

        this.history = new History(this);

        this.render();
    }

    initGUI() {
        this.gui = {
            elements: new ElementsGUI(this),
            properties: new PropertiesGUI(this),
            transforms: new TransformsGUI(this),
            search: new SearchGUI(this).close(),
            command: new CommandGUI(this).close(),
            tools: {
                file: new FileToolsGUI(this),
                history: new HistoryToolsGUI(this),
                element: new ElementToolsGUI(this),
                transform: new TransformToolsGUI(this),
                //flip: new FlipToolsGUI(this),
                misc: new MiscGUI(this),
            },
            help: new HelpGUI(this).close(),
            loading: new LoadingGUI(this).hide(),
        }
    }

    render() {
        renderer.render(scene, currentCamera);
    }

    get(uuid) {
        return this.objects.getObjectByProperty('uuid', uuid);
    }

    find(key, val = true) {
        return this.objects.getObjectsByProperty(key, val);
    }

    update() {

        this.gui.elements.update();
        this.gui.properties.update();
        this.gui.transforms.update();
        this.gui.command.update();
        this.render();
    }

    async undo() {
        this.gui.loading.show();
        this.control.detach();
        await this.history.undo();
        this.selectNone();
        this.update();
        this.gui.loading.hide();
    }

    async redo() {
        this.gui.loading.show();
        this.control.detach();
        await this.history.redo();
        this.selectNone();
        this.update();
        this.gui.loading.hide();
    }

    new() {
        this.scene.remove(this.objects);
        this.objects = new THREE.Group();
        this.objects = new Collection(this);
        this.objects.name = 'Project';
        this.scene.add(this.objects);
    }

    async add(blockState) {
        this.gui.loading.show(`Loading model for ${blockState}`);
        try {
            var command = new AddCommand(this, blockState);
            var blockDisplay = await command.execute();
        } catch (error) {
            alert(`Couldn't load ${blockState}!`);
            this.gui.loading.hide();
            return;
        }

        this.history.push(command);
        this.gui.loading.hide();
        return blockDisplay;
    }

    group() {
        let objectList = this.find('selected');
        if (objectList.length === 1) { this.ungroup(); return; }
        let command = new GroupCommand(this, objectList);
        this.history.push(command);
        let group = command.execute();
        group.selected = true;
        return group;
    }

    ungroup() {
        let object = this.find('selected')[0];
        if (!object.isCollection) return;
        let command = new UngroupCommand(this, object);
        this.history.push(command);
        return command.execute();
    }

    selectAll(objects) {

        if (!objects) objects = this.objects.children;

        for (let object of objects) {
            if (objects.length > 1) {
                this.controls.shiftDown = true;
                object.selected = true;
                this.controls.shiftDown = false;
            } else {
                object.selected = true;
            }
        }


    }

    selectNone() {
        //this.controls.shiftDown = true;
        for (let object of this.objects.children) {
            object.selected = false;
        }
        //this.controls.shiftDown = false;
    }

    delete() {
        let objects = this.find('selected');
        if (!objects.length) return;
        this.control.detach();
        let command = new DeleteCommand(this, objects);
        this.history.push(command);
        command.execute();
    }

    async duplicate() {
        this.gui.loading.show('Duplicating');
        let objects = this.find('selected');
        if (!objects.length) return;
        this.control.detach();
        let command = new DuplicateCommand(this, objects);
        this.history.push(command);
        objects = await command.execute();
        this.selectNone();
        this.selectAll(objects);
        this.gui.loading.hide();
    }

    generate() {
        let objects = this.find('isBlockDisplay');
        let passengers = [''];
        let counter = 0;
        let commands = [];
        for (let object of objects) {
            const passenger = `${object.toNBT()},`;
            // If command is too large, break it up into a new command
            if ((passengers[counter] + passenger).length > 32000) {
                counter++;
                passengers[counter] = '';
            }
            passengers[counter] += `${object.toNBT()},`;
        }

        for (let passenger of passengers) {
            passenger = passenger.slice(0, -1);
            const command = `/summon block_display ~-0.5 ~-0.5 ~-0.5 {Passengers:[${passenger}]}`;
            commands.push(command);
        }


        return commands;
    }

    async saveBlockDisplaysToFile() {
        let compressed = await compressJSON(this.objectsToJSON([this.objects]))
        // Create a programmatic download link
        const elem = window.document.createElement("a");
        elem.href = window.URL.createObjectURL(new Blob([compressed]));
        elem.download = `${this.objects.name}.bdstudio`;
        document.body.appendChild(elem);
        elem.click();
        document.body.removeChild(elem);


    }

    loadBlockDisplaysFromFile() {
        let scope = this;
        var input = document.createElement('input');
        input.type = 'file';

        input.onchange = e => {

            // getting a hold of the file reference
            var file = e.target.files[0];

            // setting up the reader
            var reader = new FileReader();
            reader.readAsText(file, 'UTF-8');


            // here we tell the reader what to do when it's done reading...
            reader.onload = async readerEvent => {
                var content = readerEvent.target.result; // this is the content!
                try {
                    let json = await decompressJSON(content);
                    scope.gui.loading.show(`Loading ${JSON.parse(json)[0].name}`);
                    let objects = await scope.objectsFromJSON(json);

                    scope.scene.remove(scope.objects);
                    scope.objects = objects[0];
                    scope.scene.add(scope.objects);

                    scope.update()
                    scope.gui.loading.hide();
                } catch (error) {
                    alert('File is not a valid a .bdstudio file!');
                    scope.gui.loading.hide();
                    return;
                }
            }

        }

        input.click();
    }

    objectsToJSON(objects, keepUUID = false) {
        let list = [];
        for (let child of objects) {
            if (child.isBlockDisplay || child.isCollection) {
                list.push(child.toDict(keepUUID));
            }
        }
        return JSON.stringify(list);
    }

    async objectsFromJSON(string, keepUUID = false) {
        let scope = this;
        const data = JSON.parse(string);
        let list = [];

        for (let dict of data) {
            let object;
            if (dict.children) {
                object = await Collection.fromDict(scope, dict, keepUUID);
            } else {
                object = await BlockDisplay.fromDict(scope, dict, keepUUID);
            }
            list.push(object);
        }


        return list;
    }


}

export { Editor };