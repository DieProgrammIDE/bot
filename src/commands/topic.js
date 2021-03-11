/**
 *
 *  @name DiscordTickets
 *  @author eartharoid <contact@eartharoid.me>
 *  @license GNU-GPLv3
 *
 */

const { MessageEmbed } = require('discord.js');

module.exports = {
	name: 'topic',
	description: 'Ticket-Thema ändern',
	usage: '<topic>',
	aliases: ['edit'],
	example: 'topic need help error',
	args: true,
	async execute(client, message, args, _log, { config, Ticket }) {
		const guild = client.guilds.cache.get(config.guild);

		let ticket = await Ticket.findOne({
			where: {
				channel: message.channel.id
			}
		});

		if (!ticket) {
			return message.channel.send(
				new MessageEmbed()
					.setColor(config.err_colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle('❌ **Dies ist kein Ticket-Kanal**')
					.setDescription('Nutz diesen Befehl im Ticket-Kanal den du schließen möchtest oder erwähne ihn.')
					.addField('Nutzung', `\`${config.prefix}${this.name} ${this.usage}\`\n`)
					.addField('Hilfe', `Tippe \`${config.prefix}help ${this.name}\` für mehr Informationen`)
					.setFooter(guild.name, guild.iconURL())
			);
		}

		let topic = args.join(' ');
		if (topic.length > 256) {
			return message.channel.send(
				new MessageEmbed()
					.setColor(config.err_colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle('❌ **Beschreibung zu groß**')
					.setDescription('Bitte nicht mehr als 256 characters nutzen.')
					.setFooter(guild.name, guild.iconURL())
			);
		}

		message.channel.setTopic(`<@${ticket.creator}> | ` + topic);

		Ticket.update({
			topic: topic
		}, {
			where: {
				channel: message.channel.id
			}
		});

		message.channel.send(
			new MessageEmbed()
				.setColor(config.colour)
				.setAuthor(message.author.username, message.author.displayAvatarURL())
				.setTitle('✅ **Ticket aktualisiert**')
				.setDescription('Das Ticket wurde aktualisiert.')
				.setFooter(client.user.username, client.user.displayAvatarURL())
		);
	}
};