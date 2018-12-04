
const StreamZip = require('node-stream-zip');
const sharp = require('sharp');
const rcunrar = require('rcunrar');
const app = require('electron').remote.app

module.exports = async function CreateCover(data) {
    try {
        for (const file of data.files) {
            //var coverP = path.join(app.getAppPath(), 'covers', file.name + ".jpg");
            var coverP = path.join('./covers', file.name + ".jpg");
            var state;
            switch (String(file.name).split('.').pop().toLocaleLowerCase()) {
                case "zip": {
                    state = await ZipCover(file.name, coverP, data.basedir);
                    break;
                }
                case "rar": {
                    state = await RarCover(file.name, coverP, data.basedir);
                    break;
                }
            }
            if (state) {
                var n = file.name.replace(/[#]/g, '%23');
                var img = $($('.items').get(file.index)).find('img')[0];
                img.dataset.src = 'covers/' + n + '.jpg';
            }
        }
    } catch (error) {
        console.log(error)
    }
}

function RarCover(filename, coverP, basedir) {
    var p = path.join(basedir, filename)
    let rar = new rcunrar(p);
    var list = rar.ListFiles().sort(sortFiles);

    var firstImg = list.find(e => {
        return ['png', 'jpg', 'jpeg', 'gif'].includes(e.Extension.toLocaleLowerCase()) && e.Size > 1024 * 30
    });

    if (firstImg == undefined) return false;

    var data = rar.ExtractFile(firstImg);
    return new Promise((resolve, reject) => {
        sharp(data).resize(240).jpeg({
            quality: 80
        }).toFile(coverP, (error) => {
            resolve(coverP);
        });
    });
}

function ZipCover(filename, coverP, basedir) {
    var zip = new StreamZip({
        file: path.join(basedir, filename),
        storeEntries: true
    });
    return new Promise((resolve, reject) => {
        zip.on('ready', () => {

            var entries = Object.values(zip.entries()).sort((a, b) => {
                return String(a.name).localeCompare(String(b.name))
            });
            
            var firstImg = entries.find(e => {
                return ['png', 'jpg', 'jpeg', 'gif'].includes(e.name.toLocaleLowerCase().split('.').pop())
                    && e.size > 1024 * 30
            });

            if (firstImg == undefined) {
                resolve(false);
            } else {
                sharp(zip.entryDataSync(firstImg)).jpeg({
                    quality: 80
                }).resize(240).toFile(coverP, (error) => {
                    resolve(coverP);
                });
            }
        });
    });
}


/***********************************************************/
sortFiles = (a, b) => {
    var a1 = a;
    var b1 = b;
    if (['[', '('].includes(String(a))) {
        a1[0] = '0';
    }
    if (['[', '('].includes(String(b))) {
        b1[0] = '0';
    }
    return String(a1).localeCompare(String(b1));
}
/********************************************/