/**
 *
 *  @name DiscordTickets
 *  @author eartharoid <contact@eartharoid.me>
 *  @license GNU-GPLv3
 *
 */

const { MessageEmbed } = require('discord.js');

module.exports = {
	name: 'help',
	description: 'Zeigt Hilfe zu Kommandos an',
	usage: '[command]',
	aliases: ['command', 'commands'],
	example: 'help new',
	args: false,
	execute(client, message, args, log, { config }) {
		const guild = client.guilds.cache.get(config.guild);

		const commands = Array.from(client.commands.values());

		if (!args.length) {
			let cmds = [];

			for (let command of commands) {
				if (command.hide || command.disabled) continue;
				if (command.permission && !message.member.hasPermission(command.permission)) continue;

				let desc = command.description;

				if (desc.length > 50) desc = desc.substring(0, 50) + '...';
				cmds.push(`**${config.prefix}${command.name}** **·** ${desc}`);
			}

			message.channel.send(
				new MessageEmbed()
					.setTitle('Commands')
					.setColor(config.colour)
					.setDescription(
						`\nKommandos zu denen du Berechtigungen hast, stehen hierunter. Tippe \`${config.prefix}help [command]\` um genauere Informationen über einen spezifischen Befehl zu erhalten.
						\n${cmds.join('\n\n')}
						\nBitte Kontaktiere bei Fragen ein Teammitglied.`
					)
					.setFooter(guild.name, guild.iconURL())
			).catch((error) => {
				log.warn('Could not send help menu');
				log.error(error);
			});

		} else {
			const name = args[0].toLowerCase();
			const command = client.commands.get(name) || client.commands.find(c => c.aliases && c.aliases.includes(name));

			if (!command)
				return message.channel.send(
					new MessageEmbed()
						.setColor(config.err_colour)
						.setDescription(`❌ **Ungültiges Kommando** (\`${config.prefix}help\`)`)
				);


			const cmd = new MessageEmbed()
				.setColor(config.colour)
				.setTitle(command.name);


			if (command.long) cmd.setDescription(command.long);
			else cmd.setDescription(command.description);

			if (command.aliases) cmd.addField('Aliasen', `\`${command.aliases.join(', ')}\``, true);

			if (command.usage) cmd.addField('Nutzung', `\`${config.prefix}${command.name} ${command.usage}\``, false);

			if (command.usage) cmd.addField('Beispiel', `\`${config.prefix}${command.example}\``, false);


			if (command.permission && !message.member.hasPermission(command.permission)) {
				cmd.addField('Du benötigst die Berechtigung ', `\`${command.permission}\` :exclamation: Du hast keine Rechte für diesen Befehl`, true);
			} else cmd.addField('Du benötigst die Berechtigung ', `\`${command.permission || 'none'}\``, true);

			message.channel.send(cmd);
		}

		// command ends here
	},
};