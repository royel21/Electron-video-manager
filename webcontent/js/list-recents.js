rcount = () =>{return config.recents.length}

loadRecent = () => {
    $('#recent-max').val(config.recentMax);
    loadList('list-recent', config.recents, true);
    $('#recent-count').text((rcount())+"/"+config.recentMax);
};

$('#recent-clear').click(() => {
    config.recents = [];
    loadList('list-recent', [], true);
    $('#recent-count').text("0/"+config.recentMax);
});

$('#recent').on('click', '.fa-trash-alt', (e) => {
    var el = e.target.closest('li');
    var Id = el.id.replace('file-','');
    $(el).fadeOut('fast',()=>{
        config.recents.removeById({Id});
    });
});

$('#recent-max').change((e)=>{
    config.recentMax = e.target.value;
    $('#recent-count').text(rcount()+"/"+config.recentMax);
});
