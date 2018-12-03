const Sequelize = require("sequelize");
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

var dbPath = path.join(os.homedir(), '.RCVideoPlayer/mangas.db');

const Op = Sequelize.Op
const db = new Sequelize('sqlite:./'+dbPath, {
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
    }
},
    {
        timestamps: false
    })

const VideoFile = db.define('videofiles', {
    Id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    Name: {
        type: Sequelize.STRING,
        unique: true
    },
    CurrentPos: {
        type: Sequelize.INTEGER.UNSIGNED,
        defaultValue: 0
    },
    Size: {
        type: Sequelize.INTEGER.UNSIGNED
    }
},
    {
        timestamps: false
    });

const FavoriteVideo = db.define('favoritevideos', {
    id: {
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

VideoFile.belongsTo(Folder);
Folder.hasMany(VideoFile);
FavoriteVideo.hasMany(VideoFile);

init = async () => {
    if (!fs.existsSync(dbPath)) {
        await db.sync({ logging: true });
    }
}

module.exports = {
    VideoFile,
    FavoriteVideo,
    Folder,
    init,
    Op,
    db
}