/**
 *
 *  @name DiscordTickets
 *  @author eartharoid <contact@eartharoid.me>
 *  @license GNU-GPLv3
 *
 */

const { Collection, MessageEmbed } = require('discord.js');
const archive = require('../modules/archive');

module.exports = {
	event: 'message',
	async execute(client, log, [message], {config, Ticket, Setting}) {

		const guild = client.guilds.cache.get(config.guild);

		if (message.channel.type === 'dm' && !message.author.bot) {
			log.console(`Received a DM from ${message.author.tag}: ${message.cleanContent}`);
			return message.channel.send(`Hello there, ${message.author.username}!
Ich bind der Supporter für **${guild}**.
Schreib \`${config.prefix}new\` um ein neues Ticket zu erstellen.`);
		} // stop here if is DM

		/**
		 * Ticket transcripts
		 * (bots currently still allowed)
		 */

		let ticket = await Ticket.findOne({ where: { channel: message.channel.id } });
		if (ticket) {
			archive.add(message); // add message to archive
			// Update the ticket updated at so closeall can get most recent
			ticket.changed('updatedAt', true);
			ticket.save();
		}

		if (message.author.bot || message.author.id === client.user.id) return; // goodbye bots


		/**
		 * Command handler
		 * (no bots / self)
		 */

		const regex = new RegExp(`^(<@!?${client.user.id}>|\\${config.prefix.toLowerCase()})\\s*`);
		if (!regex.test(message.content.toLowerCase())) return; // not a command

		const [, prefix] = message.content.toLowerCase().match(regex);
		const args = message.content.slice(prefix.length).trim().split(/ +/);
		const commandName = args.shift().toLowerCase();
		const command = client.commands.get(commandName)
			|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

		if (!command || commandName === 'none') return; // not an existing command

		if (message.guild.id !== guild.id) return message.reply(`Dieser Bot kann nur auf dem Server "${guild}" genutzt werden`); // not in this server

		if (command.permission && !message.member.hasPermission(command.permission)) {
			log.console(`${message.author.tag} versuchte '${command.name}' ohne Berechtigungen zu nutzen`);
			return message.channel.send(
				new MessageEmbed()
					.setColor(config.err_colour)
					.setTitle('❌ Keine Berechtigung')
					.setDescription(`**Du hast keine Rechte für den \`${command.name}\` command** (du benötigst \`${command.permission}\`).`)
					.setFooter(guild.name, guild.iconURL())
			);
		}

		if (command.args && !args.length) {
			return message.channel.send(
				new MessageEmbed()
					.setColor(config.err_colour)
					.addField('Nutzung', `\`${config.prefix}${command.name} ${command.usage}\`\n`)
					.addField('Hilfe', `Tippe \`${config.prefix}help ${command.name}\` für mehr Informationen`)
					.setFooter(guild.name, guild.iconURL())
			);
		}

		if (!client.cooldowns.has(command.name)) client.cooldowns.set(command.name, new Collection());

		const now = Date.now();
		const timestamps = client.cooldowns.get(command.name);
		const cooldownAmount = (command.cooldown || config.cooldown) * 1000;

		if (timestamps.has(message.author.id)) {
			const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

			if (now < expirationTime) {
				const timeLeft = (expirationTime - now) / 1000;
				log.console(`${message.author.tag} versuchte '${command.name}' zu nutzen, bevor der Cooldown abgelaufen war`);
				return message.channel.send(
					new MessageEmbed()
						.setColor(config.err_colour)
						.setDescription(`❌ Bitte warte ${timeLeft.toFixed(1)} Sekunden, bevor du \`${command.name}\` erneut nutzt.`)
						.setFooter(guild.name, guild.iconURL())
				);
			}
		}

		timestamps.set(message.author.id, now);
		setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

		try {
			command.execute(client, message, args, log, {config, Ticket, Setting});
			log.console(`${message.author.tag} nutzte '${command.name}'`);
		} catch (error) {
			log.warn(`Ein Fehler ist beim ausführen von '${command.name}' aufgetreten`);
			log.error(error);
			message.channel.send(`❌ Ein Fehler trat beim Ausführen von \`${command.name}\` auf.`);
		}
	}
};
