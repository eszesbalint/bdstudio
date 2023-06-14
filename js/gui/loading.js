class LoadingGUI {
    constructor(editor, parentDom = editor.domElement) {
        this.editor = editor;
        this.domElement = document.createElement('div');
        this.domElement.id = 'loading';

        let spinner = document.createElement('div');
        spinner.classList.add('custom-loader');
        this.domElement.appendChild(spinner);

        this.text = document.createElement('span');
        this.domElement.appendChild(this.text);

        parentDom.appendChild(this.domElement);
        this.show();
    }

    hide() {
        this.domElement.style.visibility = 'hidden';
        return this;
    }

    show(text='') {
        this.domElement.style.visibility = 'visible';
        this.text.innerHTML = text;
        return this;
    }
}

export { LoadingGUI };