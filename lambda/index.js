/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/
/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills
 * nodejs skill development kit.
 * This sample supports multiple lauguages. (en-US, en-GB, de-DE).
 * The Intent Schema, Custom Slots and Sample Utterances for this skill, as well
 * as testing instructions are located at https://github.com/alexa/skill-sample-nodejs-fact
 **/


'use strict';
const Alexa = require('alexa-sdk');
const axios = require('axios');
const saveBooking = require('./alexRequests').saveBooking;
const getAvailableDates = require('./alexRequests').getAvailableDates;
const getAvailableTimes = require('./alexRequests').getAvailableTimes;
const makeBooking = require('./alexRequests').makeBooking;
const getAvailableServices = require('./alexRequests').getAvailableServices;

//=========================================================================================================================================
//TODO: The items below this comment need your attention.
//=========================================================================================================================================

//Replace with your app ID (OPTIONAL).  You can find this value at the top of your skill's page on http://developer.amazon.com.
//Make sure to enclose your value in quotes, like this: const APP_ID = 'amzn1.ask.skill.bb4045e6-b3e8-4133-b650-72923c5980f1';
const APP_ID = undefined;

const SKILL_NAME = 'appointment manager';
//const GET_FACT_MESSAGE = "Here's your fact: ";
const HELP_MESSAGE = 'You can say <break strength="strong"/> book appointment at bobs, or, you can say exit?';
const HELP_REPROMPT = 'What can I help you with?';
const STOP_MESSAGE = 'Goodbye!';

//=========================================================================================================================================
//TODO: Replace this data with your own.  You can find translations of this data at http://github.com/alexa/skill-sample-node-js-fact/data
//=========================================================================================================================================
// const data = [
//     'A year on Mercury is just 88 days long.',
//     'Despite being farther from the Sun, Venus experiences higher temperatures than Mercury.',
//     'Venus rotates counter-clockwise, possibly because of a collision in the past with an asteroid.',
//     'On Mars, the Sun appears about half the size as it does on Earth.',
//     'Earth is the only planet not named after a god.',
//     'Jupiter has the shortest day of all the planets.',
//     'The Milky Way galaxy will collide with the Andromeda Galaxy in about 5 billion years.',
//     'The Sun contains 99.86% of the mass in the Solar System.',
//     'The Sun is an almost perfect sphere.',
//     'A total solar eclipse can happen once every 1 to 2 years. This makes them a rare event.',
//     'Saturn radiates two and a half times more energy into space than it receives from the sun.',
//     'The temperature inside the Sun can reach 15 million degrees Celsius.',
//     'The Moon is moving approximately 3.8 cm away from our planet every year.',
// ];

//=========================================================================================================================================
//Editing anything below this line might break your skill.
//=========================================================================================================================================

const handlers = {
    'LaunchRequest': function () {
        const output = "Welcome to Godaddy's Appointment Manager, How can i help you today?"
        this.response.speak(output).listen()
        this.response.cardRenderer(output)
        // this.emitWithState('PlanMyTripIntent')
        this.emit(':responseReady')
        // this.emit('PlanMyTripIntent');
    },

    'appointmentEntryIntent' : function() {
        let domainPharse = this.event.request.intent.slots.domainPhrase.value
        var output = 'Welcome to appointments services at bodyandmind2.com.';
        this.response.speak(output);

        var self = this;
        var speechOutput = output + '<break strength="strong"/> The services available are ...'
        getAvailableServices(function(serverRes) {
            console.log("********************")
            console.log(serverRes)
            console.log("********************")
            var serviceObjects = serverRes.data.results
            serviceObjects.forEach(function(serviceR){
                var name = serviceR.name;
                speechOutput = speechOutput.concat(name+' <break strength="strong"/>')
            });
            speechOutput = speechOutput.concat('. <break strength="strong"/>Which service do you want to select?')
            self.response.speak(speechOutput).listen();
            self.response.cardRenderer(SKILL_NAME, speechOutput);
            self.emit(':responseReady');
        })
    },
    'chooseServiceIntent': function() {
        var self = this;
        getAvailableDates(1184233, '2018-07-25T10%3A00%3A00-07%3A00', '2018-07-31T23%3A59%3A59-07%3A00', function(serverRes) {
            console.log("********************")
            console.log(serverRes)
            console.log("********************")

            var response = 'For the meditation service.<break strength="strong"/> The available dates are '

            var listAvailableDates = serverRes.data.available_dates.slice(0,3)
            listAvailableDates.forEach(function(date){
                var dateOnly = date.split('T')[0]
                var md = dateOnly.split('-')
                md = md[1] + '/' + md[2]
                response = response.concat('<say-as interpret-as="date" format="md">' + md + '</say-as> ')
            });

            self.response.cardRenderer(SKILL_NAME, response);
            self.response.speak(response).listen();
            self.emit(':responseReady');
        })
    },

    'PlanAppointmentDateIntent': function () {
        var bookDate, bookTime
        if (this.event.request.intent.slots.bookingDate.value){
            this.event.session.attributes['bookDate'] = this.event.request.intent.slots.bookingDate.value;
            bookDate = this.event.request.intent.slots.bookingDate.value
        }
        else{
            bookDate = this.event.session.attributes['bookDate']
        }

        var startTime = bookDate + 'T10%3A59%3A59-07%3A00';
        var endTime =   bookDate + 'T17%3A59%3A59-07%3A00';
        var speechOutput = ''
        var self = this;

        getAvailableTimes(1184233, startTime, endTime, function(serverRes) {
            var availableTimes = serverRes.data.availability_times
            var speechOutput = 'The available time slots for <say-as interpret-as="date" format="ymd">' + bookDate + '</say-as> are '

            var count = 0
            availableTimes.forEach(function(time){
                var timeOnly = time.split('T')[1]
                timeOnly = timeOnly.slice(0,timeOnly.length - 4)
                var tempSpeech = '<say-as interpret-as="time">' + timeOnly + '</say-as>'
                speechOutput = speechOutput.concat(tempSpeech)
                count += 1
                if (count > 2){
                    self.response.speak(speechOutput).listen();
                    self.response.cardRenderer(SKILL_NAME, speechOutput);
                    self.emit(':responseReady');
                }
            });

            self.response.speak(speechOutput).listen();
            self.response.cardRenderer(SKILL_NAME, speechOutput);
            self.emit(':responseReady');
        })
    },
    'PlanAppointmentTimeIntent': function() {
        var bookDate, bookTime
        bookDate = this.event.session.attributes['bookDate']
        bookTime = this.event.request.intent.slots.bookingTime.value
        var self = this;


        makeBooking(bookDate + 'T' + bookTime + '.000Z', function (res) {
            const speechOutput = 'We have booked an ' + res.service.name + ' appointment for ' + res.client.first_name  + ' on <say-as interpret-as="date" format="md">' + bookDate + '</say-as> at <say-as interpret-as="time">' + bookTime + '</say-as>'

            self.response.speak(speechOutput).listen();
            self.response.cardRenderer(SKILL_NAME, speechOutput);
            self.emit(':responseReady');
        })


    },
    'GetAvailableServices': function () {
        var self = this;
        var speechOutput = 'The services available are ...'
        getAvailableServices(function(serverRes) {
            console.log("********************")
            console.log(serverRes)
            console.log("********************")
            var serviceObjects = serverRes.data.results
            serviceObjects.forEach(function(serviceR){
                var name = serviceR.name;
                speechOutput = speechOutput.concat(name+', <break strength="strong"/>')
            });
            self.response.speak(speechOutput).listen();
            self.response.cardRenderer(SKILL_NAME, speechOutput);
            self.emit(':responseReady');
        })
    },
    'GetDatesIntent': function() {
        var reprompt = 'What date you want me to book'
        var bookingDate = this.event.request.intent.slots.date.value

        //const respomnse = 'Your appointment has been  booked for ' + bookDate + ' on ' + bookTime
        const availableDates = {"available_dates":["2018-07-25","2018-07-26T16:00:00.000Z",
                "2018-07-27T16:00:00.000Z","2018-07-28T16:00:00.000Z","2018-07-29T16:00:00.000Z","2018-07-30T16:00:00.000Z",
                "2018-07-31T16:00:00.000Z"]}

        const availableTimes = {"availability_times":["2018-07-24T17:00:00.000Z","2018-07-24T17:30:00.000Z","2018-07-24T18:00:00.000Z",
                "2018-07-24T18:30:00.000Z","2018-07-24T19:00:00.000Z","2018-07-24T19:30:00.000Z","2018-07-24T20:00:00.000Z",
                "2018-07-24T20:30:00.000Z","2018-07-24T21:00:00.000Z","2018-07-24T21:30:00.000Z","2018-07-24T22:00:00.000Z",
                "2018-07-24T22:30:00.000Z","2018-07-24T23:00:00.000Z"]}

        // scenario 1
        var speechOutput = 'The available dates for ' + bookingDate + ' are '
        var listAvailableDates = availableDates['available_dates'].slice(0,3)
        listAvailableDates.forEach(function(date){
            var dateOnly = date.split('T')[0]
            var md = dateOnly.split('-')
            md = md[1] + '/' + md[2]
            speechOutput = speechOutput.concat('<say-as interpret-as="date" format="md">' + md + '</say-as>')
        });
        //listen to the selected date
        //call to get available time
        //listen to the selected time
        //majke the appointment
        this.response.speak(speechOutput).listen();
        this.response.cardRenderer(SKILL_NAME, speechOutput);
        this.emit(':responseReady');
    },
    'timeSlotsNotPresent': function () {
        var self = this;
        getAvailableDates(1184233, '2018-07-25T10%3A00%3A00-07%3A00', '2018-07-31T23%3A59%3A59-07%3A00', function(serverRes) {
            console.log("********************")
            console.log(serverRes)
            console.log("********************")

            var response = 'Well <break strength="strong"/> How about these dates then?'

            var listAvailableDates = serverRes.data.available_dates.slice(0,3)
            listAvailableDates.forEach(function(date){
                var dateOnly = date.split('T')[0]
                var md = dateOnly.split('-')
                md = md[1] + '/' + md[2]
                response = response.concat('<say-as interpret-as="date" format="md">' + md + '</say-as> ')
            });

            self.response.cardRenderer(SKILL_NAME, response);
            self.response.speak(response).listen();
            self.emit(':responseReady');
        })
    },
    'thankYouIntent': function () {
        const response = "No Mention, Its pleasure to serve you."
        this.response.speak(response);
        //this.response.cardRenderer(SKILL_NAME, speechOutput);

        this.emit(':responseReady');
    },
    'PlanMyBookingIntent': function () {
        const response = 'Dummy'
        this.response.speak(response).listen()
        this.response.cardRenderer(SKILL_NAME, response);
        this.emit(':responseReady');
    },
    'MakeAppointmentIntent':function () {
        const response = this.event.request.intent.slots.activity.value
        //const response = 'dummy'
        this.response.speak(response).listen()
        this.response.cardRenderer(SKILL_NAME, response);
        this.emit(':responseReady');
    },
    'AMAZON.HelpIntent': function () {
        const speechOutput = HELP_MESSAGE;
        const reprompt = HELP_REPROMPT;

        this.response.speak(speechOutput).listen(reprompt);
        this.emit(':responseReady');
    },
    'AMAZON.CancelIntent': function () {
        this.response.speak(STOP_MESSAGE);
        this.emit(':responseReady');
    },
    'AMAZON.StopIntent': function () {
        this.response.speak(STOP_MESSAGE);
        this.emit(':responseReady');
    },
};

exports.handler = function (event, context, callback) {
    const alexa = Alexa.handler(event, context, callback);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};
