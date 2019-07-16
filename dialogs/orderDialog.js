// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.


const {
    ConfirmPrompt,
    TextPrompt,
    WaterfallDialog
} = require('botbuilder-dialogs');
const {
    CancelAndHelpDialog
} = require('./cancelAndHelpDialog');
const {
    Common
} = require('../helper/common');


const CONFIRM_PROMPT = 'confirmPrompt';
const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';

class OrderDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'orderDialog');

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.icecreamTypeStep.bind(this),
                this.icecreamSizeStep.bind(this),
                this.confirmStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * If a type of ice cream is not provided, prompt for one.
     */
    async icecreamTypeStep(stepContext) {
        const orderDetails = stepContext.options;

        if (!orderDetails.iceCreamType) {
            return await stepContext.prompt(TEXT_PROMPT, {
                prompt: 'Which type of Icecream do you need? Cone or Cup'
            });
        } else {
            return await stepContext.next(orderDetails.iceCreamType);
        }
    }

    /**
     * If an ice cream size has not been provided, prompt for one.
     */
    async icecreamSizeStep(stepContext) {
        const orderDetails = stepContext.options;

        // Capture the response to the previous step's prompt
        orderDetails.iceCreamType = stepContext.result;
        if (orderDetails.iceCreamType.toLowerCase() == "cone" && !orderDetails.iceCreamSize) {
            return await stepContext.prompt(TEXT_PROMPT, {
                prompt: 'What size do you need? I have regular as well as large.'
            });
        } else {
            return await stepContext.next(orderDetails.iceCreamSize);
        }
    }

    /**
     * Confirm the information the user has provided.
     */
    async confirmStep(stepContext) {
        const orderDetails = stepContext.options;

        // Capture the results of the previous step
        if (orderDetails.iceCreamType.toLowerCase().trim() == "cone") {
            orderDetails.iceCreamSize = stepContext.result;
        }

        const msg = (orderDetails.iceCreamType.toLowerCase().trim() == "cone") ? `Please confirm, \n You want a ${Common.toTitleCase(orderDetails.iceCreamSize) } ${ Common.toTitleCase(orderDetails.iceCreamType) } ice cream. \n It will cost you ${Common.price(orderDetails.iceCreamType.toLowerCase().trim(),orderDetails.iceCreamSize.toLowerCase().trim())}` : `Please confirm, \n You want a ${ Common.toTitleCase(orderDetails.iceCreamType) } ice cream.\n It will cost you ${Common.price(orderDetails.iceCreamType.toLowerCase().trim())}`;

        // Offer a YES/NO prompt.
        return await stepContext.prompt(CONFIRM_PROMPT, {
            prompt: msg
        });
    }

    /**
     * Complete the interaction and end the dialog.
     */
    async finalStep(stepContext) {
        if (stepContext.result === true) {
            const orderDetails = stepContext.options;
            return await stepContext.endDialog(orderDetails);
        } else {
            return await stepContext.endDialog();
        }
    }
}

module.exports.OrderDialog = OrderDialog;