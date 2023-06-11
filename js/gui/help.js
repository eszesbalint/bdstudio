import { GUI } from 'lil-gui';

class HelpGUI extends GUI {
    constructor(editor, parentDom = document.getElementById('side_container')) {
        super({ autoPlace: false, title: 'Controls (Help)' });
        this.parentDom = parentDom;
        this.domElement.id = 'helpGUI';
        this.parentDom.appendChild(this.domElement);
        this.editor = editor;

        const folderSelect = this.addFolder('Object operations');
        folderSelect.add({ 'Select object': 'LEFTCLICK' }, 'Select object').disable();
        folderSelect.add({ 'Select multiple': 'SHIFT + LEFTCLICK' }, 'Select multiple').disable();
        folderSelect.add({ 'Select all': 'A' }, 'Select all').disable();
        folderSelect.add({ 'Delete selected': 'DEL' }, 'Delete selected').disable();
        folderSelect.add({ 'Group / Ungroup selected': 'G' }, 'Group / Ungroup selected').disable();
        //folderSelect.add({ 'Copy selected': 'CTRL + C' }, 'Copy selected').disable();
        //folderSelect.add({ 'Paste copy': 'CTRL + V' }, 'Paste copy').disable();
        folderSelect.add({ 'Duplicate': 'D' }, 'Duplicate').disable();

        const folderCamera = this.addFolder('Camera control');
        folderCamera.add({ 'Rotate': 'LEFTMOUSEBUTTON' }, 'Rotate').disable();
        folderCamera.add({ 'Zoom': 'MIDDLEMOUSEBUTTON' }, 'Zoom').disable();
        folderCamera.add({ 'Pan': 'RIGHTMOUSEBUTTON' }, 'Pan').disable();
        folderCamera.add({ 'Othographic camera': 'O' }, 'Othographic camera').disable();

        const folderEditing = this.addFolder('Editing');
        folderEditing.add({ 'Move tool': 'T' }, 'Move tool').disable();
        folderEditing.add({ 'Rotate tool': 'R' }, 'Rotate tool').disable();
        folderEditing.add({ 'Scale tool': 'S' }, 'Scale tool').disable();
        folderEditing.add({ 'Snapping off': 'SHIFT' }, 'Snapping off').disable();
        folderEditing.add({ 'Switch transform orientation': 'Q' }, 'Switch transform orientation').disable();
    }
}

export { HelpGUI };