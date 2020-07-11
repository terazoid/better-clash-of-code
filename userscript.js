// ==UserScript==
// @name Better Clash of Code
// @namespace https://www.codingame.com/
// @version 0.1
// @author terazoid
// @match https://www.codingame.com/*
// @grant unsafeWindow
// @run-at document-idle
// ==/UserScript==

(function() {
    'use strict';
    const _wr = function(type) {
        const orig = unsafeWindow.history[type];
        return function() {
            const rv = orig.apply(this, arguments);
            const e = new Event(type);
            e.arguments = arguments;
            unsafeWindow.dispatchEvent(e);
            return rv;
        };
    };
    unsafeWindow.history.pushState = _wr('pushState');
    unsafeWindow.history.replaceState = _wr('replaceState');

    const clashPageRegex = /^\/clashofcode\/clash\/([0-9a-f]{32,})$/;

    let lastClash = null;

    const onNavigation = async () => {
        try {
            const path = window.location.pathname;
            const clash = path.match(clashPageRegex);
            if(clash) {
                lastClash = {
                    id:clash[1],
                };
            }
            else if(path.indexOf('/ide/')===0) {
                const statementBlock = await waitForElement('.statement-bloc');
                if(lastClash) {
                    lastClash.statement = statementBlock.innerHTML;
                }
            }
            else if(lastClash && lastClash.statement && path.includes(`/clash/report/${lastClash.id}`)) {
                const buttonContainer = await waitForElement('.content-container .button-container');
                const button = createElement(
                    'button',
                    ['show-statement-button'],
                    {
                        click: () => showPopup(lastClash.statement),
                    }
                );
                button.textContent = 'problem statement';
                buttonContainer.appendChild(button);
            }
        }
        catch(err) {
            console.error(err);
        }
    };
    unsafeWindow.addEventListener('pushState', onNavigation);
    unsafeWindow.addEventListener('replaceState', onNavigation);

    setTimeout(onNavigation, 500);

    function showPopup(html) {
        const popup = createElement(
            'div',
            ['popup'],
            {
                click: (e) => e.stopPropagation(),
            }
        );
        popup.innerHTML = html;
        popup.style = 'max-width: 700px';
        const closeHandler = () => {
            document.body.removeChild(wrapper);
        };
        const container = createElement(
            'div',
            ['popup-container'],
            {
                click: closeHandler,
            }
        );
        container.appendChild(popup);
        const wrapper = createElement('div', ['cg-popup']);
        wrapper.appendChild(container);
        document.body.appendChild(wrapper);
    }
    async function waitForElement(query, timeout = 10000) {
        let delay = 100;
        const startTime = Date.now();
        do {
            const element = document.querySelector(query);
            if(element) return element;
            await sleep(delay);
            delay *= 2;
        } while(Date.now() + delay < startTime + timeout);
        throw new Error(`Element '${query}' not found`);
    }
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    function createElement(tag, classes=[], events={}){
        const element = document.createElement(tag);
        for(const className of classes) {
            element.classList.add(className);
        }
        for(const eventName in events) {
            element.addEventListener(eventName, events[eventName]);
        }
        return element;
    }

    (() => {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = `
            .show-statement-button {
              text-align: center;
              background-color: #56BC58;
              color: #454c55;
              font-size: 14px;
              font-weight: 600;
              height: 52px;
              line-height: 52px;
              text-transform: uppercase;
              border: none;
              cursor: pointer;
              padding: 0 5px;
              min-width: 200px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              transition: background .2s;
              margin: 17px 0 0;
              width: 252px;
            }
        `;
        document.getElementsByTagName('head')[0].appendChild(style);
    })();
})();
