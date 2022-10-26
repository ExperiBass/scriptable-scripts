// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: server;
/**
 * Displays mempool info from mempool.space.
 * Name: Foxpool
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
    createStack, createImage,
    createText, formatNumber
} = importModule('LibFoxxo')
const { transparent } = importModule('no-background')

const params = args.widgetParameter ? args.widgetParameter.split(',') : []

// Select file source
const files = isIniCloud(FileManager.local(), module.filename) ? FileManager.iCloud() : FileManager.local()

// Self-update
if (config.runsInApp) {
    // check file update date
    const UPDATE_PERIOD = 7 // days
    const lastUpdated = files.modificationDate(module.filename)
    if (determineDaysFromNow(lastUpdated) >= UPDATE_PERIOD) {
        // Update
        (await selfUpdate({
            srcurl: 'https://github.com/ExperiBass/scriptable-scripts/raw/master/Foxpool.js',
            filepath: module.filename, fs: files, shouldPiggyback: true
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

// Don't update until 5 minutes have passed
// This avoids any potential spamming
const DONT_UPDATE_UNTIL = 5 * 60 * 1000 // 5 mins in ms

const widget = new ListWidget()
// add 5 mins to the current date, and then wrap it up in a date
widget.refreshAfterDate = new Date( (new Date()).valueOf() + DONT_UPDATE_UNTIL )
widget.backgroundImage = await transparent(Script.name())
widget.url = 'https://mempool.space'
widget.setPadding(0, 0, 0, 0)

const API_URL = `${widget.url}/api` // trailing slash left off
const MIN_TEXT_SCALE = 0.5

// Required symbols
const totalTxSymbol = getSymbol('creditcard.fill')
const totalSizeSymbol = getSymbol('macmini.fill') // ig this looks close enough to a drive
const totalFeeSymbol = getSymbol('bitcoinsign.circle')
const heightSymbol = getSymbol('tray.and.arrow.up.fill')
const hashrateSymbol = getSymbol('gearshape.2.fill')
const diffSymbol = getSymbol('hammer.fill')

// Prebuild requests
const mempoolInfo = new Request(`${API_URL}/mempool`)
const blockHeight = new Request(`${API_URL}/blocks/tip/height`)
const feeSuggestions = new Request(`${API_URL}/v1/fees/recommended`)
const hashrate = new Request(`${API_URL}/v1/mining/hashrate/1m`) // hashrate and diff



// Build main content stacks
const topStack = widget.addStack()
const mempoolStack = createStack({
    parent: topStack, width: 67.5, height: 115, backgroundColor: "#00000000",
    borderColor: widgetConf.border.color, borderRadius: widgetConf.border.radius,
    borderWidth: widgetConf.border.width, verticalLayout: true,
})
topStack.addSpacer(5)
const hashrateStack = createStack({
    parent: topStack, width: mempoolStack.size.width, height: mempoolStack.size.height,
    backgroundColor: "#00000000", borderColor: widgetConf.border.color,
    borderRadius: widgetConf.border.radius, borderWidth: widgetConf.border.width,
    verticalLayout: true
})
const suggestedFeeStack = createStack({
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
const txImageStack = createStack({
    parent: mempoolStack, width: mempoolStack.size.width,
    height: widgetConf.iconStackHeight, align: 'center'
})
txImageStack.addSpacer()
const txImage = createImage({
    parent: txImageStack, width: widgetConf.iconDims, height: widgetConf.iconDims,
    color: widgetConf.text.color, image: totalTxSymbol.image, align: 'center'
})
txImageStack.addSpacer()
const txTextStack = createStack({
    parent: mempoolStack, width: mempoolStack.size.width,
    height: widgetConf.iconStackHeight, align: 'center'
})
txTextStack.addSpacer()
createText({
    parent: txTextStack,
    content: formatNumber(mempoolData.count),
    minimumScaleFactor: MIN_TEXT_SCALE,
    font: widgetConf.font.small
})
txTextStack.addSpacer()

// Mempool size
const sizeImageStack = createStack({
    parent: mempoolStack, width: mempoolStack.size.width,
    height: widgetConf.iconStackHeight, align: 'center'
})
sizeImageStack.addSpacer()
const sizeImage = createImage({
    parent: sizeImageStack, width: widgetConf.iconDims, height: widgetConf.iconDims,
    color: widgetConf.text.color, image: totalSizeSymbol.image, align: 'center'
})
sizeImageStack.addSpacer()
const sizeTextStack = createStack({
    parent: mempoolStack, width: mempoolStack.size.width,
    height: widgetConf.iconStackHeight, align: 'center'
})
sizeTextStack.addSpacer()
const sizeTextContent = formatNumber(mempoolData.vsize, { notation: 'compact', compactDisplay: 'short' })
createText({
    parent: sizeTextStack,
    content: `${sizeTextContent}vB`,
    minimumScaleFactor: MIN_TEXT_SCALE,
    font: widgetConf.font.small
})
sizeTextStack.addSpacer()

// Mempool fee
const feeImageStack = createStack({
    parent: mempoolStack, width: mempoolStack.size.width,
    height: widgetConf.iconStackHeight, align: 'center'
})
feeImageStack.addSpacer()
const feeImage = createImage({
    parent: feeImageStack, width: widgetConf.iconDims, height: widgetConf.iconDims,
    color: widgetConf.text.color, image: totalFeeSymbol.image, align: 'center'
})
feeImageStack.addSpacer()
const feeTextStack = createStack({
    parent: mempoolStack, width: mempoolStack.size.width,
    height: widgetConf.iconStackHeight, align: 'center'
})
feeTextStack.addSpacer()
const feeTextContent = formatNumber(mempoolData.total_fee / 100000000) // 100 mil
createText({
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
const heightImageStack = createStack({
    parent: hashrateStack, width: hashrateStack.size.width,
    height: widgetConf.iconStackHeight, align: 'center'
})
heightImageStack.addSpacer()
const heightImage = createImage({
    parent: heightImageStack, width: widgetConf.iconDims, height: widgetConf.iconDims,
    color: widgetConf.text.color, image: heightSymbol.image, align: 'center'
})
heightImageStack.addSpacer()

const currHeight = (await blockHeight.loadString())
const heightTextStack = createStack({
    parent: hashrateStack, width: hashrateStack.size.width, align: 'center'
})
heightTextStack.addSpacer()
createText({
    parent: heightTextStack,
    content: currHeight,
    minimumScaleFactor: MIN_TEXT_SCALE,
    font: widgetConf.font.small
})
heightTextStack.addSpacer()

// Global hashrate
const hashrateImageStack = createStack({
    parent: hashrateStack, width: hashrateStack.size.width,
    height: widgetConf.iconStackHeight, align: 'center'
})
hashrateImageStack.addSpacer()
const hashrateImage = createImage({
    parent: hashrateImageStack, width: widgetConf.iconDims, height: widgetConf.iconDims,
    color: widgetConf.text.color, image: hashrateSymbol.image, align: 'center'
})
hashrateImageStack.addSpacer()

const hashrateTextStack = createStack({
    parent: hashrateStack, width: hashrateStack.size.width, align: 'center'
})
// We can afford to lose a bit of precision
const hashps = (Number(miningData.currentHashrate) / Number(1000000000000000000n)).toFixed(2)
hashrateTextStack.addSpacer()
createText({
    parent: hashrateTextStack,
    content: `${hashps}`,
    minimumScaleFactor: MIN_TEXT_SCALE,
    font: widgetConf.font.small
})
hashrateTextStack.addSpacer()
// Difficulty

const diffImageStack = createStack({
    parent: hashrateStack, width: hashrateStack.size.width,
    height: widgetConf.iconStackHeight, align: 'center'
})
diffImageStack.addSpacer()
const diffImage = createImage({
    parent: diffImageStack, width: widgetConf.iconDims, height: widgetConf.iconDims,
    color: widgetConf.text.color, image: diffSymbol.image, align: 'center'
})
diffImageStack.addSpacer()

const diffTextStack = createStack({
    parent: hashrateStack, width: hashrateStack.size.width, align: 'center'
})
diffTextStack.addSpacer()
createText({
    parent: diffTextStack,
    content: formatNumber(miningData.currentDifficulty, { notation: 'compact', compactDisplay: 'short' }),
    minimumScaleFactor: MIN_TEXT_SCALE,
    font: widgetConf.font.small
})
diffTextStack.addSpacer()

///////////////////////
// Suggested tx fees //
///////////////////////

const suggestedFeeData = (await feeSuggestions.loadJSON())
const suggestedFeeTextStack = createStack({
    parent: suggestedFeeStack, width: suggestedFeeStack.size.width, align: 'center'
})
suggestedFeeTextStack.addSpacer()
createText({
    parent: suggestedFeeTextStack,
    content: `${suggestedFeeData.hourFee} sat/vB ${suggestedFeeData.halfHourFee} sat/vB ${suggestedFeeData.fastestFee} sat/vB`,
    minimumScaleFactor: MIN_TEXT_SCALE,
    font: widgetConf.font.small
})
suggestedFeeTextStack.addSpacer()

Script.setWidget(widget)
Script.complete()
widget.presentSmall()