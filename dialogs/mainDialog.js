// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const {
    ComponentDialog,
    DialogSet,
    DialogTurnStatus,
    TextPrompt,
    WaterfallDialog
} = require('botbuilder-dialogs');
const {
    OrderDialog
} = require('./orderDialog');
const {
    LuisHelper
} = require('./luisHelper');

const {
    Common
} = require('../helper/common');

const MAIN_WATERFALL_DIALOG = 'mainWaterfallDialog';
const ORDER_DIALOG = 'orderDialog';

class MainDialog extends ComponentDialog {
    constructor(logger) {
        super('MainDialog');

        if (!logger) {
            logger = console;
            logger.log('[MainDialog]: logger not passed in, defaulting to console');
        }

        this.logger = logger;

        // Define the main dialog and its related components.
        // This is a sample "book a flight" dialog.
        this.addDialog(new TextPrompt('TextPrompt'))
            .addDialog(new OrderDialog(ORDER_DIALOG))
            .addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
                this.introStep.bind(this),
                this.actStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = MAIN_WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a DialogContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} dialogContext
     */
    async run(context, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(context);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    /**
     * First step in the waterfall dialog. Prompts the user for a command.
     * Currently, this expects a order request, like "get me a large cone ice cream"
     * Note that the sample LUIS model will only recognize the defined entites in luis app.
     */
    async introStep(stepContext) {
        if (!process.env.LuisAppId || !process.env.LuisAPIKey || !process.env.LuisAPIHostName) {
            await stepContext.context.sendActivity('NOTE: LUIS is not configured. To enable all capabilities, add `LuisAppId`, `LuisAPIKey` and `LuisAPIHostName` to the .env file.');
            return await stepContext.next();
        }

        return await stepContext.prompt('TextPrompt', {
            prompt: 'What can I help you with today?\nSay something like "Get me a Regular Cone ice cream"'
        });
    }

    /**
     * Second step in the waterall.  This will use LUIS to attempt to extract the type and size of ice cream.
     * Then, it hands off to the orderDialog child dialog to collect any remaining details.
     */
    async actStep(stepContext) {
        let orderDetails = {};

        if (process.env.LuisAppId && process.env.LuisAPIKey && process.env.LuisAPIHostName) {
            // Call LUIS and gather any potential order details.
            // This will attempt to extract the type and size of ice cream fro user
            // and will then pass those values into the order dialog
            orderDetails = await LuisHelper.executeLuisQuery(this.logger, stepContext.context);

            this.logger.log('LUIS extracted these order details:', orderDetails);
        }

        // In this sample we only have a single intent we are concerned with. However, typically a scenario
        // will have multiple different intents each corresponding to starting a different child dialog.

        // Run the order dialog giving it whatever details we have from the LUIS call, it will fill out the remainder.
        return await stepContext.beginDialog('orderDialog', orderDetails);
    }

    /**
     * This is the final step in the main waterfall dialog.
     * It wraps up the sample "Get an Ice cream" interaction with a simple confirmation.
     */
    async finalStep(stepContext) {
        // If the child dialog ("orderDialog") was cancelled or the user failed to confirm, the Result here will be null.
        if (stepContext.result) {
            const result = stepContext.result;
            // Now we have all the order details.

            // This is where calls to the order service or database would go.
            //todo: call api here if any!
            // If the call to the order service was successful tell the user.

            var msg = `The humans will deliver you ${(result.iceCreamQuantity>1)?result.iceCreamQuantity:"a"}`;

            if (result.iceCreamType.toLowerCase().trim() == "cone") {

                msg += ` ${ Common.toTitleCase(result.iceCreamSize) }  ${ Common.toTitleCase(result.iceCreamType) } ice cream.`;
            } else {
                msg += ` ${ Common.toTitleCase(result.iceCreamType) } ice cream.`;
            }
            msg += `\n Enjoy your yummy ice cream.`;
            await stepContext.context.sendActivity(msg);
        } else {
            await stepContext.context.sendActivity('Ok, I have canceled your order. Thank you.');
        }
        return await stepContext.endDialog();
    }
}

module.exports.MainDialog = MainDialog;