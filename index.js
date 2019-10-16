const tmi = require('tmi.js')
const axios = require('axios')
const config = require('./config.json')

const cooldown = new Set()
const dalert_endpoint = 'https://www.donationalerts.com/api/v1'

const options = {
  identity: {
    username: config.bot_username,
    password: config.oauth_token
  },
  channels: config.channels
}

const client = new tmi.client(options)

client.on('message', onMessageHandler)
client.on('connected', onConnectedHandler)

client.connect();

async function onMessageHandler (target, context, msg, self) {
  if (self) return
  if(msg.indexOf(config.prefix) !== 0) return
  var args = msg.slice(config.prefix.length).trim().split(/ +/g)
  var commandName = args.shift().toLowerCase()
  const roomId = context['room-id']
  switch (commandName) {
    case 'lastdonation':
      if(cooldown.has(roomId)) return
      cooldown.add(roomId)
      try {
        const req = await axios({
          method: 'get',
          url: `${dalert_endpoint}/alerts/donations`,
          headers: {
            "Authorization": `Bearer ${config.donationAlerts_Token}`
          },
          validateStatus: false
        })
        client.say(target, `Последний донат от ${req.data.data[0].username} - ${req.data.data[0].amount} ${req.data.data[0].currency}`)
      } catch (error) {
        client.say(target, `Возникла ошибка, сообщите об этом создателю канала`)
      }
      setTimeout(() => {
        cooldown.delete(roomId)
      }, config.cooldown);
      break;
    default:
      break;
  }
}

function rollDice () {
  const sides = 6;
  return Math.floor(Math.random() * sides) + 1;
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}
