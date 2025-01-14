/**
 *
 *  @name DiscordTickets
 *  @author eartharoid <contact@eartharoid.me>
 *  @license GNU-GPLv3
 *
 */

const Logger = require('leekslazylogger');
const log = new Logger();
const fetch = require('node-fetch');
const config = require('../../user/' + require('../').config);
let {version} = require('../../package.json');
version = 'v' + version;
const boxen = require('boxen');
const link = require('terminal-link');

module.exports = async () => {
	if (!config.updater) return;
	const json = await (await fetch('https://api.github.com/repos/eartharoid/DiscordTickets/releases')).json();
	const update = json[0];
	let notice = [];

	if (version !== update.tag_name) {
		log.notice(log.f(`There is an update available for Discord Tickets (${version} -> ${update.tag_name})`));

		notice.push(`&6Du nutzt den Discord-Ticket-Bot in der Version &c${version}&6, die neuste ist &a${update.tag_name}&6.`);
		notice.push(`&6Downloade "&f${update.name}&6" von`);
		notice.push(link('&6der GitHub Release Seite unter ', 'https://github.com/eartharoid/DiscordTickets/releases/'));

		console.log(
			boxen(log.f(notice.join('\n')), {
				padding: 1,
				margin: 1,
				align: 'center',
				borderColor: 'yellow',
				borderStyle: 'round'
			})
		);
	}
};