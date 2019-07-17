// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.


const {
    ConfirmPrompt,
    TextPrompt,
    WaterfallDialog,
    NumberPrompt,
} = require('botbuilder-dialogs');
const {
    CancelAndHelpDialog
} = require('./cancelAndHelpDialog');
const {
    Common
} = require('../helper/common');


const CONFIRM_PROMPT = 'confirmPrompt';
const TEXT_PROMPT = 'textPrompt';
const NUMBER_PROMPT = 'NUMBER_PROMPT';
const WATERFALL_DIALOG = 'waterfallDialog';

class OrderDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'orderDialog');

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new NumberPrompt(NUMBER_PROMPT, this.quantityPromptValidator))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.icecreamTypeStep.bind(this),
                this.icecreamSizeStep.bind(this),
                this.askForQuantity.bind(this),
                this.getQuantity.bind(this),
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

    async askForQuantity(stepContext) {
        const orderDetails = stepContext.options;
        // Capture the results of the previous step
        if (orderDetails.iceCreamType.toLowerCase().trim() == "cone") {
            orderDetails.iceCreamSize = stepContext.result;
        }
        if (!orderDetails.iceCreamQuantity) {
            // We can send messages to the user at any point in the WaterfallStep.
            await stepContext.context.sendActivity(`Yummy! I will ask the humans to prepare your ${Common.toTitleCase( orderDetails.iceCreamType) } icecream.`);

            // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
            return await stepContext.prompt(CONFIRM_PROMPT, `Do you want more than one ${Common.toTitleCase(orderDetails.iceCreamType)}?`, ['yes', 'no']);
        } else {
            return await stepContext.next(orderDetails.iceCreamQuantity);
        }
    }

    async getQuantity(stepContext) {
        const orderDetails = stepContext.options;
        if (!orderDetails.iceCreamQuantity) {
            if (stepContext.result) {
                // User said "yes" so we will be prompting for the quantity.
                // WaterfallStep always finishes with the end of the Waterfall or with another dialog, here it is a Prompt Dialog.
                const promptOptions = {
                    prompt: `Please enter how many ${Common.toTitleCase(orderDetails.iceCreamType)} you need. I can get you a maximum of 20 ice creams`,
                    retryPrompt: 'I can get you a maximum of 20 ice creams. Please enter again.'
                };

                return await stepContext.prompt(NUMBER_PROMPT, promptOptions);
            } else {
                // User said "no" so we will skip the next step. Give -1 as the age.
                return await stepContext.next(-1);
            }
        } else {
            return await stepContext.next(orderDetails.iceCreamQuantity);
        }
    }

    /**
     * Confirm the information the user has provided.
     */
    async confirmStep(stepContext) {
        const orderDetails = stepContext.options;

        // Capture the results of the previous step
        orderDetails.iceCreamQuantity = stepContext.result;

        //composing message. Not using ternary operator for readability reasons
        var msg = "";
        msg += `Please confirm, \n You want ${(orderDetails.iceCreamQuantity>1)?orderDetails.iceCreamQuantity:"a"}`;
        if (orderDetails.iceCreamType.toLowerCase().trim() == "cone") {
            var Price = Common.price(orderDetails.iceCreamType.toLowerCase().trim(), orderDetails.iceCreamSize.toLowerCase().trim(), orderDetails.iceCreamQuantity);

            msg += ` ${Common.toTitleCase(orderDetails.iceCreamSize) } ${ Common.toTitleCase(orderDetails.iceCreamType) } ice cream. \n It will cost you ${Price}`;

        } else {
            var Price = Common.price(orderDetails.iceCreamType.toLowerCase().trim(), "", orderDetails.iceCreamQuantity);

            msg += ` ${ Common.toTitleCase(orderDetails.iceCreamType) } ice cream.\n It will cost you ${Price}`;
        }

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

    async quantityPromptValidator(promptContext) {
        // This condition is our validation rule. You can also change the value at this point.
        return promptContext.recognized.succeeded && promptContext.recognized.value > 0 && promptContext.recognized.value <= 20;
    }
}

module.exports.OrderDialog = OrderDialog;