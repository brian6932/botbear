const sql = require('./../sql/index.js');
const { got } = require('./../got');
const spotifyTools = require('../tools/spotifyTools.js');
const youtube = require('youtube-search-api');

module.exports = {
	name: 'grab',
	ping: true,
	description: 'This command lets you grab other peoples spotify song and listen to the same one',
	permission: 100,
	cooldown: 3, //in seconds
	category: 'Info command',
	opt_outable: false,
	showDelay: false,
	noBanphrase: false,
	channelSpecific: false,
	activeChannel: '',
	// eslint-disable-next-line no-unused-vars
	execute: async (channel, user, input, perm, aliascommand) => {
		try {
			if (module.exports.permission > perm) {
				return;
			}
			
			const uid = user['user-id'];

			if (!input[2]) {
				return 'You need to provide a user to grab from';
			}

			const setTimestamp = (input[3] === '-t');

			const target_user = input[2].replace('@', '').toLowerCase();
			const target_uid = (await sql.Query('SELECT uid FROM Users WHERE username = ?',[input[2].replace('@', '').toLowerCase()]))[0]?.uid;
	
            const spotify_user = await spotifyTools.fetchToken(uid);
			const spotify_target = await spotifyTools.fetchToken(target_uid);

            if (user.username === target_user) {
                return 'FeelsDankMan You can\'t grab your own spotify';
            }

			if (spotify_user.no_auth) {
				return 'You have not authorized with the bot. Please login here: https://hotbear.org/login';
			}
			if (spotify_target.no_auth) {
				return 'That user has not authorized with the bot.';
			}
			if (spotify_target.opt_in === 'false') {
				return 'That user has not allowed others to target them. Tell them to do: bb spotify allow';
			}

            const access_token = spotify_user.access_token;
			const target_token = spotify_target.access_token;

            const checkPremium = await got('https://api.spotify.com/v1/me', {
				throwHttpErrors: false,
				headers: {
					'Authorization': 'Bearer ' + access_token,
					'Content-Type': 'application/json'
				}
            }).json();

            console.log(checkPremium);

            if (checkPremium.product !== 'premium') {
                return 'You need Spotify premium to use this feature';
            }

			const targetData = await got('https://api.spotify.com/v1/me/player', {
				throwHttpErrors: false,
				headers: {
					'Authorization': 'Bearer ' + target_token,
					'Content-Type': 'application/json'
				}
			}).json();

			if (!targetData.is_playing) {
				return 'Nothing is currently playing on their spotify';
			}

			if (targetData.item.is_local) {
				return `${target_user} is listening to a local song` ;
			}

			const uri = targetData.item.uri;

            const duration_ms = targetData.item.duration_ms;
            const artist = targetData.item.artists[0].name;
            const title = targetData.item.name;

			const position = (setTimestamp) ? targetData.progress_ms : 0;

			await got.put('https://api.spotify.com/v1/me/player/play', {
				throwHttpErrors: false,
				headers: {
					'Authorization': 'Bearer ' + access_token,
					'Content-Type': 'application/json'
				},
				json: {
					'uris': [uri],
					'position_ms': position
				}
			}).json();

			const progress_min_sec = spotifyTools.millisToMinutesAndSeconds(position);
			const duration_min_sec = spotifyTools.millisToMinutesAndSeconds(duration_ms);

			let yt_link = (await youtube.GetListByKeyword(artist + ' ' + title, false, 1, [{ type: 'music' }])).items[0].id;

			return (setTimestamp) ?
			`Now playing ${title} by ${artist} - (${progress_min_sec}/${duration_min_sec}) | Link: youtu.be/${yt_link}` :
			`Now playing ${title} by ${artist} | Link: youtu.be/${yt_link}`;

		} catch (err) {
			console.log(err);
			return 'FeelsDankMan Error';
		}
	}
};