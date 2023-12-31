/*
*@autor: Rio 3D Studios
*@description:  java script server that works as master server of the Chat GPT Sample of WebGL Multiplayer Kit
*/
var express  = require('express');//import express NodeJS framework module
var app      = express();// create an object of the express module
var http     = require('http').Server(app);// create a http web server using the http library
var io       = require('socket.io')(http);// import socketio communication module

const { Configuration, OpenAIApi } = require("openai");// import openai API
const apiConfig = require('./config/api');


const configuration = new Configuration({
  apiKey: apiConfig.OPENAI_API_KEY, //YOUR_API_KEY
});
const messages = [];
const openai = new OpenAIApi(configuration);


app.use("/public/TemplateData",express.static(__dirname + "/public/TemplateData"));
app.use("/public/Build",express.static(__dirname + "/public/Build"));
app.use(express.static(__dirname+'/public'));

var clients			= [];// to storage clients
var clientLookup = {};// clients search engine
var sockets = {};//// to storage sockets


//open a connection with the specific client
io.on('connection', function(socket){

   //print a log in node.js command prompt
  console.log('A user ready for connection!');
  
  //to store current client connection
  var currentUser;
	
	//create a callback fuction to listening EmitJoin() method in NetworkMannager.cs unity script
	socket.on('JOIN', function (_data)
	{
	
	    console.log('[INFO] JOIN received !!! ');
		
		var data = JSON.parse(_data);

         // fills out with the information emitted by the player in the unity
        currentUser = {
			       id:socket.id,//alternatively we could use socket.id
			       name:data.name,
				   socketID:socket.id
				   };//new user  in clients list
					
		console.log('[INFO] player '+currentUser.name+': logged!');
		

		 //add currentUser in clients list
		 clients.push(currentUser);
		 
		 //add client in search engine
		 clientLookup[currentUser.id] = currentUser;
		 
		 console.log('[INFO] Total players: ' + clients.length);
		 
		 	
		sockets[currentUser.id] = socket;//add curent user socket
		 
		 /*********************************************************************************************/		
		
		//send to the client.js script
		socket.emit("JOIN_SUCCESS",currentUser.id,currentUser.name);
		
        
	
	});//END_SOCKET_ON
	
	

		
	//create a callback fuction to listening EmitMoveAndRotate() method in NetworkMannager.cs unity script
	socket.on('MESSAGE',  async (_data) => {
	
	try {	
	  var data = JSON.parse(_data);	
	  console.log("_data: "+data.message);
	  
	  
	  if(currentUser)
	  {
		messages.push({ role: "user", content: data.message});
    
        const completion = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages:  messages,
        });

        const completion_text = completion.data.choices[0].message.content;
        console.log(completion_text);
		
	    // send the completion text to the client
       socket.emit('UPDATE_MESSAGE', completion_text);
	 
     }
	 }//END_TRY
	 catch (error) {
      console.error(error);
    }
	   
	});//END_SOCKET_ON
	
	

    // called when the user desconnect
	socket.on('disconnect', function ()
	{
     
	    if(currentUser)
		{
		 currentUser.isDead = true;
		 
		 //send to the client.js script
		 //updates the currentUser disconnection for all players in game
		 socket.broadcast.emit('USER_DISCONNECTED', currentUser.id);
		
		
		 for (var i = 0; i < clients.length; i++)
		 {
			if (clients[i].name == currentUser.name && clients[i].id == currentUser.id) 
			{

				console.log("User "+clients[i].name+" has disconnected");
				clients.splice(i,1);

			};
		};
		
		}
		
    });//END_SOCKET_ON
		
});//END_IO.ON


http.listen(process.env.PORT ||3000, function(){
	console.log('listening on *:3000');
});
console.log("------- server is running -------");