/**
 *
 *  @name DiscordTickets
 *  @author eartharoid <contact@eartharoid.me>
 *  @license GNU-GPLv3
 *
 */

const { MessageEmbed } = require('discord.js');

module.exports = {
	name: 'add',
	description: 'Add a member to a ticket channel',
	usage: '<@member> [... #channel]',
	aliases: ['none'],
	example: 'add @member to #ticket-23',
	args: true,
	async execute(client, message, args, log, { config, Ticket }) {
		const guild = client.guilds.cache.get(config.guild);

		const notTicket = new MessageEmbed()
			.setColor(config.err_colour)
			.setAuthor(message.author.username, message.author.displayAvatarURL())
			.setTitle('❌ **Dies ist kein Ticket-Kanal**')
			.setDescription('Nutz diesen Command in dem Ticket-Kanal dem du einen Nutzer hinzufügen möchtest.')
			.addField('Nutzung', `\`${config.prefix}${this.name} ${this.usage}\`\n`)
			.addField('Hilfe', `Tippe \`${config.prefix}help ${this.name}\` für mehr Informationen`)
			.setFooter(guild.name, guild.iconURL());

		let ticket;

		let channel = message.mentions.channels.first();

		if (!channel) {
			channel = message.channel;
			ticket = await Ticket.findOne({ where: { channel: message.channel.id } });
			if (!ticket) return message.channel.send(notTicket);

		} else {
			ticket = await Ticket.findOne({ where: { channel: channel.id } });
			if (!ticket) {
				notTicket
					.setTitle('❌ **Kanal ist kein Ticket-Kanal**')
					.setDescription(`${channel} ist kein Ticket-Kanal.`);
				return message.channel.send(notTicket);
			}
		}

		if (message.author.id !== ticket.creator && !message.member.roles.cache.has(config.staff_role)) {
			return message.channel.send(
				new MessageEmbed()
					.setColor(config.err_colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle('❌ **Keine Berechtigungen**')
					.setDescription(`Du hast keine Berechtigungg ${channel} zu bearbeiten weil er nicht dir gehört und du kein Teammitglied bist.`)
					.addField('Nutzung', `\`${config.prefix}${this.name} ${this.usage}\`\n`)
					.addField('Hilfe', `Tippe \`${config.prefix}help ${this.name}\` für mehr Informationen`)
					.setFooter(guild.name, guild.iconURL())
			);
		}

		let member = guild.member(message.mentions.users.first() || guild.members.cache.get(args[0]));

		if (!member) {
			return message.channel.send(
				new MessageEmbed()
					.setColor(config.err_colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle('❌ **Unbekannter Nutzer**')
					.setDescription('Bitte erwähne einen vorhandenen Nutzer.')
					.addField('Nutzung', `\`${config.prefix}${this.name} ${this.usage}\`\n`)
					.addField('Hilfe', `Tippe \`${config.prefix}help ${this.name}\` für mehr Informationen`)
					.setFooter(guild.name, guild.iconURL())
			);
		}

		try {
			channel.updateOverwrite(member.user, {
				VIEW_CHANNEL: true,
				SEND_MESSAGES: true,
				ATTACH_FILES: true,
				READ_MESSAGE_HISTORY: true
			});

			if (channel.id !== message.channel.id) {
				channel.send(
					new MessageEmbed()
						.setColor(config.colour)
						.setAuthor(member.user.username, member.user.displayAvatarURL())
						.setTitle('**Nutzer hinzugefügt**')
						.setDescription(`${member} wurde von ${message.author} hinzugefügt`)
						.setFooter(guild.name, guild.iconURL())
				);
			}

			message.channel.send(
				new MessageEmbed()
					.setColor(config.colour)
					.setAuthor(member.user.username, member.user.displayAvatarURL())
					.setTitle('✅ **Nutzer hinzugefügt**')
					.setDescription(`${member} wurde hinzugefügt zu <#${ticket.channel}>`)
					.setFooter(guild.name, guild.iconURL())
			);

			log.info(`${message.author.tag} fügte einen Nutzer zu ${message.channel.id} hinzu`);
		} catch (error) {
			log.error(error);
		}
		// command ends here
	},
};
