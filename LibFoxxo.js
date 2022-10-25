// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: book;
/**
 * Common methods shared by scripts from Ging.
 * Feel free to use in your own scripts :3
 * Author: Ging
 * Name: LibFoxxo
 * Year: 2022
 * Donate: bc1qd65n4y562q6vdp5lx7953uqj0hqxn9k8rqx08y
*/
const SRC_URL = 'https://github.com/ExperiBass/scriptable-scripts/raw/master/LibFoxxo.js'
const UPDATE_PERIOD = 7 // days

// Classes

// Horizontal progress bar
class HorizontalProgressBar {
    #ctx = new DrawContext()
    constructor({
        width = 100,
        height = 20,
        fillColor = "#7814CF",
        backgroundColor = "#00ffff",
        cornerRadius = 10,
        respectScreenScale = true,
        progressPercentage = 0,
        progressSteps = 100, // Progress precision
        transparent = true // background
    }) {
        const progressStepLength = (width / progressSteps).toFixed(3)
        this.#ctx.opaque = !transparent
        this.#ctx.size = new Size(width, height)
        this.#ctx.respectScreenScale = respectScreenScale

        // draw the bar background
        const bgPath = new Path()
        const bgRect = new Rect(0, 0, width, this.#ctx.size.height)
        bgPath.addRoundedRect(bgRect, cornerRadius, cornerRadius)
        this.#ctx.addPath(bgPath)
        this.#ctx.setFillColor(new Color(backgroundColor))
        this.#ctx.fillPath()

        // draw the progressbar
        // determine the number of pixels needed
        const progressLength = (progressStepLength * progressPercentage)
        const progressPath = new Path()
        const progressRect = new Rect(0, 0, progressLength, this.#ctx.size.height)
        progressPath.addRoundedRect(progressRect, cornerRadius, cornerRadius)
        this.#ctx.addPath(progressPath)
        this.#ctx.setFillColor(new Color(fillColor))
        this.#ctx.fillPath()
    }
    toImage() {
        return this.#ctx.getImage()
    }
    get canvas() {
        return this.#ctx
    }
}


module.exports = {
    /**
     * Method to update your scripts. All it does is update, you'll have to implement your own update cycle code.
     * An example is at the bottom of this file.
     * @param {string} filename The name of the file to update. You should pass `module.filename`.
     * @param {string} srcurl URL to the source code. Needs to be plaintext.
     * @param {FileManager} fs The FileManager for your script.
     * @param {boolean} shouldPiggyback Update this helper script! Set to `true` if you want us to piggyback off your updating. Defaults to false.
     * @param {*} alertOptions Options to pass to createAlert.
     * @param {string} alertOptions.title
     * @param {string} alertOptions.message
     * @param {string} alertOptions.failMessage
     * @returns {boolean} true if success, false otherwise.
     */
    async selfUpdate({ filepath, srcurl, fs, shouldPiggyback = false }) {
        try {
            const req = new Request(srcurl)
            fs.writeString(filepath, await req.loadString())

            if (shouldPiggyback) {
                // piggyback off of the end user and update ourselves too
                const lastUpdated = fs.modificationDate(module.filename)
                if (module.exports.determineDaysFromNow(lastUpdated) >= UPDATE_PERIOD) {
                    const selfup = new Request(SRC_URL)
                    fs.writeString(module.filename, await selfup.loadString())
                }
            }
            return true
        } catch (e) {
            console.error(`[LibFoxxo][selfUpdate]: ${e}`)
            return false
        }
    },
    /**
     * CreateAlert
     * @param {*} title - Title of the alert.
     * @param {*} msg - Message of the alert.
     * @param {*} options
     * @param {[any]} options.actions - Actions to add to the alert. An action object is formatted like this:
     * {
     *    "type": "default" // corresponds to the Alert methods. Other values: 'cancel', 'destructive', 'secure', 'text'
     *    "title": "FooBar" // title displayed on the action
     *    "text": "oh" // used with type = 'secure'||'text', this is the default text in the field.
     *    "placeholderText": "owo" // used alongside "text", this is the placeholder text displayed.
     * }
     * @returns {Alert} - An Alert object.
     */
    async createAlert(title, msg, options = { actions: [] }) {
        const alrt = new Alert()
        alrt.title = title
        alrt.message = msg

        for (const action of options.actions) {
            switch (action.type) {
                case 'cancel': {
                    alrt.addCancelAction(action.title)
                    break
                }
                case 'destructive': {
                    alrt.addDestructiveAction(action.title)
                    break
                }
                case 'secure': {
                    alrt.addSecureTextField(action.placeholderText, action.text)
                    break
                }
                case 'text': {
                    alrt.addTextField(action.placeholderText, action.text)
                    break
                }
                default: {
                    alrt.addAction(action.title)
                }
            }
        }
        return alrt
    },
    isIniCloud(fs, file) {
        return fs.isFileStoredIniCloud(file)
    },
    formatNumber(number, options) {
        return new Intl.NumberFormat(undefined, options).format(number)
    },
    getFile(fs, path) {
        return fs.joinPath(fs.documentsDirectory(), path)
    },
    async loadImage(imgUrl) {
        const req = new Request(imgUrl)
        return await req.loadImage()
    },
    getSymbol(name, font) {
        const symbol = SFSymbol.named(name)
        if (font) {
            symbol.applyFont(font)
        }
        return symbol
    },
    createStack({
        parent = null,
        width = 0, // px
        height = 0, // px
        backgroundColor = null, // hexadecimal notation
        borderColor = "#000000",
        borderRadius = 4, // px
        borderWidth = 0, // px
        verticalLayout = false,
        padding = [0, 0, 0, 0], // array of 4 numbers
        align = 'top' // 'top', 'center', 'bottom'
    }) {
        try {
            if (!parent) {
                throw Error('parent not defined')
            }
            const stacc = parent.addStack()

            stacc.size = new Size(width, height)
            stacc.borderWidth = borderWidth
            stacc.borderColor = new Color(borderColor)
            stacc.cornerRadius = borderRadius

            if (backgroundColor) {
                stacc.backgroundColor = new Color(backgroundColor)
            }
            if (verticalLayout) {
                stacc.layoutVertically()
            } else {
                stacc.layoutHorizontally()
            }
            stacc[`${align.toLowerCase()}AlignContent`]()
            stacc.setPadding(...padding)

            return stacc
        } catch (e) {
            throw Error(`[LibFoxxo][createStack]: ${e}`)
        }
    },
    createImage({
        parent = null,
        image = null,
        width = 0,
        height = 0,
        resizable = true,
        color = null,
        align = 'left' // 'left', 'center', 'right'
    }) {
        try {
            if (!parent) {
                throw Error('parent not defined')
            }
            const img = parent.addImage(image)
            img.imageSize = new Size(width, height)
            img.resizable = resizable
            if (color) {
                img.tintColor = new Color(color)
            }
            img[`${align.toLowerCase()}AlignImage`]()
            return img
        } catch (e) {
            throw Error(`[LibFoxxo][createImage]: ${e}`)
        }
    },
    createText({
        parent = null,
        content = "",
        font = null,
        maxLines = 0,
        minimumScaleFactor = 1,
        url = null,
        align = 'left' // 'left', 'center', 'right'
    }) {
        try {
            if (!parent) {
                throw Error('parent not defined')
            }
            const txt = parent.addText(content)
            txt.lineLimit = maxLines
            if (font) {
                txt.font = font
            }
            txt.minimumScaleFactor = minimumScaleFactor
            if (url) {
                txt.url = url
            }
            txt[`${align.toLowerCase()}AlignText`]()
            return txt
        } catch (e) {
            throw Error(`[LibFoxxo][createText]: ${e}`)
        }
    },
    determineDaysFromNow(date) {
        const msInDay = 24 * 60 * 60 * 1000
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        date.setHours(0, 0, 0, 0)

        return (+now - +date) / msInDay
    },
    HorizontalProgressBar
}
Script.complete()