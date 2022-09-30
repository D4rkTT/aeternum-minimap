const {
    contextBridge,
    ipcRenderer
} = require("electron");

contextBridge.exposeInMainWorld(
    "api", {
        receive: (channel, func) => {
            let validChannels = ["update-minimap-zoom"];
            if (validChannels.includes(channel)) {
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            }
        },
        send:  (channel, data) => {
            let validChannels = ["inc-size", "dec-size", "close-app", "settings", "setIgnoreMouse", "update-minimap-zoom", "moveWindow"];
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
        }
    }
);