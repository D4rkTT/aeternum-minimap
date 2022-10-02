const {
  app,
  BrowserWindow,
  webFrameMain,
  ipcMain,
  globalShortcut
} = require('electron')
const {
  localStorage
} = require('electron-browser-storage');
const path = require('path')

var initializationWindow, minimapWindow, loadingWindow

const CreateLoadingWindow = () => {
  loadingWindow = new BrowserWindow({
    width: 200,
    height: 280,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
    }
  })
  loadingWindow.loadFile('app/loading.html')
}

const CreateInitWindow = () => {
  initializationWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, 'app/assets/js/preload.js'),
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
    },
    show: false
  })

  initializationWindow.webContents.on('did-finish-load', function() {
    loadingWindow.close()
    initializationWindow.show()
  });

  initializationWindow.setMenuBarVisibility(false)
  initializationWindow.loadURL("https://aeternum-map.gg/")
  initializationWindow.on('close', async (e) => {
    e.preventDefault()
    if (!minimapWindow) {
      var last_position = await localStorage.getItem('last_position')
      if (last_position) {
        last_position = JSON.parse(last_position)
        CreateMinimapWindow(last_position[0], last_position[1])
      } else {
        CreateMinimapWindow()
      }

    } else {
      minimapWindow.show()
      minimapWindow.setAlwaysOnTop(true, 'screen-saver')
    }
    initializationWindow.hide()
  })

  // Inject JS code to allow us to change minimap zoom without reloading minimap window
  // Thanks for lmachens for letting me know that i should change it from another window
  initializationWindow.webContents.executeJavaScript(`
      window.api.receive("update-minimap-zoom", async (increase) => {
        var zoom = await localStorage.getItem("minimapZoom")
        if(!zoom){
          zoom = 5
        }
        if(increase) {
          await localStorage.setItem("minimapZoom", (parseInt(zoom) + 1) < 7? parseInt(zoom) + 1: parseInt(zoom))
        }else {
          await localStorage.setItem("minimapZoom", (parseInt(zoom) - 1) > 0? parseInt(zoom) - 1: parseInt(zoom))
        }
      })
    `)
}

const CreateMinimapWindow = async (locationX = 0, locationY = 0) => {
  var last_size = await localStorage.getItem('minimap_win_size')
  if(last_size){
    size = last_size
  }else{
    size = [350, 350]
  }
  minimapWindow = new BrowserWindow({
    width: size[0],
    height: size[1],
    frame: false,
    x: locationX,
    y: locationY,
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, 'app/assets/js/preload.js'),
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
    }
  })

  minimapWindow.loadFile("app/index.html")
  minimapWindow.setAlwaysOnTop(true, 'screen-saver')
  minimapWindow.setIgnoreMouseEvents(true, { forward: true })

  minimapWindow.on('move', async (e) => {
    await localStorage.setItem('last_position', JSON.stringify(minimapWindow.getPosition()))
  })

  minimapWindow.on('close', async (e) => {
    app.exit()
  })

  // FIX -webkit-app-region problem in aeternum-map minimap 
  // SEE https://github.com/lmachens/aeternum-map/pull/312
  minimapWindow.webContents.on(
    'did-frame-navigate',
    (event, url, httpResponseCode, httpStatusText, isMainFrame, frameProcessId, frameRoutingId) => {
      const frame = webFrameMain.fromId(frameProcessId, frameRoutingId)
      if (frame) {
        if (frame.url.includes("aeternum-map.gg")) {
          frame.executeJavaScript(`document.addEventListener("DOMContentLoaded", function(event) {
              var styles = "._container_y0cou_1 { -webkit-app-region: no-drag !important; }"
              var styleSheet = document.createElement("style")
              styleSheet.innerText = styles
              document.head.appendChild(styleSheet)
            });`)
        }
      }
    }
  )
  minimapWindow.webContents.on('did-finish-load', async () => {
    console.log("loaded")
    var size = await localStorage.getItem('minimap_size')
    if(size){
      
      minimapWindow.webContents.send('update-minimap-size', size)
    }
  });
}


app.whenReady().then(() => {

  globalShortcut.register("F6", () => {
    if(minimapWindow){
      minimapWindow.isVisible() ? minimapWindow.hide(): minimapWindow.show()
    }
  })

  globalShortcut.register("F7", () => {
    if(initializationWindow){
      initializationWindow.webContents.send('update-minimap-zoom', false);
    }
  })

  globalShortcut.register("F8", () => {
    if(minimapWindow){
      initializationWindow.webContents.send('update-minimap-zoom', true);
    }
  })
  globalShortcut.register("F9", () => {
    if(minimapWindow){
      minimapWindow.webContents.send('toggle-super-lock');
    }
  })
  CreateLoadingWindow()
  CreateInitWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      CreateInitWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.exit()
  }
})

ipcMain.on("inc-size", async (event, inc) => {
  if (minimapWindow) {
    var currentSize = minimapWindow.getSize()
    if(inc) {
      minimapWindow.setSize(currentSize[0] + 20, currentSize[1] + 20)
    } else {
      minimapWindow.setSize(currentSize[0] - 20, currentSize[1] - 20)
    }
    await localStorage.setItem('minimap_win_size', JSON.stringify(minimapWindow.getSize()));
  }
})

ipcMain.on("close-app", (event, args) => {
  app.exit()
})

ipcMain.on("settings", (event, args) => {
  initializationWindow.show()
  minimapWindow.hide()
})

ipcMain.on("setIgnoreMouse", (event, args) => {
  minimapWindow.setIgnoreMouseEvents(args, { forward: true });
})

ipcMain.on("update-minimap-zoom", (event, increase) => {
  if (initializationWindow) {
    initializationWindow.webContents.send('update-minimap-zoom', increase);
  }
})

ipcMain.on("moveWindow", (event, cord) => {
  if(minimapWindow){
    minimapWindow.setPosition(cord[0], cord[1], true)
  }
})

ipcMain.on("update-minimap-size", async (event, size) => {
  await localStorage.setItem('minimap_size', size);
})