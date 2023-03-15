// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: server;
/**
 * Displays a bitcoin nodes stats.
 * Name: Nodestats
 * Author: Ging
 * Year: 2022
 * Deps:
 * - https://github.com/supermamon/scriptable-no-background
 * - https://github.com/ExperiBass/scriptable-scripts/blob/master/LibFoxxo.js
*/

// Widget setup
const {
    isIniCloud, determineDaysFromNow,
    selfUpdate, getSymbol,
    createStack, createText, createImage,
    formatNumber
} = importModule('LibFoxxo')
const { transparent } = importModule('no-background')

const params = args.widgetParameter ? args.widgetParameter.split(',') : []
const RPC_URL = params[0] // http://url:8334
const RPC_AUTH = params[1] // user:pass
const NODE_NAME_REGEX = /\((.+)\)/i
const NODE_VERSION_REGEX = /(\d+.\d+.\d+)/i
const FONT = Font.mediumSystemFont(16)
const MIN_TEXT_SCALE = 0.5
const STACK_GAP = 10
const IMAGE_PADDING = [0, 0, 0, 5]
const ICON_DIMS = 20
const ICONS = {
    upload: getSymbol("icloud.and.arrow.up.fill").image,
    download: getSymbol("icloud.and.arrow.down.fill").image,
    inbound: getSymbol("wave.3.right").image,
    outbound: getSymbol("wave.3.left").image,
    totalconns: getSymbol("dot.radiowaves.left.and.right").image,
    uptime: getSymbol("clock.fill").image,
    chainSize: getSymbol("externaldrive.fill").image,
    version: getSymbol("book.closed.fill").image
}
const REQUEST_HEADERS = {
    "Authorization": `Basic ${btoa(RPC_AUTH)}`
}

// Select file source
const files = isIniCloud(FileManager.local(), module.filename) ? FileManager.iCloud() : FileManager.local()
const widget = new ListWidget()
widget.backgroundImage = await transparent(Script.name())

const DONT_UPDATE_UNTIL = 5 * 60 * 1000 // 5 mins in ms
widget.refreshAfterDate = new Date((new Date()).valueOf() + DONT_UPDATE_UNTIL)

// Self-update
if (config.runsInApp) {
    // check file update date
    const UPDATE_PERIOD = 7 // days
    const lastUpdated = files.modificationDate(module.filename)
    if (determineDaysFromNow(lastUpdated) >= UPDATE_PERIOD) {
        // Update
        (await selfUpdate({
            srcurl: `https://github.com/ExperiBass/scriptable-scripts/raw/master/${Script.name()}.js`,
            filepath: module.filename, fs: files, shouldPiggyback: true
        }))
    }
}
// Helpers
async function sendRequestToNode(method) {
    const req = new Request(`${RPC_URL}`)
    req.method = "POST"
    req.headers = new Object(REQUEST_HEADERS)
    req.body = `{"method":"${method}"}`
    return (await req.loadJSON())['result']
}
// https://stackoverflow.com/a/34841026, heavily tweaked
function toDDHHMM(secs, padding = false) {
    const markers = ["d", "h", "m"]
    const totalHours = Math.floor(secs / 3600)
    const hours = totalHours % 24
    const minutes = Math.floor(secs / 60) % 60
    const days = Math.floor(totalHours / 24)

    return [days, hours, minutes]
        .map(v => {
            if (padding) {
                return v > 9 ? v : "0" + v
            }
            return v
        }) // first add padding, if wanted ([2, 0, 13] -> ["02", "00", "13"])

        .map((v, i) => `${v}${markers[i]}`) // add time markers ([2, 0, 13] -> ["2d", "0h", "13m"])
        .filter((v) => padding ? !v.startsWith("00") : !v.startsWith("0")) // then filter out 0 values (["2d", "0h", "13m"] -> ["02d", "13m"])
        .join("") // and finally join ("02d")
}
// https://stackoverflow.com/a/18650828, slightly tweaked
function formatBytes(bytes) {
    if (!+bytes) {
        return '0B'
    }

    const k = 1024
    const sizes = ['iB', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))}${sizes[i]}`
}
function createSubStacks(rootStack) {
    for (let i = 0; i < 3; i++) {
        rootStack[`substack${i + 1}`] = createStack({ parent: rootStack, width: rootStack.size.width })
        rootStack.addSpacer(4)
    }
}

async function getNodeInfo() {
    const netInfo = await sendRequestToNode("getnetworkinfo")
    const chainInfo = await sendRequestToNode("getblockchaininfo")
    const netTotals = await sendRequestToNode("getnettotals")

    return {
        name: netInfo.subversion.match(NODE_NAME_REGEX)[1],
        version: netInfo.subversion.match(NODE_VERSION_REGEX)[1],
        protocolversion: netInfo.protocolversion.toString(),
        uptime: toDDHHMM(await sendRequestToNode("uptime")),
        connections: {
            in: formatNumber(netInfo.connections_in),
            out: formatNumber(netInfo.connections_out),
            total: formatNumber(netInfo.connections)
        },
        chain: {
            size: formatBytes(chainInfo.size_on_disk),
        },
        uploaded: formatBytes(netTotals.totalbytessent),
        downloaded: formatBytes(netTotals.totalbytesrecv)
    }
}

// Main func
async function buildWidget() {
    const node = await getNodeInfo()

    // setup stacks
    const rootStack = createStack({
        parent: widget, verticalLayout: true,
        width: 330,
        height: 140
    })
    const nameStack = createStack({
        parent: rootStack, width: rootStack.size.width, height: 20,

    })
    rootStack.addSpacer(4)
    const infoStackRoot = createStack({
        parent: rootStack, width: rootStack.size.width
    })

    const infoStackL = createStack({
        parent: infoStackRoot, width: 110,
        verticalLayout: true
    })
    createSubStacks(infoStackL)
    infoStackRoot.addSpacer(STACK_GAP)
    const infoStackM = createStack({
        parent: infoStackRoot, width: 50,
        verticalLayout: true
    })
    createSubStacks(infoStackM)
    infoStackRoot.addSpacer(STACK_GAP)
    const infoStackR = createStack({
        parent: infoStackRoot, width: infoStackL.size.width,
        verticalLayout: true
    })
    createSubStacks(infoStackR)

    // populate stacks
    createText({
        parent: nameStack,
        content: node.name,
        minimumScaleFactor: MIN_TEXT_SCALE,
        font: FONT, centered: true
    })

    // L
    createImage({
        parent: infoStackL.substack1, width: ICON_DIMS,
        height: ICON_DIMS, image: ICONS.uptime, color: "#ffffff"
    })
    infoStackL.substack1.addSpacer()
    createText({
        parent: infoStackL.substack1,
        content: node.uptime,
        minimumScaleFactor: MIN_TEXT_SCALE,
        font: FONT
    })
    createImage({
        parent: infoStackL.substack2, width: ICON_DIMS,
        height: ICON_DIMS, image: ICONS.version, color: "#ffffff"
    })
    infoStackL.substack2.addSpacer()
    createText({
        parent: infoStackL.substack2,
        content: node.version,
        minimumScaleFactor: MIN_TEXT_SCALE,
        font: FONT
    })
    createImage({
        parent: infoStackL.substack3, width: ICON_DIMS,
        height: ICON_DIMS, image: ICONS.version, color: "#ffffff"
    })
    infoStackL.substack3.addSpacer()
    createText({
        parent: infoStackL.substack3,
        content: node.protocolversion,
        minimumScaleFactor: MIN_TEXT_SCALE,
        font: FONT
    })

    infoStackRoot.addSpacer(STACK_GAP)

    // M
    createImage({
        parent: infoStackM.substack1, width: ICON_DIMS,
        height: ICON_DIMS, image: ICONS.totalconns, color: "#ffffff"
    })
    infoStackM.substack1.addSpacer()
    createText({
        parent: infoStackM.substack1,
        content: node.connections.total,
        minimumScaleFactor: MIN_TEXT_SCALE,
        font: FONT,

    })
    createImage({
        parent: infoStackM.substack2, width: ICON_DIMS,
        height: ICON_DIMS, image: ICONS.inbound, color: "#ffffff"
    })
    infoStackM.substack2.addSpacer()
    createText({
        parent: infoStackM.substack2,
        content: node.connections.in,
        minimumScaleFactor: MIN_TEXT_SCALE,
        font: FONT,

    })
    createImage({
        parent: infoStackM.substack3, width: ICON_DIMS,
        height: ICON_DIMS, image: ICONS.outbound, color: "#ffffff"
    })
    infoStackM.substack3.addSpacer()
    createText({
        parent: infoStackM.substack3,
        content: node.connections.out,
        minimumScaleFactor: MIN_TEXT_SCALE,
        font: FONT,

    })

    infoStackRoot.addSpacer(STACK_GAP)

    // R
    createImage({
        parent: infoStackR.substack1, width: ICON_DIMS,
        height: ICON_DIMS, image: ICONS.chainSize, color: "#ffffff"
    })
    infoStackR.substack1.addSpacer()
    createText({
        parent: infoStackR.substack1,
        content: node.chain.size,
        minimumScaleFactor: MIN_TEXT_SCALE,
        font: FONT,

    })
    createImage({
        parent: infoStackR.substack2, width: ICON_DIMS,
        height: ICON_DIMS, image: ICONS.upload, color: "#ffffff"
    })
    infoStackR.substack2.addSpacer()
    createText({
        parent: infoStackR.substack2,
        content: node.uploaded,
        minimumScaleFactor: MIN_TEXT_SCALE,
        font: FONT,

    })
    createImage({
        parent: infoStackR.substack3, width: ICON_DIMS,
        height: ICON_DIMS, image: ICONS.download, align: 'left', color: "#ffffff"
    })
    infoStackR.substack3.addSpacer()
    createText({
        parent: infoStackR.substack3,
        content: node.downloaded,
        minimumScaleFactor: MIN_TEXT_SCALE,
        font: FONT,

    })

}

await buildWidget()
Script.setWidget(widget)
widget.presentMedium()
Script.complete()