import { Editor } from './js/editor.js';


try {
    var editor = new Editor(document.getElementById('editor'));
} catch (error) {
    console.log(error);
    console.log(editor);
}
