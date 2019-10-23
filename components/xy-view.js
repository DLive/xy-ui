
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
            opacity:.5;
        }
        :host([fake]){
            pointer-events:none;
            position:fixed!important;
            left:0;
            top:0;
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
        this.con = this.shadowRoot.getElementById('con');
        if (this.coord) {
            this.addEventListener('mousemove', (ev) => {
                const { left, top } = this.getBoundingClientRect();
                this.con.style.setProperty('--x', ev.clientX - left);
                this.con.style.setProperty('--y', ev.clientY - top);
            })

            this.addEventListener('mousedown', (ev) => {
                this.style.setProperty('--_x', getComputedStyle(this.con).getPropertyValue('--x'));
                this.style.setProperty('--_y', getComputedStyle(this.con).getPropertyValue('--y'));
            })
        }

        if (this.draggable) {
            this.setAttribute('draggable', true);
            let clientX = 0;
            let clientY = 0;
            let startX = 0;
            let startY = 0;
            let dragstart = false;
            this.addEventListener('dragstart', (ev) => {
                if(this.resizing){
                    ev.preventDefault();
                    return false;
                }
                const img = new Image();
                /*
                var cloneDom = this.cloneNode(true);
                cloneDom.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
                img.src = 'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="' + this.offsetWidth + '" height="' + this.offsetHeight + '"><foreignObject x="0" y="0" width="100%" height="100%">'+ 
                    new XMLSerializer().serializeToString(cloneDom).replace(/#/g, '%23').replace(/\n/g, '%0A') +'</foreignObject></svg>';
                document.body.style.backgroundImage = `url('${img.src}')`
                */
                this.cloneObj = this.cloneNode(true);
                img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH/C1hNUCBEYXRhWE1QPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS41LWMwMTQgNzkuMTUxNDgxLCAyMDEzLzAzLzEzLTEyOjA5OjE1ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgKFdpbmRvd3MpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOkZENDBGQkRDRjU0RDExRTlBRkY5ODREMkFDQzJFQ0I3IiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOkZENDBGQkRERjU0RDExRTlBRkY5ODREMkFDQzJFQ0I3Ij4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6RkQ0MEZCREFGNTREMTFFOUFGRjk4NEQyQUNDMkVDQjciIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6RkQ0MEZCREJGNTREMTFFOUFGRjk4NEQyQUNDMkVDQjciLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz4B//79/Pv6+fj39vX08/Lx8O/u7ezr6uno5+bl5OPi4eDf3t3c29rZ2NfW1dTT0tHQz87NzMvKycjHxsXEw8LBwL++vby7urm4t7a1tLOysbCvrq2sq6qpqKempaSjoqGgn56dnJuamZiXlpWUk5KRkI+OjYyLiomIh4aFhIOCgYB/fn18e3p5eHd2dXRzcnFwb25tbGtqaWhnZmVkY2JhYF9eXVxbWllYV1ZVVFNSUVBPTk1MS0pJSEdGRURDQkFAPz49PDs6OTg3NjU0MzIxMC8uLSwrKikoJyYlJCMiISAfHh0cGxoZGBcWFRQTEhEQDw4NDAsKCQgHBgUEAwIBAAAh+QQBAAAAACwAAAAAAQABAAACAkQBADs=";
                ev.dataTransfer.setDragImage(img,0,0);
                ev.dataTransfer.setData('text/plain',this.textContent);
                event.dataTransfer.effectAllowed = 'all'; 
                const { left, top } = this.getBoundingClientRect();
                startX = ev.clientX - left;
                startY = ev.clientY - top;
                this.cloneObj = this.cloneNode(true);
                this.cloneObj.setAttribute('fake','');
                this.cloneObj.style.transform = `translate3d( ${left}px ,${top}px,0)`;
                document.body.appendChild(this.cloneObj);
            })
            document.addEventListener('dragover', (ev) => {
                if(this.cloneObj){
                    this.dragging = true;
                    this.cloneObj.style.transform = `translate3d( ${ev.clientX-startX}px ,${ev.clientY-startY}px,0)`;
                    //this.cloneObj.style.left = ev.clientX-startX + 'px';
                    //this.cloneObj.style.top = ev.clientY-startY + 'px';
                }
            })

            this.addEventListener('dragend', (ev) => {
                document.body.removeChild(this.cloneObj);
                this.cloneObj = null;
                this.dragging = false;
            })
        }

        if(this.allowdrop) {
            this.addEventListener('dragover', (ev) => {
                ev.preventDefault();
            })
            this.addEventListener('drop', (ev) => {
                ev.stopPropagation();
                ev.preventDefault();
                ev.target.removeAttribute('over');
            })
            this.addEventListener('dragleave', (ev) => {
                ev.stopPropagation();
                this.removeAttribute('over');
            })
            this.addEventListener('dragenter', (ev) => {
                ev.stopPropagation();
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

var domToImg = (function () {
    // 转png需要的canvas对象及其上下文
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    
    // canvas绘制图片元素方法
    var draw = function (img) {
        var width = img.width, height = img.height;
        // canvas绘制
        canvas.width = width;
        canvas.height = height;
        // 画布清除
        context.clearRect(0, 0, width, height);    
        // 绘制图片到canvas
        context.drawImage(img, 0, 0);
    };

    // canvas画布绘制的原图片
    var img = new Image();
    // 回调
    var callback = function () {};
    
    // 图片回调
    img.onload = function () {
        draw(this);
        // 回调方法
        callback();
    };
    
    var exports = {
        dom: null,
        // DOM变成svg，并作为图片显示
        dom2Svg: function () {
            var dom = this.dom;
            if (!dom) {
                return this;    
            }
            
            // 复制DOM节点
            var cloneDom = dom.cloneNode(true);
            cloneDom.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
            // 图片地址显示为DOM转换的svg
            img.src = 'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="' + dom.offsetWidth + '" height="' + dom.offsetHeight + '"><foreignObject x="0" y="0" width="100%" height="100%">'+ 
                new XMLSerializer().serializeToString(cloneDom).replace(/#/g, '%23').replace(/\n/g, '%0A') +
                document.querySelector('style').outerHTML +
             '</foreignObject></svg>';
            
            return this;
        }, 
    };
    
    return exports;
})();


if (!customElements.get('xy-view')) {
    customElements.define('xy-view', XyView);
}
