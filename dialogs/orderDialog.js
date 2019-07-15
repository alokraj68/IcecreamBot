// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { DateResolverDialog } = require('./dateResolverDialog');

const CONFIRM_PROMPT = 'confirmPrompt';
const DATE_RESOLVER_DIALOG = 'dateResolverDialog';
const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';

class OrderDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'orderDialog');

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.icecreamTypeStep.bind(this),
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
            return await stepContext.prompt(TEXT_PROMPT, { prompt: 'Which type of Icecream do you need? Cone or Cup' });
        } else {
            return await stepContext.next(orderDetails.iceCreamType);
        }
    }

    // /**
    //  * If an origin city has not been provided, prompt for one.
    //  */
    // async originStep(stepContext) {
    //     const orderDetails = stepContext.options;

    //     // Capture the response to the previous step's prompt
    //     bookingDetails.destination = stepContext.result;
    //     if (!bookingDetails.origin) {
    //         return await stepContext.prompt(TEXT_PROMPT, { prompt: 'From what city will you be travelling?' });
    //     } else {
    //         return await stepContext.next(bookingDetails.origin);
    //     }
    // }

    // /**
    //  * If a travel date has not been provided, prompt for one.
    //  * This will use the DATE_RESOLVER_DIALOG.
    //  */
    // async travelDateStep(stepContext) {
    //     const bookingDetails = stepContext.options;

    //     // Capture the results of the previous step
    //     bookingDetails.origin = stepContext.result;
    //     if (!bookingDetails.travelDate || this.isAmbiguous(bookingDetails.travelDate)) {
    //         return await stepContext.beginDialog(DATE_RESOLVER_DIALOG, { date: bookingDetails.travelDate });
    //     } else {
    //         return await stepContext.next(bookingDetails.travelDate);
    //     }
    // }

    /**
     * Confirm the information the user has provided.
     */
    async confirmStep(stepContext) {
        const orderDetails = stepContext.options;

        // Capture the results of the previous step
        orderDetails.iceCreamType = stepContext.result;
        const msg = `Please confirm, You want a: ${ orderDetails.iceCreamType }`;

        // Offer a YES/NO prompt.
        return await stepContext.prompt(CONFIRM_PROMPT, { prompt: msg });
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
