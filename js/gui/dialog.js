import { GUI } from './guiClass.js';

export class ModalGUI extends GUI {
    constructor(editor, args) {
        super(editor, args);
        
        this.dialogDom = document.createElement('div');
        this.dialogDom.classList.add('dialog');
        this.parentDom.appendChild(this.dialogDom);
        this.dialogDom.appendChild(this.domElement);
        this.$title.innerHTML = `
            <span>${this._title}</span>
        `;

        let scope = this;

        this.dialogDom.addEventListener("click", function(e) {
            if (e.target !== this)
                return;
            scope.hideModal();
        });

        this.hideModal();
    }

    showModal() {
        this.dialogDom.classList.remove('hidden');
        this.open();
    }

    hideModal() {
        this.dialogDom.classList.add('hidden');
    }
}

export class DialogGUI extends GUI {
    constructor(editor, args) {
        super(editor, args);
        
        this.dialogDom = document.createElement('div');
        this.dialogDom.classList.add('dialog');
        this.parentDom.appendChild(this.dialogDom);
        this.dialogDom.appendChild(this.domElement);
        this.$title.innerHTML = `
            <span>${this._title}</span>
        `;

        let scope = this;

        this.hideModal();
    }

    showModal() {
        this.dialogDom.classList.remove('hidden');
        this.open();
    }

    hideModal() {
        this.dialogDom.classList.add('hidden');
    }
}
