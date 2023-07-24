import { GUI } from './guiClass.js';
import { ModalGUI } from './dialog.js';
import { ToolsGUI } from './tools.js';

class CommandGUI extends ModalGUI {
    constructor(editor, args) {
        super(editor, args);

        this.domElement.classList.add('commandGUI');

        this.onOpenClose(changedGUI => {
            changedGUI.update();
        });

        this.update();
    }

    async update() {
        this.empty();
        let scope = this;

        let titleCard = document.createElement('div');
        titleCard.classList.add('titleCard');
        titleCard.classList.add('donate');
        titleCard.innerHTML = `
            <div class="description">
                <h1>Export  <span style="color: var(--rose)">${scope.editor.objects.name}</span> to <span style="color: var(--spring-green)">Minecraft</span></h1>
                <p>
                    Copy the commands below and paste them inside a command block in Minecraft. Execute them one by one. You can also export it as an .mcfunction file and put it in a datapack!
                </p>
                
            </div>
            <div class="logo">
                <img src="images/export_256x256.png">
            </div>
        `;
        

        //let commandFolder = new GUI(scope.editor, {autoplace: false, title: 'Summon Commands', parent: scope});
        let commands = this.editor.generate();
        commands.forEach(function (value, i) {
            let prop = {
                get 'command'() { return value },
                set 'command'(v) { return value }
            }
            let name = commands.length===1 ? 'Command':`Command ${i+1}`;
            let controller = scope.add(prop, 'command').name(name);
            let id = controller.domElement.getElementsByClassName('name')[0].id;
            
            let buttonHTML = `<div class="widget"><button><div class="name" id="lil-gui-name-2582">
            
            <i class="bi bi-files" style="color: inherit;">
                    
            </i>
            <span>Copy</span>
            
            </div></button></div>`;
            let button = createElementFromHTML(buttonHTML);
            controller.domElement.appendChild(button);
            controller.domElement.getElementsByClassName('widget')[0].getElementsByTagName('input')[0].value = value;
            controller.domElement.getElementsByTagName('button')[0].addEventListener('click', function () {
                navigator.clipboard.writeText(value);
            });
        });

        scope.domElement.insertBefore(titleCard, scope.domElement.lastChild);

        let functions = [
            {
                'title': `Save ${scope.editor.objects.name}`,
                'tooltip': `Save ${scope.editor.objects.name}`,
                'icon': 'save',
                'function': async function () {
                    editor.saveBlockDisplaysToFile();
                },
            },
            {
                'title': `Export ${scope.editor.objects.name} as mcfunction`,
                'tooltip': `Export ${scope.editor.objects.name} as mcfunction`,
                'icon': 'file-earmark-code',
                'function': async function () {
                    scope.editor.exportMcfunction();
                },
            },
            
        ];
        
        let tools = new ToolsGUI(this.editor,functions,{autoplace: false, title: '', parent: scope});
            
    }
}

function createElementFromHTML(htmlString) {
    var div = document.createElement('div');
    div.innerHTML = htmlString.trim();
  
    // Change this to div.childNodes to support multiple top-level nodes.
    return div.firstChild;
  }

export { CommandGUI };