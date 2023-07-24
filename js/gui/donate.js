import { DialogGUI } from './dialog.js';
import { ToolsGUI } from './tools.js';

import { decompressJSON } from '../utils.js';

export class DonateGUI extends DialogGUI {
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
                <h1>BDStudio is <span style="color: var(--spring-green)">free to use</span>, but <span style="color: var(--rose)">not free to make</span></h1>
                <p>
                    Creating software takes time and dedication. 
                    As a recognition of my efforts, please consider supporting the project so development can continue.
                </p>
                
            </div>
            <div class="logo">
                <img src="images/donate_256x256.png">
            </div>
        `;
        scope.domElement.appendChild(titleCard);

        let functions = [
            {
                'title': 'Donate via PayPal',
                'tooltip': 'Donate via PayPal',
                'icon': 'paypal',
                'function': async function () {
                    window.open('https://www.paypal.com/donate/?hosted_button_id=QRUUJ7CHMW25J', '_blank');
                    scope.hideModal();
                    localStorage.setItem('clickedDonate', 'true');
                },
            },
            {
                'title': 'I do not wish to donate',
                'tooltip': 'I do not wish to donate',
                'icon': 'emoji-frown-fill',
                'function': async function () {
                    scope.hideModal();
                    localStorage.setItem('clickedDonate', 'false');
                },
            },
            
        ];
        
        let tools = new ToolsGUI(this.editor,functions,{autoplace: false, title: '', parent: scope});

        if (localStorage.getItem('clickedDonate') === 'false' || localStorage.getItem('clickedDonate') === null) {
            setTimeout(() => {
                scope.showModal();
            }, 30000);
        }
    }
}

