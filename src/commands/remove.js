/**
 *
 *  @name DiscordTickets
 *  @author eartharoid <contact@eartharoid.me>
 *  @license GNU-GPLv3
 *
 */

const { MessageEmbed } = require('discord.js');

module.exports = {
	name: 'remove',
	description: 'Mitglied von Ticket-Kanal entfernen',
	usage: '<@member> [... #channel]',
	aliases: ['none'],
	example: 'remove @member from #ticket-23',
	args: true,
	async execute(client, message, args, log, { config, Ticket }) {
		const guild = client.guilds.cache.get(config.guild);

		const notTicket = new MessageEmbed()
			.setColor(config.err_colour)
			.setAuthor(message.author.username, message.author.displayAvatarURL())
			.setTitle('❌ **Dies ist kein Ticket-Kanal**')
			.setDescription('Nutze diesen Befehl in einem Ticket-Kanal, oder erwähne den Kanal.')
			.addField('Nutzung', `\`${config.prefix}${this.name} ${this.usage}\`\n`)
			.addField('Hilfe', `Tippe \`${config.prefix}help ${this.name}\` für mehr Informationen`)
			.setFooter(guild.name, guild.iconURL());

		let ticket;

		let channel = message.mentions.channels.first();

		if (!channel) {

			channel = message.channel;
			ticket = await Ticket.findOne({ where: { channel: message.channel.id } });
			if (!ticket)
				return message.channel.send(notTicket);

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
					.setTitle('❌ **Keine Berechtigung**')
					.setDescription(`Du hast keine Berechtigung ${channel} zu verändern, da es weder dir gehört noch das du Teammitglied bist.`)
					.addField('Nutzung', `\`${config.prefix}${this.name} ${this.usage}\`\n`)
					.addField('Hilfe', `Tippe \`${config.prefix}help ${this.name}\` für mehr Informationen`)
					.setFooter(guild.name, guild.iconURL())
			);
		}

		let member = guild.member(message.mentions.users.first() || guild.members.cache.get(args[0]));

		if (!member || member.id === message.author.id || member.id === guild.me.id)
			return message.channel.send(
				new MessageEmbed()
					.setColor(config.err_colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle('❌ **Unbekannter Nutzer**')
					.setDescription('Bitte erwähne einen existierenden Nutzer.')
					.addField('Nutzung', `\`${config.prefix}${this.name} ${this.usage}\`\n`)
					.addField('Hilfe', `Tippe \`${config.prefix}help ${this.name}\` für mehr Informationen`)
					.setFooter(guild.name, guild.iconURL())
			);

		try {
			channel.updateOverwrite(member.user, {
				VIEW_CHANNEL: false,
				SEND_MESSAGES: false,
				ATTACH_FILES: false,
				READ_MESSAGE_HISTORY: false
			});

			if (channel.id !== message.channel.id) {
				channel.send(
					new MessageEmbed()
						.setColor(config.colour)
						.setAuthor(member.user.username, member.user.displayAvatarURL())
						.setTitle('**Nutzer entfernt**')
						.setDescription(`${member} wurde entfernt von ${message.author}`)
						.setFooter(guild.name, guild.iconURL())
				);
			}

			message.channel.send(
				new MessageEmbed()
					.setColor(config.colour)
					.setAuthor(member.user.username, member.user.displayAvatarURL())
					.setTitle('✅ **Nutzer entfernt**')
					.setDescription(`${member} wurde von <#${ticket.channel}> entfernt`)
					.setFooter(guild.name, guild.iconURL())
			);

			log.info(`${message.author.tag} hat einen Nutzer von einem Ticket entfernt (#${message.channel.id})`);
		} catch (error) {
			log.error(error);
		}
	},
};
