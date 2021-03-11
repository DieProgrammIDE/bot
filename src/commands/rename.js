/**
 *
 *  @name DiscordTickets
 *  @author iFusion for eartharoid <contact@eartharoid.me>
 *  @license GNU-GPLv3
 *
 */

const { MessageEmbed } = require('discord.js');

module.exports = {
	name: 'rename',
	description: 'Ticket-Kanal umbenennen',
	usage: '<new name>',
	aliases: ['none'],
	example: 'rename important-ticket',
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
					.setDescription('Nutz diesen Befehl in dem Ticket-Kanal, den du umbenennen möchtest.')
					.addField('Nutzung', `\`${config.prefix}${this.name} ${this.usage}\`\n`)
					.addField('Hilfe', `Tippe \`${config.prefix}help ${this.name}\` für mehr Informationen`)
					.setFooter(guild.name, guild.iconURL())
			);
		}

		if (!message.member.roles.cache.has(config.staff_role))
			return message.channel.send(
				new MessageEmbed()
					.setColor(config.err_colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle('❌ **Keine Berechtigung**')
					.setDescription('Du hast keine Berechtigung diesen Kanal umzubenennen, weil du kein Teammitglied bist.')
					.addField('Nutzung', `\`${config.prefix}${this.name} ${this.usage}\`\n`)
					.addField('Hilfe', `Tippe \`${config.prefix}help ${this.name}\` für mehr Informationen`)
					.setFooter(guild.name, guild.iconURL())
			);

		message.channel.setName(args.join('-')); // new channel name

		message.channel.send(
			new MessageEmbed()
				.setColor(config.colour)
				.setAuthor(message.author.username, message.author.displayAvatarURL())
				.setTitle('✅ **Ticket aktualisiert**')
				.setDescription('Name wurde geändert.')
				.setFooter(client.user.username, client.user.displayAvatarURL())
		);
	}
};
