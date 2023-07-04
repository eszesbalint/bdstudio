import * as THREE from 'three';
import { GUI } from './gui/guiClass.js';

import { Scene } from './scene.js';
import { Controls } from './controls.js';

import {
    ElementsGUI,
    PropertiesGUI,
    TransformsGUI,
    BlockSearchGUI, ItemSearchGUI,
    CommandGUI,
    HelpGUI,
    VersionGUI,
    DonateGUI,
    FileToolsGUI,
    ElementToolsGUI,
    TransformToolsGUI,
    HistoryToolsGUI,
    FlipToolsGUI,
    LoadingGUI,
    MiscGUI,
    VersionToolsGUI,
    ExportToolsGUI,
} from './gui/gui.js';

import { History } from './history.js';

import {
    AddCommand,
    DeleteCommand,
    GroupCommand,
    UngroupCommand,
    DuplicateCommand,
} from './commands/commands.js';

import { BlockDisplay, ItemDisplay, Collection } from './elements/elements.js';
import { assetsPath } from './elements/BlockDisplay.js';
import { compressJSON, decompressJSON } from './utils.js';

let renderer, scene, currentCamera, viewHelper, viewHelperRenderer;

class Editor {
    scene; renderer; control; orbit;
    cameraPersp; cameraOrtho; currentCamera;
    viewHelper;
    objects; currentObject;
    clipboard = [];
    gui = {};

    constructor(domElement) {

        this.domElement = domElement;
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
        viewHelper = this.viewHelper;
        viewHelperRenderer = this.viewHelperRenderer;

        this.history = new History(this);

        this.render();
    }

    initGUI() {
        const top_tool_strip = document.getElementById('top_tool_strip');
        const left_tool_strip = document.getElementById('left_tool_strip');
        const top_container = document.getElementById('top_container');
        const right_tool_strip = document.getElementById('right_tool_strip');
        const side_container = document.getElementById('side_container');

        
        

        let project = new GUI(this,{ autoPlace: false, title: 'Elements', container: side_container });
        //side_container.appendChild(project.domElement);
        let elementTools = new ElementToolsGUI(this,{autoplace: false, title: '', parent: project});
        let elements = new ElementsGUI(this,{autoplace: false, title: 'Elements', parent: project});
        
        
        
        
        let properties = new PropertiesGUI(this,{ autoPlace: false, title: 'Properties', container: side_container });
        let transforms = new TransformsGUI(this,{ autoPlace: false, title: 'Transforms', container: side_container });
        

        let versionTools = new VersionToolsGUI(this,{autoplace: false, title: '', container: top_tool_strip});
        let fileTools = new FileToolsGUI(this,{autoplace: false, title: '', container: top_tool_strip});
        let historyTools = new HistoryToolsGUI(this,{autoplace: false, title: '', container: top_tool_strip});
        let exportTools = new ExportToolsGUI(this,{autoplace: false, title: '', container: top_tool_strip});

        let blockSearch = new BlockSearchGUI(this,{autoplace: false, title: 'Block search', container: this.domElement});
        let itemSearch = new ItemSearchGUI(this,{autoplace: false, title: 'Item search', container: this.domElement});
        let help = new HelpGUI(this,{ autoPlace: false, title: 'Help', container: this.domElement });

        let command = new CommandGUI(this,{autoplace: false, title: 'Command', container: this.domElement});
        let version = new VersionGUI(this,{autoplace: false, title: 'Welcome to BDStudio!', container: this.domElement});
        let donate = new DonateGUI(this,{autoplace: false, title: 'Enjoy using BDStudio?', container: this.domElement});

        let transform = new TransformToolsGUI(this,{autoplace: false, title: '', container: left_tool_strip}, true);
        let misc = new MiscGUI(this, {autoplace: false, title: '', container: top_tool_strip}, false);
        let loading = new LoadingGUI(this).show('BDStudio');

        this.gui = {
            elementTools: elementTools, 
            blockSearch: blockSearch,
            itemSearch: itemSearch,
            elements: elements,
            properties: properties,
            transforms: transforms,
            help: help,
            versionTools: versionTools, 
            fileTools: fileTools, 
            historyTools: historyTools, 
            exportTools: exportTools, 
            misc: misc, 
            command: command, 
            version: version,
            donate: donate,
            transform: transform, 
            loading: loading, 
        }
    }

    render() {
        renderer.render(scene, currentCamera);
        viewHelper.render(viewHelperRenderer);
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

    async add(identifier, type, parent) {
        this.gui.loading.show(`Loading model for ${identifier}`);
        try {
            var command = new AddCommand(this, identifier, type, parent);
            var display = await command.execute();
        } catch (error) {
            alert(`Couldn't load ${identifier}!`);
            this.gui.loading.hide();
            return;
        }

        this.history.push(command);
        this.gui.loading.hide();
        return display;
    }

    group() {
        let objectList = this.find('selected');
        if (objectList.length === 0) return;
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
        this.selectNone();

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
        for (let object of this.find('selected')) {
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
        let objects = this.find('isDisplay');
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
                    console.log(error);
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
            if (child.isBlockDisplay || child.isItemDisplay || child.isCollection) {
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
            if (dict.children || dict.isCollection) {
                object = await Collection.fromDict(scope, dict, keepUUID);
            } else if (dict.isBlockDisplay) {
                object = await BlockDisplay.fromDict(scope, dict, keepUUID);
            } else if (dict.isItemDisplay) {
                object = await ItemDisplay.fromDict(scope, dict, keepUUID);
            } else {
                object = await BlockDisplay.fromDict(scope, dict, keepUUID);
            }
            list.push(object);
        }


        return list;
    }


}

export { Editor };