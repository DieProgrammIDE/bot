/**
 *
 *  @name DiscordTickets
 *  @author eartharoid <contact@eartharoid.me>
 *  @license GNU-GPLv3
 *
 */

const { MessageEmbed } = require('discord.js');
const fs = require('fs');
const { join } = require('path');
const archive = require('../modules/archive');

module.exports = {
	name: 'close',
	description: 'Ticket schließen; entweder in spezifischem (erwähntem) Kanal oder im Kanal, indem der Command genutz wird.',
	usage: '[ticket]',
	aliases: ['none'],
	example: 'close #ticket-17',
	args: false,
	async execute(client, message, _args, log, { config, Ticket }) {
		const guild = client.guilds.cache.get(config.guild);

		const notTicket = new MessageEmbed()
			.setColor(config.err_colour)
			.setAuthor(message.author.username, message.author.displayAvatarURL())
			.setTitle('❌ **Dies ist kein Ticket-Kanal**')
			.setDescription('Nutz diesen Kanal im Ticket-Kanal oder erwähne ihn')
			.addField('Nutzung', `\`${config.prefix}${this.name} ${this.usage}\`\n`)
			.addField('Hife', `Tippe \`${config.prefix}help ${this.name}\` für weitere Informationen`)
			.setFooter(guild.name, guild.iconURL());

		let ticket;
		let channel = message.mentions.channels.first();
		// || client.channels.resolve(await Ticket.findOne({ where: { id: args[0] } }).channel) // channels.fetch()

		if (!channel) {
			channel = message.channel;

			ticket = await Ticket.findOne({
				where: {
					channel: channel.id
				}
			});
			if (!ticket) return message.channel.send(notTicket);
		} else {
			ticket = await Ticket.findOne({
				where: {
					channel: channel.id
				}
			});
			if (!ticket) {
				notTicket
					.setTitle('❌ **Kanal ist kein Ticket-Kanal**')
					.setDescription(`${channel} ist kein Ticket-Kanal.`);
				return message.channel.send(notTicket);
			}

		}

		let paths = {
			text: join(__dirname, `../../user/transcripts/text/${ticket.get('channel')}.txt`),
			log: join(__dirname, `../../user/transcripts/raw/${ticket.get('channel')}.log`),
			json: join(__dirname, `../../user/transcripts/raw/entities/${ticket.get('channel')}.json`)
		};

		if (message.author.id !== ticket.creator && !message.member.roles.cache.has(config.staff_role))
			return message.channel.send(
				new MessageEmbed()
					.setColor(config.err_colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle('❌ **Keine Berechtigung**')
					.setDescription(`Du hast keine Berechtigung ${channel} zu schließen, weil er weder dir gehört, noch du ein Teammitglied bist.`)
					.addField('Nutzung', `\`${config.prefix}${this.name} ${this.usage}\`\n`)
					.addField('Hife', `Tippe \`${config.prefix}help ${this.name}\` für weitere Informationen`)
					.setFooter(guild.name, guild.iconURL())
			);

		
		if (config.commands.close.confirmation) {
			let success;
			let pre = fs.existsSync(paths.text) || fs.existsSync(paths.log)
				? `Du kannst dir später ein Archiv ansehen mit \`${config.prefix}transcript ${ticket.id}\``
				: '';
				
			let confirm = await message.channel.send(
				new MessageEmbed()
					.setColor(config.colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle('❔ Sicher?')
					.setDescription(`${pre}\n**Reagiere mit ✅ zum akzeptieren.**`)
					.setFooter(guild.name + ' | Läuft in 15 Sekunden ab', guild.iconURL())
			);

			await confirm.react('✅');

			const collector = confirm.createReactionCollector(
				(r, u) => r.emoji.name === '✅' && u.id === message.author.id, {
					time: 15000
				});

			collector.on('collect', async () => {
				if (channel.id !== message.channel.id) {
					channel.send(
						new MessageEmbed()
							.setColor(config.colour)
							.setAuthor(message.author.username, message.author.displayAvatarURL())
							.setTitle('**Ticket geschlossen**')
							.setDescription(`Ticket geschlossen von ${message.author}`)
							.setFooter(guild.name, guild.iconURL())
					);
				}

				confirm.reactions.removeAll();
				confirm.edit(
					new MessageEmbed()
						.setColor(config.colour)
						.setAuthor(message.author.username, message.author.displayAvatarURL())
						.setTitle(`✅ **Ticket ${ticket.id} geschlossen	**`)
						.setDescription('Dieser Kanal wird automatisch in einigen Sekunden gelöscht, sobald der Inhalt archiviert ist.')
						.setFooter(guild.name, guild.iconURL())
				);
				

				if (channel.id !== message.channel.id)
					message.delete({
						timeout: 5000
					}).then(() => confirm.delete());
				
				success = true;
				close();
			});


			collector.on('end', () => {
				if (!success) {
					confirm.reactions.removeAll();
					confirm.edit(
						new MessageEmbed()
							.setColor(config.err_colour)
							.setAuthor(message.author.username, message.author.displayAvatarURL())
							.setTitle('❌ **Abgelaufen**')
							.setDescription('Du hast zu lange gebraucht um zu antworten, Verifizierung fehlgeschlagen.')
							.setFooter(guild.name, guild.iconURL()));

					message.delete({
						timeout: 10000
					}).then(() => confirm.delete());
				}
			});
		} else {
			close();
		}

		
		async function close () {
			let users = [];

			if (config.transcripts.text.enabled || config.transcripts.web.enabled) {
				let u = await client.users.fetch(ticket.creator);
				if (u) {
					let dm;
					try {
						dm = u.dmChannel || await u.createDM();
					} catch (e) {
						log.warn(`Konnte keinen DM-Kanal mit ${u.tag} erstellen`);
					}

					let res = {};
					const embed = new MessageEmbed()
						.setColor(config.colour)
						.setAuthor(message.author.username, message.author.displayAvatarURL())
						.setTitle(`Ticket ${ticket.id}`)
						.setFooter(guild.name, guild.iconURL());

					if (fs.existsSync(paths.text)) {
						embed.addField('Text Transkript', 'Siehe Anhang');
						res.files = [{
							attachment: paths.text,
							name: `ticket-${ticket.id}-${ticket.get('channel')}.txt`
						}];
					}

					if (fs.existsSync(paths.log) && fs.existsSync(paths.json)) {
						let data = JSON.parse(fs.readFileSync(paths.json));
						for (u in data.entities.users) users.push(u);
						embed.addField('Web Archiv', await archive.export(Ticket, channel)); // this will also delete these files
					}

					if (embed.fields.length < 1) {
						embed.setDescription(`Keine Transkripte oder Archiv-Daten existieren für das Ticket ${ticket.id}`);
					}

					res.embed = embed;

					try {
						if (config.commands.close.send_transcripts) dm.send(res);
						if (config.transcripts.channel.length > 1) client.channels.cache.get(config.transcripts.channel).send(res);
					} catch (e) {
						message.channel.send('❌ Konnte keine DM oder Transkript Log-Nachricht abschicken');
					}
				}
			}

			// update database
			ticket.update({
				open: false
			}, {
				where: {
					channel: channel.id
				}
			});

			// delete channel
			channel.delete({
				timeout: 5000
			});

			log.info(`${message.author.tag} closed a ticket (#ticket-${ticket.id})`);

			if (config.logs.discord.enabled) {
				let embed = new MessageEmbed()
					.setColor(config.colour)
					.setAuthor(message.author.username, message.author.displayAvatarURL())
					.setTitle(`Ticket ${ticket.id} closed`)
					.addField('Creator', `<@${ticket.creator}>`, true)
					.addField('Closed by', message.author, true)
					.setFooter(guild.name, guild.iconURL())
					.setTimestamp();

				if (users.length > 1)
					embed.addField('Members', users.map(u => `<@${u}>`).join('\n'));

				client.channels.cache.get(config.logs.discord.channel).send(embed);
			}
		}
	}
};
