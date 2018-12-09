const Sequelize = require("sequelize");
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

var dbPath = path.join(os.homedir(), './.mangas-common/mangas.db');

const Op = Sequelize.Op
const db = new Sequelize('sqlite:./' + dbPath, {
    logging: false,
    operatorsAliases: {
        $and: Op.and,
        $or: Op.or,
        $eq: Op.eq,
        $gt: Op.gt,
        $lt: Op.lt,
        $lte: Op.lte,
        $like: Op.like,
        $ne: Op.not
    }
});

const Folder = db.define('folders', {
    Id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    Name: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
    },
    folderId: {
        type: Sequelize.INTEGER,
        references: {
            model: "folders",
            key: "Id"
        }
    }
}, {
    timestamps: false
})

const File = db.define('files', {
    Id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    Name: {
        type: Sequelize.STRING,
        unique: true
    },
    Current: {
        type: Sequelize.INTEGER(5).UNSIGNED,
        defaultValue: 0
    },
    Total: {
        type: Sequelize.INTEGER(5).UNSIGNED,
        defaultValue: 0
    },
    Size: {
        type: Sequelize.INTEGER.UNSIGNED
    }
}, {
    timestamps: false
});

File.findByName = (file) => {
    return File.findOne({
        where: {
            Name: file.Name
        },
        include: {
            model: Folder
        }
    });
}

File.findOrCreateNew = (file) => {
    return new Promise((resolve, reject) => {
        Folder.findOrCreate({
            where: {
                Name: file.DirName
            }
        }).then(folder => {
            File.create({
                Name: file.FileName,
                folderId: folder[0].Id,
                Total: file.Total,
                Size: file.Size
            }).then(f => {
                resolve(f);
            });
        });
    });
}

const FavoriteFile = db.define('favoritefiles', {
    Id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    Name: {
        type: Sequelize.STRING(100),
        unique: true
    }
}, {
    timestamps: false
});

File.belongsTo(Folder);
Folder.hasMany(File);
Folder.hasMany(Folder);
FavoriteFile.hasMany(File);
FavoriteFile.hasMany(Folder);

init = async () => {
    if (!fs.existsSync(dbPath)) {
        await db.sync({
            logging: true
        });
        await FavoriteFile.findOrCreate({
            where: {
                Name: "Folders"
            }
        });
    }
}

module.exports = {
    File,
    FavoriteFile,
    Folder,
    init,
    Op,
    db
}