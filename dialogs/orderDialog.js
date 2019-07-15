// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const {
    TimexProperty
} = require('@microsoft/recognizers-text-data-types-timex-expression');
const {
    ConfirmPrompt,
    TextPrompt,
    WaterfallDialog
} = require('botbuilder-dialogs');
const {
    CancelAndHelpDialog
} = require('./cancelAndHelpDialog');
const {
    DateResolverDialog
} = require('./dateResolverDialog');

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
     * If an origin city has not been provided, prompt for one.
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
        if (orderDetails.iceCreamType.toLowerCase().trim() == "cone") {
            orderDetails.iceCreamSize = stepContext.result;
        } else {
            orderDetails.iceCreamType = stepContext.result;
        }

        const msg = (orderDetails.iceCreamType.toLowerCase().trim() == "cone") ? `Please confirm, You want a  ${ toCamelCase(orderDetails.iceCreamSize) }  ${ toCamelCase(orderDetails.iceCreamType) } ice cream` : `Please confirm, You want a: ${ toCamelCase(orderDetails.iceCreamType) } ice cream`;

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

function toCamelCase(str) {
    // Lower cases the string
    return str.toLowerCase()
        // Replaces any - or _ characters with a space 
        .replace(/[-_]+/g, ' ')
        // Removes any non alphanumeric characters 
        .replace(/[^\w\s]/g, '')
        // Uppercases the first character in each group immediately following a space 
        // (delimited by spaces) 
        .replace(/ (.)/g, function ($1) {
            return $1.toUpperCase();
        })
    //   // Removes spaces 
    //   .replace( / /g, '' );
}

module.exports.OrderDialog = OrderDialog;