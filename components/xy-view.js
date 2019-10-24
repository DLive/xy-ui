
class XyView extends HTMLElement {

    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.innerHTML = `
        <style>
        :host {
            display:block;
        }
        :host(:not([fake])[dragging]){
            pointer-events:none;
            visibility:hidden;
            opacity:0;
        }
        :host([fake]){
            box-sizing:border-box!important;
            pointer-events:none;
            position:fixed!important;
            left:0!important;
            top:0!important;
            margin:0!important;
            transition:0s;
        }
        :host([resizable]){
            position:relative;
            min-width:30px;
            min-height:30px;
        }
        .resize{
            position:absolute;
            box-sizing:border-box;
            left:0;
            top:0;
            right:0;
            bottom:0;
            border:1px solid transparent;
            transition:.2s;
            outline:0;
            pointer-events: none;
        }
        .resize>i{
            position:absolute;
            box-sizing:border-box;
            width:9px;
            height:9px;
            background:#fff;
            border:1px solid var(--themeColor,#42b983);
            visibility:hidden;
            opacity:0;
            transition:.2s;
            pointer-events: all;
            margin:auto;
        }
        .resize>i::before{
            position:absolute;
            content:'';
            left:-5px;
            top:-5px;
            right:-5px;
            bottom:-5px;
        }
        :host([resizable]:focus-within) .resize{
            border-color: var(--themeColor,#42b983);
        }
        :host([resizable]:focus-within) .resize>i{
            visibility:visible;
            opacity:1;
        }
        .tl{
            top:-5px;
            left:-5px;
            cursor:nw-resize;
        }
        .t{
            top:-5px;
            left:0;
            right:0;
            cursor:n-resize;
        }
        .tr{
            top:-5px;
            right:-5px;
            cursor:sw-resize;
        }
        .l{
            left:-5px;
            top:0;
            bottom:0;
            cursor:w-resize;
        }
        .r{
            right:-5px;
            top:0;
            bottom:0;
            cursor:e-resize;
        }
        .bl{
            left:-5px;
            bottom:-5px;
            cursor:sw-resize;
        }
        .b{
            bottom:-5px;
            left:0;
            right:0;
            cursor:s-resize;
        }
        .br{
            bottom:-5px;
            right:-5px;
            cursor:se-resize;
        }
        </style>
        ${
            this.resizable?
            '<div class="resize" tabindex="-1"><i class="tl"></i><i class="t"></i><i class="tr"></i><i class="l"></i><i class="r"></i><i class="bl"></i><i class="b"></i><i class="br"></i></div>'
            :
            ''
        }
        <slot id="con"></slot>
        `
    }

    get coord() {
        return this.getAttribute('coord') !== null;
    }

    get draggable() {
        return this.getAttribute('draggable') !== null;
    }

    get dragging() {
        return this.getAttribute('dragging') !== null;
    }

    get resizable() {
        return this.getAttribute('resizable') !== null;
    }

    get allowdrop() {
        return this.getAttribute('allowdrop') !== null;
    }

    get allowhover() {
        return this.getAttribute('allowhover') !== null;
    }

    set dragging(value) {
        if(value===null||value===false){
            this.removeAttribute('dragging');
        }else{
            this.setAttribute('dragging', '');
        }
    }

    connectedCallback() {
        const con = this.shadowRoot.getElementById('con');
        if (this.coord) {
            this.addEventListener('mousemove', (ev) => {
                const { left, top } = this.getBoundingClientRect();
                con.style.setProperty('--x', ev.clientX - left);
                con.style.setProperty('--y', ev.clientY - top);
            })

            this.addEventListener('mousedown', (ev) => {
                this.style.setProperty('--_x', getComputedStyle(con).getPropertyValue('--x'));
                this.style.setProperty('--_y', getComputedStyle(con).getPropertyValue('--y'));
            })
        }

        if (this.draggable) {
            this.setAttribute('draggable', true);
            let startX = 0;
            let startY = 0;
            let dragstart = false;
            this.addEventListener('dragstart', (ev) => {
                if(this.resizing){
                    ev.preventDefault();
                    return false;
                }
                const img = new Image();
                this.cloneObj = this.cloneNode(true);
                img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' %3E%3Cpath /%3E%3C/svg%3E";
                ev.dataTransfer.setDragImage(img,0,0);
                ev.dataTransfer.setData('text/plain',this.textContent);
                event.dataTransfer.effectAllowed = 'all'; 
                const { left, top } = this.getBoundingClientRect();
                startX = ev.clientX - left;
                startY = ev.clientY - top;
                this.cloneObj = this.cloneNode(true);
                this.cloneObj.setAttribute('fake','');
                this.cloneObj.setAttribute('dragging','');
                this.cloneObj.style.width = this.offsetWidth + 'px';
                this.cloneObj.style.height = this.offsetHeight + 'px';
                this.cloneObj.style.transform = `translate3d( ${left}px ,${top}px,0)`;
                document.body.appendChild(this.cloneObj);
            })
            document.addEventListener('dragover', (ev) => {
                if(this.cloneObj){
                    //ev.preventDefault();
                    this.dragging = true;
                    this.cloneObj.style.transform = `translate3d( ${ev.clientX-startX}px ,${parseInt(ev.clientY-startY)}px,0)`;
                }
            })

            this.addEventListener('dragend', (ev) => {
                document.body.removeChild(this.cloneObj);
                this.cloneObj = null;
                this.dragging = false;
            })
        }

        if(this.allowdrop) {
            let elemetnNode = null;
            this.addEventListener('dragover', (ev) => {
                ev.preventDefault();
            })
            this.addEventListener('drop', (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                this.removeAttribute('over');
            })
            this.addEventListener('dragleave', (ev) => {
                ev.stopPropagation();
                if(elemetnNode===ev.target){
                    this.removeAttribute('over');
                }
            })
            this.addEventListener('dragenter', (ev) => {
                ev.stopPropagation();
                elemetnNode = ev.target;
                this.setAttribute('over','');
            })
        }

        if(this.allowhover) {
            this.addEventListener('mouseover', (ev) => {
                this.setAttribute('hover','');
            })
            this.addEventListener('mouseout', (ev) => {
                ev.stopPropagation();
                this.removeAttribute('hover');
            })
        }

        if(this.resizable) {
            const resizeCon = this.shadowRoot.querySelector('.resize');
            let startX = 0;
            let startY = 0;
            let mode = '';
            let width = 0;
            let height = 0;
            let offsetX = 0;
            let offsetY = 0;
            this.addEventListener('click',()=>{
                resizeCon.focus();
            })
            resizeCon.addEventListener('mousedown',(ev)=>{
                ev.stopPropagation();
                const path = ev.path || (ev.composedPath && ev.composedPath());
                if(path[0].tagName === 'I'){
                    this.resizing = true;
                    startX = ev.pageX;
                    startY = ev.pageY;
                    mode = path[0].className;
                    const rect = this.getBoundingClientRect();
                    width = rect.width;
                    height = rect.height;
                    this.dispatchEvent(new CustomEvent('resizestart',{
                        detail:{
                            offsetX:0,
                            offsetY:0,
                            width:width,
                            height:height,
                        }
                    }));
                }
            })
            document.addEventListener('mousemove',(ev)=>{
                if(this.resizing){
                    ev.stopPropagation();
                    window.getSelection().removeAllRanges();
                    offsetX = ev.pageX - startX;
                    offsetY = ev.pageY - startY;
                    switch (mode) {
                        case 'tl':
                            this.style.width = width - offsetX + 'px';
                            this.style.height = height - offsetY + 'px';
                            break;
                        case 't':
                            this.style.height = height - offsetY + 'px';
                            break;
                        case 'tr':
                            this.style.width = width + offsetX + 'px';
                            this.style.height = height - offsetY + 'px';
                            break;
                        case 'l':
                            this.style.width = width - offsetX + 'px';
                            break;
                        case 'r':
                            this.style.width = width + offsetX + 'px';
                            break;
                        case 'bl':
                            this.style.width = width - offsetX + 'px';
                            this.style.height = height + offsetY + 'px';
                            break;
                        case 'b':
                            this.style.height = height + offsetY + 'px';
                            break;
                        case 'br':
                            this.style.width = width + offsetX + 'px';
                            this.style.height = height + offsetY + 'px';
                            break;
                        default:
                            break;
                    }
                    this.dispatchEvent(new CustomEvent('resize',{
                        detail:{
                            offsetX:offsetX,
                            offsetY:offsetY,
                            width:this.offsetWidth,
                            height:this.offsetHeight,
                        }
                    }));
                }
            })
            document.addEventListener('mouseup',(ev)=>{
                this.resizing = false;
                this.dispatchEvent(new CustomEvent('resizend',{
                    detail:{
                        offsetX:offsetX,
                        offsetY:offsetY,
                        width:this.offsetWidth,
                        height:this.offsetHeight,
                    }
                }));
            })
        }
    }
}

if (!customElements.get('xy-view')) {
    customElements.define('xy-view', XyView);
}
