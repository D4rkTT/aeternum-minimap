var moveBtnClickDown = false
var oldX
var oldY
var Locked = false
var superLocked = false

const mapSize = (inc) => {
    var MapWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--width-body'))
    if(inc){
        window.api.send('inc-size', true)
        document.documentElement.style.setProperty("--width-body", `${MapWidth + 20}px`);
    }else {
        window.api.send('inc-size', false)
        document.documentElement.style.setProperty("--width-body", `${MapWidth - 20}px`);
    }
    window.api.send('update-minimap-size', getComputedStyle(document.documentElement).getPropertyValue('--width-body'))
}

const ToggleLock = () => {
    for(var btn of $(".ctrl").filter((i, element) => !element.className.includes("move"))){
        if(!Locked){
            $(btn).hide(50) 
        }else{
            $(btn).show(50)
        }
    }
    if(!Locked){
        Locked = true
        $('.move').children().html("lock")
    }else{
        Locked = false
        $('.move').children().html("open_with")
    }
}

$(document).ready((e) => {
    var containers = $(".ctrl")
    for (var container of containers) {
        container.onmouseenter = () => {
            if(!superLocked){
                window.api.send("setIgnoreMouse", false)
            }
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
    if(!Locked){
        moveBtnClickDown = true
        oldX = e.clientX
        oldY = e.clientY
    }
})

$(".move").dblclick((e) => {
    ToggleLock()
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

window.api.receive("update-minimap-size", (size)=>{
    document.documentElement.style.setProperty("--width-body", size);
})

window.api.receive("toggle-super-lock", ()=>{
    if(!superLocked){
        if(!Locked){
            ToggleLock()
        }
        $('.move').css("color", "red")
        window.api.send("setIgnoreMouse", true)
        superLocked = true
    }else{
        $('.move').css("color", "#ffe97c")
        superLocked = false
    }
})