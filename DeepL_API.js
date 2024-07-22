// ==UserScript==
// @name         DeepL Translator with Ctrl + Selection and Draggable Popup
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Translate selected text using DeepL API with confirmation and draggable popup only when Ctrl is held
// @author       Your Name
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // Add CSS for the translation popup and confirmation prompt
    GM_addStyle(`
        #deepl-translation-popup, #deepl-confirmation-popup {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: white;
            border: 1px solid black;
            padding: 10px;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.5);
            cursor: move;
        }
        #deepl-confirmation-popup button {
            margin: 5px;
        }
    `);

    // Function to make an element draggable
    function makeDraggable(element) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        element.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    // Function to create the translation popup
    function createPopup(text, id = 'deepl-translation-popup') {
        let popup = document.createElement('div');
        popup.id = id;
        popup.textContent = text;
        document.body.appendChild(popup);
        makeDraggable(popup);
    }

    // Function to create the confirmation popup
    function createConfirmationPopup(text, onConfirm, onCancel) {
        let popup = document.createElement('div');
        popup.id = 'deepl-confirmation-popup';
        popup.innerHTML = `<p>${text}</p><button id="deepl-confirm-yes">Yes</button><button id="deepl-confirm-no">No</button>`;
        document.body.appendChild(popup);
        makeDraggable(popup);

        document.getElementById('deepl-confirm-yes').addEventListener('click', function() {
            onConfirm();
            removePopup('deepl-confirmation-popup');
        });

        document.getElementById('deepl-confirm-no').addEventListener('click', function() {
            onCancel();
            removePopup('deepl-confirmation-popup');
        });
    }

    // Function to remove the popup
    function removePopup(id = 'deepl-translation-popup') {
        let popup = document.getElementById(id);
        if (popup) {
            popup.remove();
        }
    }

    // Function to handle the translation
    function translateText(text) {
        const apiKey = 'YOUR_DEEPL_API_KEY';
        const url = 'https://api-free.deepl.com/v2/translate';
        const targetLang = 'PL'; // Change this to your target language

        GM_xmlhttpRequest({
            method: 'POST',
            url: url,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: `auth_key=${apiKey}&text=${encodeURIComponent(text)}&target_lang=${targetLang}`,
            onload: function(response) {
                let result = JSON.parse(response.responseText);
                if (result.translations && result.translations.length > 0) {
                    let translatedText = result.translations[0].text;
                    removePopup();
                    createPopup(translatedText);
                } else {
                    console.error('Translation failed:', result);
                }
            },
            onerror: function() {
                console.error('Request failed');
            }
        });
    }

    // Event listener for text selection with Ctrl key
    document.addEventListener('mouseup', function(event) {
        if (event.ctrlKey) {
            let selectedText = window.getSelection().toString().trim();
            if (selectedText.length > 0) {
                createConfirmationPopup(
                    `Do you want to translate the following text?\n\n"${selectedText}"`,
                    function() {
                        translateText(selectedText);
                    },
                    function() {
                        removePopup();
                    }
                );
            } else {
                removePopup();
            }
        }
    });
})();



