/**
 *
 *  @name DiscordTickets
 *  @author eartharoid <contact@eartharoid.me>
 *  @license GNU-GPLv3
 *
 */

const fs = require('fs');
const { join } = require('path');

const {
	MessageEmbed
} = require('discord.js');

module.exports = {
	name: 'transcript',
	description: 'Download a transcript',
	usage: '<ticket-id>',
	aliases: ['archive', 'download'],
	example: 'transcript 57',
	args: true,
	async execute(client, message, args, _log, { config, Ticket }) {
		const guild = client.guilds.cache.get(config.guild);
		const id = args[0];

		let ticket = await Ticket.findOne({
			where: {
				id: id,
				open: false
			}
		});


		if (!ticket) {
			return message.channel.send(
				new MessageEmbed()
					.setColor(config.err_colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle('❌ **Unbekanntes Ticket**')
					.setDescription('Konnte kein geschlossenes Ticket mit der ID finden')
					.setFooter(guild.name, guild.iconURL())
			);
		}

		if (message.author.id !== ticket.creator && !message.member.roles.cache.has(config.staff_role)) {
			return message.channel.send(
				new MessageEmbed()
					.setColor(config.err_colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle('❌ **Keine Berechtigung**')
					.setDescription(`Du hast keine Berechtigung das Ticket ${id} anzusehen weil es dir nicht gehört und du kein Teammitglied bist.`)
					.setFooter(guild.name, guild.iconURL())
			);
		}

		let res = {};
		const embed = new MessageEmbed()
			.setColor(config.colour)
			.setAuthor(message.author.username, message.author.displayAvatarURL())
			.setTitle(`Ticket ${id}`)
			.setFooter(guild.name, guild.iconURL());

		let file = `../../user/transcripts/text/${ticket.channel}.txt`;
		if (fs.existsSync(join(__dirname, file))) {
			embed.addField('Text Transkript', 'Siehe Anhang');
			res.files = [
				{
					attachment: join(__dirname, file),
					name: `ticket-${id}-${ticket.channel}.txt`
				}
			];
		}


		const BASE_URL = config.transcripts.web.server;
		if (config.transcripts.web.enabled) embed.addField('Web Archiv', `${BASE_URL}/${ticket.creator}/${ticket.channel}`);

		if (embed.fields.length < 1) embed.setDescription(`Keine Text Transkripte für das Ticket ${id}`);

		res.embed = embed;

		let channel;
		try {
			channel = message.author.dmChannel || await message.author.createDM();
		} catch (e) {
			channel = message.channel;
		}

		channel.send(res).then(m => {
			if (channel.id === message.channel.id) m.delete({timeout: 15000});
		});
		message.delete({timeout: 1500});
	}
};