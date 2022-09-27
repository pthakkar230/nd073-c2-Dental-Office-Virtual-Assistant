// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, MessageFactory } = require('botbuilder');

const { QnAMaker } = require('botbuilder-ai');
const DentistScheduler = require('./dentistscheduler');
const IntentRecognizer = require("./intentrecognizer")

const BOT_FUNCTION_STRING = "I can help you get the availability at the dental office, schedule appointments, and answer any questions about our practice."

class DentaBot extends ActivityHandler {
    constructor(configuration, qnaOptions) {
        // call the parent constructor
        super();
        if (!configuration) throw new Error('[QnaMakerBot]: Missing parameter. configuration is required');

        // create a QnAMaker connector
        this.QnAMaker = new QnAMaker(configuration.QnAConfiguration, qnaOptions)
       
        // create a DentistScheduler connector
        this.DentistScheduler = new DentistScheduler(configuration.SchedulerConfiguration)
      
        // create a IntentRecognizer connector
        this.IntentRecognizer = new IntentRecognizer(configuration.LuisConfiguration)


        this.onMessage(async (context, next) => {
            // send user input to QnA Maker and collect the response in a variable
            // don't forget to use the 'await' keyword
          
            // send user input to IntentRecognizer and collect the response in a variable
            // don't forget 'await'
                     
            // determine which service to respond with based on the results from LUIS //

            // if(top intent is intentA and confidence greater than 50){
            //  doSomething();
            //  await context.sendActivity();
            //  await next();
            //  return;
            // }
            // else {...}

            const qnaResults = await this.QnAMaker.getAnswers(context);

            const LuisResult = await this.IntentRecognizer.executeLuisQuery(context);

            if (LuisResult.luisResult.prediction.topIntent === "ScheduleAppointment" &&
            LuisResult.intents.ScheduleAppointment.score > .6 &&
            LuisResult.entities.$instance &&
            LuisResult.entities.$instance.datetime &&
            LuisResult.entities.$instance.datetime[0]) {
                const datetime = LuisResult.entities.$instance.datetime[0].text;
                const response = await this.DentistScheduler.scheduleAppointment(datetime);
                await context.sendActivity(response);
            } else if (LuisResult.luisResult.prediction.topIntent === "GetAvailability" && LuisResult.intents.GetAvailability.score > .6) {
                const response = await this.DentistScheduler.getAvailability();
                await context.sendActivity(response);
            } else if (qnaResults[0]) {
                await context.sendActivity(`${qnaResults[0].answer}`)
            } else {
                await context.sendActivity("I'm not sure I can answer your question." + BOT_FUNCTION_STRING)
            }


             
            await next();
    });

        this.onMembersAdded(async (context, next) => {
        const membersAdded = context.activity.membersAdded;
        //write a custom greeting
        const welcomeText = 'Welcome! ' + BOT_FUNCTION_STRING;
        for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
            if (membersAdded[cnt].id !== context.activity.recipient.id) {
                await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
            }
        }
        // by calling next() you ensure that the next BotHandler is run.
        await next();
    });
    }
}

module.exports.DentaBot = DentaBot;
