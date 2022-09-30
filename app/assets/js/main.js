var moveBtnClickDown = false
var oldX
var oldY
var showBtns = true

const mapSize = (inc) => {
    var MapWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--width-body'))
    if(inc){
        window.api.send('inc-size')
        document.documentElement.style.setProperty("--width-body", `${MapWidth + 20}px`);
    }else {
        window.api.send('dec-size')
        document.documentElement.style.setProperty("--width-body", `${MapWidth - 20}px`);
    }
}

$(document).ready((e) => {
    var containers = $(".ctrl")
    for (var container of containers) {
        container.onmouseenter = () => {
            window.api.send("setIgnoreMouse", false)
        }
        container.onmouseleave = () => {
            window.api.send("setIgnoreMouse", true)
        }
    }
})

$("body").mousemove((e) => {
    if (moveBtnClickDown) {
        let posX = e.screenX - e.clientX + (e.clientX - oldX)
        let posY = e.screenY - e.clientY + (e.clientY - oldY)
        window.api.send("moveWindow", [posX, posY])
    }
})

$(".move").mousedown((e) => {
    if(showBtns){
        moveBtnClickDown = true
        oldX = e.clientX
        oldY = e.clientY
    }
})

$(".move").dblclick((e) => {
    for(var btn of $(".ctrl").filter((i,element) => !element.className.includes("move"))){
        if(showBtns){
            $(btn).hide(50) 
        }else{
            $(btn).show(50)
        }
    }
    if(showBtns){
        showBtns=false
        $('.move').children().html("lock")
    }else{
        showBtns=true
        $('.move').children().html("open_with")
    }
})

$(document).mouseup((e) => {
    moveBtnClickDown = false
})

$('.exit').click((e)=>{
    window.api.send('close-app')
})

$('.settings').click((e)=>{
    window.api.send('settings')
})

$('.size-inc').click((e)=>{
    mapSize(true)
})

$('.size-dec').click((e)=>{
    mapSize(false)
})

$('.zoom-inc').click((e)=>{
    window.api.send('update-minimap-zoom', true)
})

$('.zoom-dec').click((e)=>{
    window.api.send('update-minimap-zoom', false)
})