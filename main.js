const {app, Tray, Menu, nativeImage} = require('electron')
let tray = null

// Stop the app from suspending (Must be kept outside of app->ready)
const powerSaveBlocker = require('electron').powerSaveBlocker;
powerSaveBlocker.start('prevent-app-suspension');

// Main method
app.on('ready', () => {
  // define the api endpoint
  const {net} = require('electron')

  // hide the app's dock icon (MacOS only)
  if (process.platform == 'darwin') {
    app.dock.hide()
  }

  // yum, get the current value of garlic. This will get called a lot :)
  const getGarlic = () => {
    const request = net.request('https://api.coinmarketcap.com/v1/ticker/garlicoin')
    request.on('response', (response) => {
      response.on('data', (chunk) => {
        const amount = JSON.parse(chunk)[0].price_usd;
        tray.setToolTip(`$${amount}`);
        tray.setTitle(`$${Number.parseFloat(amount).toFixed(2)}`)
      })
    })
    request.end()
  }

  // setup the tray item and menu
  let icon = nativeImage.createFromDataURL(base64Icon)
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

// set tray icon as base64, may change this to the icon file in the future
let base64Icon = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAAAAXNSR0IArs4c6QAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAA3XAAAN1wFCKJt4AAABWWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS40LjAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyI+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgpMwidZAAAD0klEQVQ4EZ2UbUwURxjHn3253XtDOTnvKBewINikxlxocyKQkpNrEUOJUkOsJibVpI1f2i817ReTXozxm18arQlpaqs2Mdo2rUJq/VBBCuVFSVW0ihQVSgUOLse9sNzt3kxnhluyNgdiJ9mbmeeZ/2//88zcAizfOEOajo1zQ2rlwxcB/K8XUhEP0CyQnj5kzFxn4n6RzF+4UciKmt/vN/93IXWRrVEoookNXq9nZtKzASDfAWBPAoSTFy40S4K6qjAOeRUvF3k+AKRVN73j7e7rG04TCStjtq3QBGp401fSdgcfUJLcGzU1pvw1dk7RNMujuOKMHPjkkRxX0uuqS+RNksTnRONqa16eQqGLjdEXZws1RD6fb+M/UXxi/zanv6nWBYVuGSamU3D+yiQcuxSBvT4z1Fc6YJVNhDOt42rn/cTB0MitrwiH8jDlGR2z7e9rqnKd7VWOt3xY5N+zvSBtNQv4z79i/KX2KZyYV/H5QwW4cpOD87jNuL1/2vTToBKuKzP3/DxCcdnBLHO2I9Hw/nbHtp0BN5Zknjv945hw7pcZ2Fe/BvY2vATr8i3ASzyEZ1KotTMEVsBjpUVSiIkNP/rJs7qeDpLTDWtVOwNrwW4z4S+/G+WuD0Th80Pr4b0dhVBcaF3wpCF8dzgKZ67NQnmRnJyILxCDBrBeClabjj+AXBucW+CSYeBeBNpvROHYR+uhtMQOKIVAVRGYRB4iUZW70j2NK8ssYBKQ7eLFWXZWRrDumBVccsUSYBdDdx/G4TKpaXOdE0qLbZAmUIQx8DzRk6f3ThiUpIYP7vJArl3wAMTIVXy2GcF8S8tNtfZ187Xj58a1x+NzwmsbV2OMMINSmSAJ8HRyntyECQhU5HHeV3LIFeBIfcTcZ7EL10uPMdc1W91tQ09T36RUIiEGObOATDIPoizATDgJLd8/AY9TgsAWF8TmVHgwloxvrV4d0SF6rzumcwrmg8HLc42bLUf7h+avX+0K8X+PJqjL9M3bYThyaghmYyp8vL8EmWUB9Q9GoOd35dfGzcWjGSAzR8es6Jmg3tGXodJXveUcL35RXpazxUIcSyLSaiscuL7aDTarKFztmuIPn3w8Tv4je7r6+jqJhul0SDYwzdE4fvutirKRKfQZ2cvuXQGnWFflBFJ06L0Vhq/bQsPxBPr0ycOBHzIwpsmMszrWc8xBMNho/a1j+l1AaEdsHuX33tbmQEn1+Kss37Z33xjMBtUBy/XGrx91JJAvmzFGtUvtejkuy1Hn2cQ0vmTLJlhqMV2rr6env3gDlhKsNG4EP1fzL9DGYnX3qog4AAAAAElFTkSuQmCC`
