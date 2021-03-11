/**
 *
 *  @name DiscordTickets
 *  @author eartharoid <contact@eartharoid.me>
 *  @license GNU-GPLv3
 *
 */

const { MessageEmbed } = require('discord.js');

module.exports = {
	name: 'stats',
	description: 'Ticket Statistiken',
	usage: '',
	aliases: ['data', 'statistics'],
	
	args: false,
	async execute(client, message, _args, _log, { config, Ticket }) {
		const guild = client.guilds.cache.get(config.guild);

		let open = await Ticket.count({ where: { open: true } });
		let closed = await Ticket.count({ where: { open: false } });

		message.channel.send(
			new MessageEmbed()
				.setColor(config.colour)
				.setTitle(':bar_chart: Statistiken')
				.addField('Geöffnete Tickets', open, true)
				.addField('Geschlossene Tickets', closed, true)
				.addField('Tickets Insgesamt', open + closed, true)
				.setFooter(guild.name, guild.iconURL())
		);
	}
};