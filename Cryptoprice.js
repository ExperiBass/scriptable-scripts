// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: dollar-sign;
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software
// and associated documentation files (the "Software"), to deal in the Software without restriction,
// including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies
// or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
// INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE
// AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


//// I dont know if i need this notice, as i've rewritten most of the code to bring it up to date,
//// as well as added functionality. Oh well!
/**
 * Displays cryptocurrency price information from CoinGecko.
 * Modified from the featured "Crypto Price" widget.
 * Name: Cryptoprice
 * Author: Ging
 * Year: 2022
*/
const PRESENT_SIZE = "Small"
// Widget setup
const common = importModule('ging-common')
const FONT = Font.mediumSystemFont(16)

const params = args.widgetParameter ? args.widgetParameter.split(',') : ['bitcoin', 'ethereum']
const env = config

// Select file source
const files = common.isIniCloud(FileManager.local(), module.filename) ? FileManager.iCloud() : FileManager.local()
const bgPath = common.getFile(files, '/rice/topleft.jpg')

// Self-update
if (!env.widgetFamily) {
    // check file update date
    const UPDATE_PERIOD = 30 // days
    const lastUpdated = files.modificationDate(module.filename)
    if (common.determineDaysFromNow(lastUpdated) >= UPDATE_PERIOD) {
        // Update
        (await common.selfUpdate({
            srcurl: 'https://github.com/ExperiBass/scriptable-scripts/raw/master/Cryptoprice.js',
            filename: module.filename, fs: files, shouldPiggyback: true
        }))
    }
}

const widget = new ListWidget()
widget.backgroundImage = files.readImage(bgPath)

async function buildWidget() {
    for (const coin of params) {
        try {
            await addCryptoLine(coin)
        } catch (e) {
            console.error(e)
        }
    }
}

async function addCryptoLine(name) {
    const {
        image,
        symbol,
        price,
        grow,
        growPercent,
        id
    } = await fetchCoinInfo(name)

    const rowStack = common.createStack({
        parent: widget, padding: [2, 2, 0, 0],
        align: 'center', verticalLayout: false
    })

    if (env.widgetFamily && env.widgetFamily !== "small") {
        rowStack.url = `https://www.coingecko.com/en/coins/${id}`
        const imageStack = common.createStack({ parent: rowStack, padding: [0, 0, 0, 5] })
        common.createImage({
            parent: imageStack,
            image: await common.loadImage(image),
            width: 20, height: 20, align: 'left'
        })
    }
    const symbolStack = common.createStack({ parent: rowStack, padding: [0, 0, 0, 5] })
    rowStack.addSpacer()
    const priceStack = common.createStack({ parent: rowStack, padding: [0, 0, 0, 0] })


    // The text
    const symbolText = symbolStack.addText(symbol)
    symbolText.font = FONT
    symbolText.leftAlignText()
    const priceText = priceStack.addText(price)
    priceText.font = FONT
    priceText.rightAlignText()

    symbolText.textColor = new Color('#FFFFFF')

    if (env.widgetFamily && env.widgetFamily !== "small") {
        const percentStack = common.createStack({ parent: rowStack, padding: [0, 0, 8, 0] })
        const percentText = percentStack.addText(growPercent)
        if (grow) {
            percentText.textColor = new Color('#4AF956')
            percentText.text = `+${percentText.text}`
        } else {
            percentText.textColor = new Color('#FD4E00')
        }
    }

}

async function fetchCoinInfo(coinID) {
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinID}`

    const req = new Request(url)
    const apiResult = (await req.loadJSON())[0]
    return {
        price: common.formatNumber(apiResult.current_price),
        grow: (apiResult.price_change_24h > 0),
        growPercent: `${common.formatNumber(apiResult.price_change_percentage_24h, { style: 'percent', maximumFractionDigits: 2 })}`,
        symbol: apiResult.symbol.toUpperCase(),
        image: apiResult.image, id: apiResult.id
    }
}

await buildWidget()

Script.setWidget(widget)
Script.complete()
widget[`present${PRESENT_SIZE}`]()
