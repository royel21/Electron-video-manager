loadRecent = () => {
    $('#recent-max').val(config.recentMax);
    loadList('#list-recent', config.recents);
};

$('#recent-clear').click(() => {
    config.recents = [];
    loadList('#list-recent', []);
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
});
