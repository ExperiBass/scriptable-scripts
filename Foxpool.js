// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: server;
/**
 * Displays mempool info from mempool.space.
 * Name: Foxpool
 * Author: Ging
 * Year: 2022
*/

// Widget setup
const common = importModule('LibFoxxo')

const params = args.widgetParameter ? args.widgetParameter.split(',') : []

// Select file source
const files = common.isIniCloud(FileManager.local(), module.filename) ? FileManager.iCloud() : FileManager.local()
const bgPath = common.getFile(files, '/rice/centerright.jpg')

// Self-update
if (config.runsInApp) {
    // check file update date
    const UPDATE_PERIOD = 7 // days
    const lastUpdated = files.modificationDate(module.filename)
    if (common.determineDaysFromNow(lastUpdated) >= UPDATE_PERIOD) {
        // Update
        (await common.selfUpdate({
            srcurl: 'https://github.com/ExperiBass/scriptable-scripts/raw/master/Foxpool.js',
            filename: module.filename, fs: files, shouldPiggyback: true
        }))
    }
}

const widgetConf = {
    text: {
        color: "#FFFFFF"
    },
    border: {
        color: "#000000",
        radius: 12,
        width: 1
    },
    font: {
        large: Font.mediumSystemFont(64),
        medium: Font.mediumSystemFont(32),
        small: Font.mediumSystemFont(16)
    },
    iconStackHeight: 0,
    iconDims: 20
}

const widget = new ListWidget()
widget.backgroundImage = files.readImage(bgPath)
widget.url = 'https://mempool.space'
widget.setPadding(0, 0, 0, 0)

const API_URL = `${widget.url}/api` // trailing slash left off
const MIN_TEXT_SCALE = 0.5

// Required symbols
const totalTxSymbol = common.getSymbol('creditcard.fill')
const totalSizeSymbol = common.getSymbol('macmini.fill') // ig this looks close enough to a drive
const totalFeeSymbol = common.getSymbol('bitcoinsign.circle')
const heightSymbol = common.getSymbol('tray.and.arrow.up.fill')
const hashrateSymbol = common.getSymbol('gearshape.2.fill')
const diffSymbol = common.getSymbol('hammer.fill')

// Prebuild requests
const mempoolInfo = new Request(`${API_URL}/mempool`)
const blockHeight = new Request(`${API_URL}/blocks/tip/height`)
const feeSuggestions = new Request(`${API_URL}/v1/fees/recommended`)
const hashrate = new Request(`${API_URL}/v1/mining/hashrate/1m`) // hashrate and diff



// Build main content stacks
const topStack = widget.addStack()
const mempoolStack = common.createStack({
    parent: topStack, width: 67.5, height: 115, backgroundColor: "#00000000",
    borderColor: widgetConf.border.color, borderRadius: widgetConf.border.radius,
    borderWidth: widgetConf.border.width, verticalLayout: true,
})
topStack.addSpacer(5)
const hashrateStack = common.createStack({
    parent: topStack, width: mempoolStack.size.width, height: mempoolStack.size.height,
    backgroundColor: "#00000000", borderColor: widgetConf.border.color,
    borderRadius: widgetConf.border.radius, borderWidth: widgetConf.border.width,
    verticalLayout: true
})
const suggestedFeeStack = common.createStack({
    parent: widget, width: 140, height: 20, backgroundColor: "#00000000",
    borderColor: widgetConf.border.color, borderRadius: widgetConf.border.radius,
    borderWidth: widgetConf.border.width, verticalLayout: false,
    align: 'center'
})

topStack.layoutHorizontally()
topStack.size = new Size(140, 120)

//////////////////
// Mempool Info //
//////////////////

const mempoolData = (await mempoolInfo.loadJSON())
// TX count
const txImageStack = common.createStack({
    parent: mempoolStack, width: mempoolStack.size.width,
    height: widgetConf.iconStackHeight, align: 'center'
})
txImageStack.addSpacer()
const txImage = common.createImage({
    parent: txImageStack, width: widgetConf.iconDims, height: widgetConf.iconDims,
    color: widgetConf.text.color, image: totalTxSymbol.image, align: 'center'
})
txImageStack.addSpacer()
const txTextStack = common.createStack({
    parent: mempoolStack, width: mempoolStack.size.width,
    height: widgetConf.iconStackHeight, align: 'center'
})
txTextStack.addSpacer()
common.createText({
    parent: txTextStack,
    content: common.formatNumber(mempoolData.count),
    minimumScaleFactor: MIN_TEXT_SCALE,
    font: widgetConf.font.small
})
txTextStack.addSpacer()

// Mempool size
const sizeImageStack = common.createStack({
    parent: mempoolStack, width: mempoolStack.size.width,
    height: widgetConf.iconStackHeight, align: 'center'
})
sizeImageStack.addSpacer()
const sizeImage = common.createImage({
    parent: sizeImageStack, width: widgetConf.iconDims, height: widgetConf.iconDims,
    color: widgetConf.text.color, image: totalSizeSymbol.image, align: 'center'
})
sizeImageStack.addSpacer()
const sizeTextStack = common.createStack({
    parent: mempoolStack, width: mempoolStack.size.width,
    height: widgetConf.iconStackHeight, align: 'center'
})
sizeTextStack.addSpacer()
const sizeTextContent = common.formatNumber(mempoolData.vsize, { notation: 'compact', compactDisplay: 'short' })
common.createText({
    parent: sizeTextStack,
    content: `${sizeTextContent}vB`,
    minimumScaleFactor: MIN_TEXT_SCALE,
    font: widgetConf.font.small
})
sizeTextStack.addSpacer()

// Mempool fee
const feeImageStack = common.createStack({
    parent: mempoolStack, width: mempoolStack.size.width,
    height: widgetConf.iconStackHeight, align: 'center'
})
feeImageStack.addSpacer()
const feeImage = common.createImage({
    parent: feeImageStack, width: widgetConf.iconDims, height: widgetConf.iconDims,
    color: widgetConf.text.color, image: totalFeeSymbol.image, align: 'center'
})
feeImageStack.addSpacer()
const feeTextStack = common.createStack({
    parent: mempoolStack, width: mempoolStack.size.width,
    height: widgetConf.iconStackHeight, align: 'center'
})
feeTextStack.addSpacer()
const feeTextContent = common.formatNumber(mempoolData.total_fee / 100000000) // 100 mil
common.createText({
    parent: feeTextStack,
    content: `₿ ${feeTextContent}`,
    minimumScaleFactor: MIN_TEXT_SCALE,
    font: widgetConf.font.small
})
feeTextStack.addSpacer()

///////////////////
// Hashrate Info //
///////////////////

const miningData = (await hashrate.loadJSON())
// Block height
const heightImageStack = common.createStack({
    parent: hashrateStack, width: hashrateStack.size.width,
    height: widgetConf.iconStackHeight, align: 'center'
})
heightImageStack.addSpacer()
const heightImage = common.createImage({
    parent: heightImageStack, width: widgetConf.iconDims, height: widgetConf.iconDims,
    color: widgetConf.text.color, image: heightSymbol.image, align: 'center'
})
heightImageStack.addSpacer()

const currHeight = (await blockHeight.loadString())
const heightTextStack = common.createStack({
    parent: hashrateStack, width: hashrateStack.size.width, align: 'center'
})
heightTextStack.addSpacer()
common.createText({
    parent: heightTextStack,
    content: currHeight,
    minimumScaleFactor: MIN_TEXT_SCALE,
    font: widgetConf.font.small
})
heightTextStack.addSpacer()

// Global hashrate
const hashrateImageStack = common.createStack({
    parent: hashrateStack, width: hashrateStack.size.width,
    height: widgetConf.iconStackHeight, align: 'center'
})
hashrateImageStack.addSpacer()
const hashrateImage = common.createImage({
    parent: hashrateImageStack, width: widgetConf.iconDims, height: widgetConf.iconDims,
    color: widgetConf.text.color, image: hashrateSymbol.image, align: 'center'
})
hashrateImageStack.addSpacer()

const hashrateTextStack = common.createStack({
    parent: hashrateStack, width: hashrateStack.size.width, align: 'center'
})
// We can afford to lose a bit of precision
const hashps = (Number(miningData.currentHashrate) / Number(1000000000000000000n)).toFixed(2)
hashrateTextStack.addSpacer()
common.createText({
    parent: hashrateTextStack,
    content: `${hashps}`,
    minimumScaleFactor: MIN_TEXT_SCALE,
    font: widgetConf.font.small
})
hashrateTextStack.addSpacer()
// Difficulty

const diffImageStack = common.createStack({
    parent: hashrateStack, width: hashrateStack.size.width,
    height: widgetConf.iconStackHeight, align: 'center'
})
diffImageStack.addSpacer()
const diffImage = common.createImage({
    parent: diffImageStack, width: widgetConf.iconDims, height: widgetConf.iconDims,
    color: widgetConf.text.color, image: diffSymbol.image, align: 'center'
})
diffImageStack.addSpacer()

const diffTextStack = common.createStack({
    parent: hashrateStack, width: hashrateStack.size.width, align: 'center'
})
diffTextStack.addSpacer()
common.createText({
    parent: diffTextStack,
    content: common.formatNumber(miningData.currentDifficulty, { notation: 'compact', compactDisplay: 'short' }),
    minimumScaleFactor: MIN_TEXT_SCALE,
    font: widgetConf.font.small
})
diffTextStack.addSpacer()

///////////////////////
// Suggested tx fees //
///////////////////////

const suggestedFeeData = (await feeSuggestions.loadJSON())
const suggestedFeeTextStack = common.createStack({
    parent: suggestedFeeStack, width: suggestedFeeStack.size.width, align: 'center'
})
suggestedFeeTextStack.addSpacer()
common.createText({
    parent: suggestedFeeTextStack,
    content: `${suggestedFeeData.hourFee} sat/vB ${suggestedFeeData.halfHourFee} sat/vB ${suggestedFeeData.fastestFee} sat/vB`,
    minimumScaleFactor: MIN_TEXT_SCALE,
    font: widgetConf.font.small
})
suggestedFeeTextStack.addSpacer()

Script.setWidget(widget)
Script.complete()
widget.presentSmall()