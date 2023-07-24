import { printSceneGraph } from './utils.js';

class History {
    constructor(editor) {
        this.editor = editor;
        this._commands = [];
        this._idx = -1;
        this._isBusy = false;
    }

    push(command) {
        this._commands = this._commands.slice(0, this._idx + 1);
        this._commands.push(command);
        this._idx += 1;
        //console.log(this);
    }

    async redo() {
        if (this._isBusy) {return}
        this._isBusy = true;
        if (0 <= this._idx + 1 && this._idx + 1 < this._commands.length) {
            this._idx += 1;
            await this._commands[this._idx].execute();
            //console.log(this._commands[this._idx]);
            //printSceneGraph(this.editor.scene);
        }
        this._isBusy = false;
        
    }

    async undo() {
        if (this._isBusy) {return}
        this._isBusy = true;
        if (0 <= this._idx && this._idx < this._commands.length) {
            await this._commands[this._idx].revert();
            //console.log(this._commands[this._idx]);
            //printSceneGraph(this.editor.scene);
            this._idx -= 1;
        }
        this._isBusy = false;
    }

    clear() {
        this._isBusy = true;
        this._commands = [];
        this._idx = -1;
        this._isBusy = false;
    }
}

export { History };