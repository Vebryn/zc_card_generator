

var uid;

var FIREBASE_APP_URL = "https://cartes-equip-zc.firebaseio.com/";

$(document).ready(function() {
	
	$.toaster({ settings : {
		'timeout'      : 4000
	} });
	
	on_disconnected();
	
	var ref = new Firebase(FIREBASE_APP_URL);
	ref.onAuth(authDataCallback);
	
	$("#google_connect").click(google_connect);


});

function on_connected(){
	$("#upload_button").off("click");
	$("#upload_button").click(upload);
}

function on_disconnected(){
	$("#saved_card_list").empty();
	$("#upload_button").off("click");
	$("#upload_button").click(disconnected_toast);
}

function disconnected_toast(){
	$.toaster("Vous devez être connecté pour effectuer cette action", "Erreur",'danger');
}


function google_connect(){
	var ref = new Firebase(FIREBASE_APP_URL);
	ref.authWithOAuthPopup("google", function(error, authData) {
	  if (error) {
		$.toaster("impossible de se connecter",'Erreur',  'danger');
	  } else {
		 on_disconnected();
		$.toaster('Vous êtes connecté', "Information", 'info');
		on_connected();
		console.log("Authenticated successfully with payload:", authData);
	  }
	});
}

// Create a callback which logs the current auth state
function authDataCallback(authData) {
  if (authData) {
	$.toaster('Vous êtes connecté', "Information", 'info');
	on_connected();
	uid = authData.uid;
    console.log("User " + authData.uid + " is logged in with " + authData.provider);
	load_saved_card_names();
  } else {
	$.toaster('Vous êtes déconnecté', "Information", 'info');
    console.log("User is logged out");
  }
}

function load_saved_card_names(){
	$("#saved_card_list").empty();
	$.toaster('Chargement de la liste des cartes sauvegardées', "Information", 'info');
	var ref = new Firebase(FIREBASE_APP_URL + "users/" + uid + "/card_names/");
	
	ref.once("value", function(snapshot) {
	
	  var card_names = snapshot.val();
	  console.log(card_names);
	  
	  for(card_name_id in card_names){
		  add_saved_card_name_to_page(card_names[card_name_id]);
	  }
	  
	  $.toaster($("#saved_card_list li").length + " cartes ont été chargées", "Information", 'info');
	  
	  $(".saved_card").click(load_saved_card);
	  
	  
	}, function (errorObject) {
		$.toaster('Echec du chargement', "Information", 'danger');
	  console.log("The read failed: " + errorObject.code);
	});
}

function add_saved_card_name_to_page(card_name){
	$("#saved_card_list").append("<li><a href=\"#\" id=\"" + card_name.card_id + "\" class=\"saved_card\">" + get_locale_string_gen(card_name, "card_name", default_langage) + "</a></li>")
}

function upload(){
	$.toaster('Sauvegarde de la carte en cours', "Information", 'info');
	var card_ref;
	
	if(!current_card.card_id){
		card_ref = new Firebase(FIREBASE_APP_URL + "users/" + uid + "/cards/").push()
	} else {
		card_ref = new Firebase(FIREBASE_APP_URL + "users/" + uid + "/cards/" + current_card.card_id);
	}
	
	
	card_ref.set(current_card, function(error) {
		  if (error) {
			$.toaster('Echec de la sauvegarde', "Erreur", 'danger');
		  } else {
			  add_card_name_to_database(card_ref.key(), current_card);
		  }
	});
}

function add_card_name_to_database(card_id, card){
	
	console.log(card_id);
	
	var ref = new Firebase(FIREBASE_APP_URL + "users/" + uid + "/card_names/"+card_id);
	
	var card_name = new Object();
	card_name.card_id=card_id;
	
	// on recherche toutes les traductions du nom de la carte pour ne pas la code en dur
	for(p in card){
		if(p.startsWith("card_name_")){
			card_name[p] = card[p];
		}
	}
	
	ref.set(card_name, function(error) {
		  if (error) {
			$.toaster('Echec de la sauvegarde', "Erreur", 'danger');
		  } else {
			  load_saved_card_names();
			 $.toaster('Sauvegarde terminée', "Information", 'info');
		  }
	});
	
}

function load_saved_card(){
	$.toaster('Chargement de la carte demandée en cours', "Information", 'info');
	console.log($(this).attr("id"));
	
	var card_id = $(this).attr("id");
	var ref = new Firebase(FIREBASE_APP_URL + "users/" + uid + "/cards/"+card_id);
	
	ref.once("value", function(snapshot) {
		$.toaster('Chargement terminé', "Information", 'info');
		current_card = snapshot.val();
		current_card.card_id = card_id;
		console.log(current_card);
		load();
	  	  
	}, function (errorObject) {
	  $.toaster('Echec du chargement', "Erreur", 'danger');
	});
	
}