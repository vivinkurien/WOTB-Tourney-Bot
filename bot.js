
var Discord = require('discord.io');
var logger = require('winston');
//var auth = require('./auth.json');
var http = require("http");
const request = require('request-promise-lite');
const async = require('async');
var BOT_TOKEN = (process.env.BOT_TOKEN); 	 	
const fs = require('fs');

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
   token: BOT_TOKEN,
   autorun: true
});

function getDate(utcSeconds){

    var d = new Date(0); 
    d.setUTCSeconds(utcSeconds);
    
   return d;
 }


 function getJSON(options,cb){

    http.request(options, function(res){
        var body='';

        res.on('data',function(chunck){
            body+=chunck;
        })

        res.on('end', function(){
            var result = JSON.parse(body);
            cb(null,result);
        })

        res.on('error', cb)
    }).on('error', cb)
    .end();

}


bot.msgs=require('./msgs.json');

bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');

   /* let _data = bot.msgs["tournamets"];
    logger.info("ssss" + _data.length);
    for (i=0; i<_data.length;i++)
   {
          logger.info(_data[i].uer);
   }*/

});
bot.on('message', function (user, userID, channelID, message, evt) {
    logger.info(user );
    
   
     if(message.toLocaleLowerCase().startsWith("!get"))
     {
        
        
        let _data = bot.msgs["tournamets"];
        for (i in _data)
        {
            bot.sendMessage({
                            to: channelID,
                            message: _data[i].user
                        }); 

            logger.info(_data[i].user);
        }
    }
     
    if(message.toLocaleLowerCase().startsWith("!register"))
     {
        var msgParts=message.split(' ');

         bot.msgs["tournamets"]={
            "user" : user,
             "tournament": msgParts[1]
             
         }

         fs.writeFile("./msgs.json", JSON.stringify(bot.msgs,null,4), err=>{
             if (err) throw err;
         });
  
     }



     if(message.toLocaleLowerCase().startsWith("!tourney"))
     {
        
        var options = {
            host:'api.wotblitz.com',
            path:'/wotb/tournaments/list/?application_id='+BOT_TOKEN+'&status=upcoming%2Cregistration_started%2Cregistration_finished%2Crunning',
            method: 'GET'
        };
        
        getJSON(options , function (err,result){
        
            if(err)
            {
                return console.log('Error' , err);
            }
        
            var tournamentDetails = '';
            result.data.forEach(element => {
                tournamentDetails = tournamentDetails + element.title + ' ' + getDate(element.start_at) + ' - ' + element.status + '\n \n ';

            });

                bot.sendMessage({
                    to: channelID,
                    message: '',
                    embed: {
                        title: ' Tournament List ',
                        description: tournamentDetails,
                         color: 6826080
                        
                      }
                }); 
            
           
        });
  
     }



     if(message.toLocaleLowerCase().startsWith("!team"))
     {
         
 

const getTournaments = function (cb) {
        let resultArray = []
        let tournamentURL = 'http://api.wotblitz.com/wotb/tournaments/list/?application_id='+BOT_TOKEN+'&status=upcoming%2Cregistration_started%2Cregistration_finished%2Crunning'
        request.get(tournamentURL, {
            json: true
        })
            .then(function (response) {
                response.data.forEach(function (item) {
                    let tournamentInfo = {
                        id: item.tournament_id,
                        title: item.title
                    }
                    resultArray.push(tournamentInfo)
                })
    
                cb(null, resultArray)
            })
    
    }

    const getAllTeamDetails = function (resultArray, cb) {
        let teamArray = [];
        return new Promise(function (resolve, reject) {
            const teamInfoURL = 'http://api.wotblitz.com/wotb/tournaments/teams/?application_id='+BOT_TOKEN+'&tournament_id='
            let getTeamInfo = function (tournament) {
                return new Promise(function (resolve, reject) {
                    var serviceURL = teamInfoURL + tournament.id+'&clan_id=3243';
                    console.log (serviceURL);
                    request.get(serviceURL, {json: true})
                        .then(function (response) {
                                 response.data.forEach(function (item) {                                    
                                    let tournamentInfo = {
                                        id: tournament.id,
                                        title: tournament.title,
                                        teamname:item.title,
                                        players:item.players
                                    }

                                    teamArray.push(tournamentInfo)
                            })

                            resolve()
                        })
    
                })
            }
            
            console.log('Starting tournament loop')
            let teamPromises = resultArray.map(getTeamInfo)
    
            Promise.all(teamPromises)
                .then(function () {
                    cb(null, teamArray)
                })
                .catch(function (err) {
                    console.log(err)
                })
    
        })
    }


    async.waterfall([getTournaments , getAllTeamDetails],
        function publishMessage(err, result) {
            if (err) {
               console.log(err);
            }
            else {

                console.log(result);
        
                result.forEach(function (tournamentTeams) {                                    
                
                    var teamdetails = '****Team: ' + tournamentTeams.teamname + ' **** \n';
                    tournamentTeams.players.forEach(function (player)
                    {
                        teamdetails = teamdetails + player.name + ' \n ';
                    })
                

                    teamdetails = teamdetails + ' \n Open Spots:' + (9-tournamentTeams.players.length) + ' \n ';

                bot.sendMessage({
                    to: channelID,
                    message: '',
                    embed: {
                        title: tournamentTeams.title,
                        description: teamdetails,
                         color: 6826080
                        
                      }
                }); 

                

            })

            }
        })
    
     }

});


