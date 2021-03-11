/**
 * @name DiscordTickets
 * @author eartharoid <contact@eartharoid.me>
 * @license GNU-GPLv3
 * 
 */

const { MessageEmbed } = require('discord.js');
const fs = require('fs');
const { join } = require('path');
const config = require(join(__dirname, '../../user/', require('../').config));
const archive = require('../modules/archive');
const { plural } = require('../modules/utils');
const { Op } = require('sequelize');
const toTime = require('to-time-monthsfork');

// A slight modification to the 'close' command to allow multiple tickets to be closed at once

module.exports = {
	name: 'closeall',
	description: 'Alle offenen Tickets die älter als angegeben sind schließen',
	usage: '[time]',
	aliases: ['ca'],
	example: 'closeall 1mo 1w',
	args: false,
	disabled: !config.commands.closeall.enabled,
	async execute(client, message, args, log, { config, Ticket }) {
		const guild = client.guilds.cache.get(config.guild);

		if (!message.member.roles.cache.has(config.staff_role))
			return message.channel.send(
				new MessageEmbed()
					.setColor(config.err_colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle('❌ **Keine Berechtigung**')
					.setDescription('Du kannst dieses Kommando nicht nutzen weil du kein Teammitglied bist.')
					.addField('Nutzung', `\`${config.prefix}${this.name}${' ' + this.usage}\`\n`)
					.addField('Hife', `Tippe \`${config.prefix}help ${this.name}\` für weitere Informationen`)
					.setFooter(guild.name, guild.iconURL())
			);
		
		let tickets;

		if (args.length > 0) {
			let time, maxDate;
			let timestamp = args.join(' ');

			try {
				time = toTime(timestamp).milliseconds();
				maxDate = new Date(Date.now() - time);
			} catch (error) {
				return message.channel.send(
					new MessageEmbed()
						.setColor(config.err_colour)
						.setAuthor(message.author.username, message.author.displayAvatarURL())
						.setTitle('❌ **Ungültiges Datum**')
						.setDescription(`Das gegebene Datum, \`${timestamp}\`, ist falsch.`)
						.addField('Hilfe', `\`${config.prefix}${this.name}${' ' + this.usage}\`\n`)
						.addField('Hife', `Tippe \`${config.prefix}help ${this.name}\` für weitere Informationen`)
						.setFooter(guild.name, guild.iconURL())
				);
			}
			
			tickets = await Ticket.findAndCountAll({
				where: {
					open: true,
					updatedAt: {
						[Op.lte]: maxDate,
					}
				},
			});
		} else {
			tickets = await Ticket.findAndCountAll({
				where: {
					open: true,
				},
			});
		}

		if (tickets.count === 0) 
			return message.channel.send(
				new MessageEmbed()
					.setColor(config.err_colour)
					.setAuthor(message.author.username, message.author.display)
					.setTitle('❌ **Keine geöffneten Tickets**')
					.setDescription('Es gibt keine geöffneten Tickets die geschlossen werden könnten.')
					.setFooter(guild.name, guild.iconURL())
			);

		log.info(`Found ${tickets.count} open tickets`);
		
		if (config.commands.close.confirmation) {
			let success;
			let pre = config.transcripts.text.enabled || config.transcripts.web.enabled
				? `Du kannst dir später eine Archivierte Version des Tickets mit \`${config.prefix}transcript <id>\``
				: '';

			let confirm = await message.channel.send(
				new MessageEmbed()
					.setColor(config.colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle(`❔ Bist du dir siche das du **${tickets.count}** Tickets schließen möchtest?`)
					.setDescription(`${pre}\n**Reagiere mit ✅ um zu bestätigen.**`)
					.setFooter(guild.name + ' | Läuft in 15 Sekunden', guild.iconURL())
			);

			await confirm.react('✅');

			const collector = confirm.createReactionCollector(
				(reaction, user) => reaction.emoji.name === '✅' && user.id === message.author.id, {
					time: 15000,
				}); 

			collector.on('collect', async () => {
				message.channel.send(
					new MessageEmbed()
						.setColor(config.colour)
						.setAuthor(message.author.username, message.author.displayAvatarURL())
						.setTitle(`**\`${tickets.count}\` tickets geschlossen**`)
						.setDescription(`**\`${tickets.count}\`** tickets geschlossen von ${message.author}`)
						.setFooter(guild.name, guild.iconURL())
				);

				confirm.reactions.removeAll();
				confirm.edit(
					new MessageEmbed()
						.setColor(config.colour)
						.setAuthor(message.author.username, message.author.displayAvatarURL())
						.setTitle(`✅ ** \`${tickets.count}\` tickets geschlossen**`)
						.setDescription('Der Kanal wird in einigen Sekunden automatisch gelöscht, sobald der Inhalt archiviert wurde.')
						.setFooter(guild.name, guild.iconURL())
				);

				message.delete({
					timeout: 5000,
				}).then(() => confirm.delete());

				success = true;
				closeAll();
			});

			collector.on('end', () => {
				if (!success) {
					confirm.reactions.removeAll();
					confirm.edit(
						new MessageEmbed()
							.setColor(config.err_colour)
							.setAuthor(message.author.username, message.author.displayAvatarURL())
							.setTitle('❌ **Abgelaufen**')
							.setDescription('Du hast zu lange zum reagieren gebraucht, Verifizierung abgebrochen')
							.setFooter(guild.name, guild.iconURL()));

					message.delete({
						timeout: 10000
					}).then(() => confirm.delete());
				}
			});
		} else {
			closeAll();
		}

		
		async function closeAll() {
			tickets.rows.forEach(async ticket => {
				let users = [];

				if (config.transcripts.text.enabled || config.transcripts.web.enabled) {
					let {
						channel,
						id,
						creator
					} = ticket;

					let user = await client.users.fetch(creator);
					let paths = {
						text: join(__dirname, `../../user/transcripts/text/${channel}.txt`),
						log: join(__dirname, `../../user/transcripts/raw/${channel}.log`),
						json: join(__dirname, `../../user/transcripts/raw/entities/${channel}.json`)
					};

					if (user) {
						let dm;
						try {
							dm = user.dmChannel || await user.createDM();
						} catch (e) {
							log.warn(`Konnte keinen DM-Kanal mit ${user.tag} erstellen`);
						}

						let res = {};
						const embed = new MessageEmbed()
							.setColor(config.colour)
							.setAuthor(message.author.username)
							.setTitle(`Ticket ${id}`)
							.setFooter(guild.name, guild.iconURL());
							
						if (fs.existsSync(paths.text)) {
							embed.addField('Text Transkript', 'Siehe Anhang');
							res.files = [{
								attachment: paths.text,
								name: `ticket-${id}-${channel}.txt`
							}];
						}

						if (fs.existsSync(paths.log) && fs.existsSync(paths.json)) {
							let data = JSON.parse(fs.readFileSync(paths.json));
							data.entities.users.forEach(u => users.push(u));
							embed.addField('Web Archiv', await archive.export(Ticket, channel));
						}

						res.embed = embed;

						try {
							if (config.commands.close.send_transcripts) dm.send(res);
							if (config.transcripts.channel.length > 1) client.channels.cache.get(config.transcripts.channel).send(res);
						} catch (e) {
							message.channel.send('❌ Konnte keine DM oder Transkript Nachricht senden');
						}
					}

					await Ticket.update({
						open: false,
					}, {
						where: {
							id,
						}
					});

					log.info(log.format(`${message.author.tag} geschlossen &7${id}&f`));

					client.channels.fetch(channel)
						.then(c => c.delete()
							.then(o => log.info(`Kanal gelöscht: '#${o.name}' <${o.id}>`))
							.catch(e => log.error(e)))
						.catch(e => log.error(e));

					if (config.logs.discord.enabled) {
						let embed = new MessageEmbed()
							.setColor(config.colour)
							.setAuthor(message.author.username, message.author.displayAvatarURL())
							.setTitle(`${tickets.count} ${plural('ticket', tickets.count)} geschlossen (${config.prefix}closeall)`)
							.addField('Geschlossen von', message.author, true)
							.setFooter(guild.name, guild.iconURL())
							.setTimestamp();

						if (users.length > 1)
							embed.addField('Mitglieder', users.map(u => `<@${u}>`).join('\n'));
						
						client.channels.cache.get(config.logs.discord.channel).send(embed);
					}
				}
			});
		}
		
	},
};
