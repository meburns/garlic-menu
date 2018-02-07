const {app, Tray, Menu, nativeImage, net} = require('electron')
var moment = require('moment')
var Jimp = require("jimp")
let tray = null

// Stop the app from suspending (Must be kept outside of app->ready)
const powerSaveBlocker = require('electron').powerSaveBlocker
powerSaveBlocker.start('prevent-app-suspension')

// Main method
app.on('ready', () => {
  // hide the app's dock icon (MacOS only)
  if (process.platform == 'darwin') {
    app.dock.hide()
  }

  // yum, get the current value of garlic. This will get called a lot :)
  const getGarlic = () => {
    let request = net.request('https://api.coinmarketcap.com/v1/ticker/garlicoin')
    request.on('response', (response) => {
      response.on('data', (chunk) => {
        // Get the current value of GRLC in USD and format it
        let amount = JSON.parse(chunk)[0].price_usd
        let pretty_amount = Number.parseFloat(amount).toFixed(2)

        // Set the tooltip to show full value and time updated
        tray.setToolTip(`$${amount} updated at ${moment().format("h:mm")}`)

        // different Operating Systems require different methods
        if (process.platform == 'darwin') {
          // MacOs is the easiest, just set the title
          tray.setTitle(`$${pretty_amount}`)
        } else {
          // On every other system, we have to print the amount to a new image,
          // and then update the icon to use the newly created image
          let templatePath = __dirname + '/icons/blank_template_small.png'
          let loadedImage

          Jimp.read(templatePath)
              .then(function (image) {
                  loadedImage = image
                  return Jimp.loadFont(Jimp.FONT_SANS_16_WHITE)
              })
              .then(function (font) {
                  loadedImage.print(font, 0, 12, pretty_amount)
                  // define how we want to export the image, and then handle it in a callback func
                  loadedImage.getBase64(Jimp.MIME_PNG, setImageIcon)
              })
        }
      })
    })
    request.end()
  }

  // Callback function for updating the tray icon from a jimp compiled image
  var setImageIcon = function(err, data) {
    if (data) {
      let icon = nativeImage.createFromDataURL(data)
      tray.setImage(icon)
    }
  }

  // setup the tray item and menu
  let iconPath = __dirname + '/icons/garlicoin_icon_pixel_small.png'
  let icon = nativeImage.createFromPath(iconPath)
  tray = new Tray(icon)
  var trayMenu = Menu.buildFromTemplate([
    {
      label: 'Refresh Price',
      click: getGarlic
    },
    {
      label: 'Quit',
      click: () => { app.quit() }
    }
  ])
  tray.setContextMenu(trayMenu)

  // get the price when the app starts
  getGarlic()

  // get an updated price every minute after
  setInterval(() => {
    getGarlic()
  }, 60000)
})

app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})