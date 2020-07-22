import sketch from 'sketch'
const Settings = sketch.Settings
// documentation: https://developer.sketchapp.com/reference/api/

export function getInfo() {
    if (checkForSFSymbols()) {
        sketch.UI.message("􀐈 Duplicate a layer. 􀄫 Move the duplciated layer. 􀐈 Duplicate the moved layer.")
    } else {
        sketch.UI.message("Duplicate a layer. Move the duplciated layer. Duplicate the moved layer.")
    }
}

export function duplicateBegin() {
    let sourceLayerIDs = sketch.getSelectedDocument().selectedLayers.layers.map(layer => layer.id)
    if (JSON.stringify(sourceLayerIDs) === Settings.sessionVariable('layerIDs')) {
        return
    } else {
        Settings.setSessionVariable('sourceLayerIDs', JSON.stringify(sourceLayerIDs))
        Settings.setSessionVariable('deltaPos', null)
    }
}

export function duplicateFinish() {
    let duplicatedLayers = sketch.getSelectedDocument().selectedLayers.layers
    let duplicatedLayerIDs = duplicatedLayers.map(layer => layer.id)
    let duplicatedLayersPosition = { "x": duplicatedLayers[0].frame.x, "y": duplicatedLayers[0].frame.y }

    Settings.setSessionVariable('layerIDs', JSON.stringify(duplicatedLayerIDs))
    Settings.setSessionVariable('duplicatedLayersPosition', JSON.stringify(duplicatedLayersPosition))

    if (Settings.sessionVariable('deltaPos')) {
        const deltaPos = JSON.parse(Settings.sessionVariable('deltaPos'))

        duplicatedLayers.forEach(layer => {
            layer.frame.x = layer.frame.x - deltaPos.x
            layer.frame.y = layer.frame.y - deltaPos.y
        })
    }
}

export function layersMovedFinished(context) {
    const nativeArray = context.actionContext.layers
    const jsObjectArray = convertNativeArray(nativeArray)

    let newPos = {
        "x": jsObjectArray[0].frame.x,
        "y": jsObjectArray[0].frame.y
    }

    let movedLayerIds = jsObjectArray.map(layer => layer.id)
    if (Settings.sessionVariable('layerIDs') === JSON.stringify(movedLayerIds)) {
        let sourcePos = JSON.parse(Settings.sessionVariable('duplicatedLayersPosition'))

        let deltaPos = {
            "x": sourcePos.x - newPos.x,
            "y": sourcePos.y - newPos.y
        }

        Settings.setSessionVariable('deltaPos', JSON.stringify(deltaPos))
    } else {
        Settings.setSessionVariable('deltaPos', null)
    }
}

function convertNativeArray(nativeArray) {
    let jsArray = []
    for (let i = 0; i < nativeArray.count(); i++) {
        jsArray.push(nativeArray[i])
    }
    let jsObjectArray = jsArray.map(nativeObject => sketch.fromNative(nativeObject))

    return jsObjectArray
}

function logSessionVars() {
    console.log({
        "sourceLayers": Settings.sessionVariable("sourceLayerIDs"),
        "duplicatedlayerIDs": Settings.sessionVariable("layerIDs"),
        "deltaPos": Settings.sessionVariable("deltaPos")
    })
}

function checkForSFSymbols() {
    let systemVersionPlist = "/System/Library/CoreServices/SystemVersion.plist"
    let systemVersionDictionary = NSDictionary.dictionaryWithContentsOfFile(systemVersionPlist)
    let systemVersion = systemVersionDictionary.objectForKey("ProductVersion")
    let systemVersionArray = systemVersion.split('.').map(stringNumber => parseInt(stringNumber))

    if (systemVersionArray[0] >= 10 && systemVersionArray[1] >= 15) {
        return true
    } else {
        return false
    }
}
