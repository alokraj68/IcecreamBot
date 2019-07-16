// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const {
    LuisRecognizer
} = require('botbuilder-ai');

class LuisHelper {
    /**
     * Returns an object with preformatted LUIS results for the bot's dialogs to consume.
     * @param {*} logger
     * @param {TurnContext} context
     */
    static async executeLuisQuery(logger, context) {
        const IceCreamDetails = {};

        try {
            const recognizer = new LuisRecognizer({
                applicationId: process.env.LuisAppId,
                endpointKey: process.env.LuisAPIKey,
                endpoint: `https://${ process.env.LuisAPIHostName }`
            }, {}, true);

            const recognizerResult = await recognizer.recognize(context);

            const intent = LuisRecognizer.topIntent(recognizerResult);

            IceCreamDetails.intent = intent;

            if (intent === 'Book_Ice_cream') {
                // We need to get the result from the LUIS JSON which at every level returns an array
                IceCreamDetails.iceCreamType = LuisHelper.parseCompositeEntity(recognizerResult, 'Icecream', 'IcecreamType');
                IceCreamDetails.iceCreamSize = LuisHelper.parseCompositeEntity(recognizerResult, 'Icecream', 'IcecreamSize');
            }
        } catch (err) {
            logger.warn(`LUIS Exception: ${ err } Check your LUIS configuration`);
        }
        return IceCreamDetails;
    }

    static parseCompositeEntity(result, compositeName, entityName) {
        const compositeEntity = result.entities[compositeName];
        if (!compositeEntity || !compositeEntity[0]) return undefined;
        for (const [key, value] of Object.entries(compositeEntity)) {
            console.log(`key: ${key}, value: ${JSON.stringify(value)}`)
            if (value[entityName]) {
                const entityValue = value[entityName][0][0];
                return entityValue;
            }
        }
    }

}

module.exports.LuisHelper = LuisHelper;