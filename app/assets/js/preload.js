const {
    contextBridge,
    ipcRenderer
} = require("electron");

contextBridge.exposeInMainWorld(
    "api", {
        receive: (channel, func) => {
            let validChannels = ["update-minimap-zoom", "update-minimap-size", "toggle-super-lock"];
            if (validChannels.includes(channel)) {
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            }
        },
        send:  (channel, data) => {
            let validChannels = ["inc-size", "dec-size", "close-app", "settings", "setIgnoreMouse", "update-minimap-zoom", "moveWindow", "update-minimap-size"];
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
        }
    }
);