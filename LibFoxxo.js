// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-gray; icon-glyph: magic;
/**
 * Common methods shared by scripts from Ging.
 * Feel free to use in your own scripts :3
 * Author: Ging
 * Name: LibFoxxo
 * Year: 2022
 * Donate: bc1qd65n4y562q6vdp5lx7953uqj0hqxn9k8rqx08y
*/
const SRC_URL = 'https://github.com/ExperiBass/scriptable-scripts/raw/master/LibFoxxo.js'

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
    async selfUpdate({ filename, srcurl, fs, shouldPiggyback = false, alertOptions = {
        title: 'Update complete!',
        message: 'The script has been updated!', failMessage: 'The script failed to update! D:'
    } }) {
        try {
            const req = new Request(srcurl)
            fs.writeString(filename, await req.loadString())

            if (shouldPiggyback) {
                // piggyback off of the end user and update ourselves too
                const selfup = new Request(SRC_URL)
                fs.writeString(module.filename, await selfup.loadString())
            }

            const alert = await module.exports.createAlert(alertOptions.title, alertOptions.message, {
                actions: [{
                    type: 'default',
                    title: "OK"
                }]
            })
            alert.presentAlert()
            return true
        } catch (e) {
            console.error(`[ging-common][selfUpdate]: ${e}`)
            const alert = await module.exports.createAlert(alertOptions.title, alertOptions.failMessage, {
                actions: [{
                    type: 'default',
                    title: "OK"
                }]
            })
            alert.presentAlert()
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
        font = null,
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
            if (font) {
                stacc.font = font
            }
            stacc[`${align.toLowerCase()}AlignContent`]()
            stacc.setPadding(...padding)

            return stacc
        } catch (e) {
            throw Error(`[ging-common][createStack]: ${e}`)
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
            throw Error(`[ging-common][createImage]: ${e}`)
        }
    },
    determineDaysFromNow(date) {
        const msInDay = 24 * 60 * 60 * 1000
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        date.setHours(0, 0, 0, 0)

        return (+now - +date) / msInDay
    }
}


if (config.runsInApp) {
    // Update if called
    const files = module.exports.isIniCloud(FileManager.local(), module.filename) ? FileManager.iCloud() : FileManager.local()
    module.exports.selfUpdate({
        filename: module.filename,
        srcurl: SRC_URL,
        fs: files,
        shouldPiggyback: false, // Dont double-update x3
        alertOptions: {
            title: 'Woah, so fancy!',
            message: `${module.filename} has sucessfully updated!`,
            failMessage: `${module.filename} failed to update! The error is in the console.`
        }
    })
    Script.complete()
}