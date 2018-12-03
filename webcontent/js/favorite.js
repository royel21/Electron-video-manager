var $favSelect = $('#fav-select');
var $favList = $('#"list-fav-files');
var CurrentFav = null;



$('#fav-delete').click(e=>{
    console.log('remove fav');
});

$('#fav-create').click(e=>{

   db.Favorite.create({Name: name});
   
});

addToFav = (name) =>{
    
}