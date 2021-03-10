/**
 *
 *  @name DiscordTickets
 *  @author eartharoid <contact@eartharoid.me>
 *  @license GNU-GPLv3
 *
 */

const { version, homepage } = require('../../package.json');
const link = require('terminal-link');

module.exports = (leeks) => {
	console.log(leeks.colours.cyan(`
########  ####  ######   ######   #######  ########  ########
##     ##  ##  ##    ## ##    ## ##     ## ##     ## ##     ##
##     ##  ##  ##       ##       ##     ## ##     ## ##     ##
##     ##  ##   ######  ##       ##     ## ########  ##     ##
##     ##  ##        ## ##       ##     ## ##   ##   ##     ##
##     ##  ##  ##    ## ##    ## ##     ## ##    ##  ##     ##
########  ####  ######   ######   #######  ##     ## ########

######## ####  ######  ##    ## ######## ########  ######
   ##     ##  ##    ## ##   ##  ##          ##    ##    ##
   ##     ##  ##       ##  ##   ##          ##    ##
   ##     ##  ##       #####    ######      ##     ######
   ##     ##  ##       ##  ##   ##          ##          ##
   ##     ##  ##    ## ##   ##  ##          ##    ##    ##
   ##    ####  ######  ##    ## ########    ##     ######
`));
	console.log(leeks.colours.cyanBright(`DiscordTickets bot v${version} von eartharoid, übersetzt durch AnderCrafter`));
	console.log(leeks.colours.cyanBright(homepage + '\n'));
	console.log(leeks.colours.cyanBright(`Bitte ${link('donate', 'https://ko-fi.com/eartharoid')}, wenn du den Bot nützlich findest`));
	console.log('\n\n');
};