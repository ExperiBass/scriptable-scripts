// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: dollar-sign;
/*
 * Sats per usd, for bitcoin natives :3.
 * Name: Foxprice
 * Author: Ging
 * Year: 2022
 * Deps:
 * - https://github.com/supermamon/scriptable-no-background
 * - https://github.com/ExperiBass/scriptable-scripts/blob/master/LibFoxxo.js
*/
const PRESENT_SIZE = "Small"
// Widget setup
const {
    isIniCloud, selfUpdate,
    determineDaysFromNow,
    createStack, createImage,
    formatNumber, loadImage
} = importModule('LibFoxxo')
const { transparent } = importModule('no-background')
const FONT = Font.mediumSystemFont(16)

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
            srcurl: `https://github.com/ExperiBass/scriptable-scripts/raw/master/${Script.name()}.js`,
            filepath: module.filename, fs: files, shouldPiggyback: true
        }))
    }
}

const widget = new ListWidget()
const DONT_UPDATE_UNTIL = 30 * 60 * 1000 // 30m
widget.refreshAfterDate = new Date((new Date()).valueOf() + DONT_UPDATE_UNTIL) // make sure we're not abusing the ratelimit
widget.backgroundImage = await transparent(Script.name())

async function draw() {
    const url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&precision=2"
    const req = new Request(url)
    const apiResult = (await req.loadJSON())
    if (apiResult.status && apiResult.status.error_code) {
        // back off if we have a error
        widget.refreshAfterDate = new Date((new Date()).valueOf() + DONT_UPDATE_UNTIL)
        return
    }
    const precision = 8
    const spd = (1 / apiResult.bitcoin.usd).toFixed(precision) * parseInt("1"+"0".repeat(precision))
    const rowStack = createStack({
        parent: widget, padding: [2, 2, 0, 0],
        align: 'center', verticalLayout: false
    })
    const satsPerDollarStack = createStack({ parent: rowStack, padding: [0, 0, 0, 0] })

    // sometimes the classic fp bug crops up, force it into a decimal
    // nobody cares about .0000000000002 of a sat
    const spdText = satsPerDollarStack.addText(`${spd.toFixed(0)}`)
    spdText.font = FONT
    spdText.centerAlignText()
}

try {
    await draw()
    Script.setWidget(widget)
    Script.complete()
    widget[`present${PRESENT_SIZE}`]()
} catch (e) {
    console.error(e)
}
