const firebase = require('firebase');
const functions = require('firebase-functions');

const qs = require('querystring');
const axios = require('axios');
const _ = require('lodash');
const helpers = require('./helpers');

const moment = require('moment-timezone');
moment.tz.setDefault('Asia/Jerusalem');

const { admins, jenkinsUserToSlack, slackUserToTeams, statuses, entities, slackNotifyUser, getItemTemplate } = helpers;
const { IN_PROGRESS, ABORTED, PENDING } = statuses;

const TODAY = 'today';
const EXCLUDED_DAYS = [4, 5, 6]; // for Thursday to Saturday
const DATE_FORMAT = "YYYY-MM-DD";
const TIME_FORMAT = "YYYY-MM-DD HH:mm:ss";

const firebaseConfig = {
    apiKey: "AIzaSyAEf_59yq3rsihGtRVzndK6E3nVv5BzByE",
    authDomain: "guesty-queue-bot.firebaseapp.com",
    databaseURL: "https://guesty-queue-bot.firebaseio.com",
    storageBucket: "guesty-queue-bot.appspot.com",
};
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const database = firebase.database();

exports.hourly_job = functions.pubsub
  .topic('hourly-tick')
  .onPublish((message) => {
    console.log("This job is run every hour!");
    if (message.data) {
      const dataString = Buffer.from(message.data, 'base64').toString();
      console.log(`Message Data: ${dataString}`);
    }

    return true;
  });

exports.slackAddToQueue = functions.https.onRequest((req, res) => {
    console.log('slackAddToQueue req.body', req.body);

    const { trigger_id } = req.body;
    const dialog = {
        token,
        trigger_id,
        dialog: JSON.stringify({
            title: 'Add to queue',
            callback_id: 'slackAddToQueue',
            submit_label: 'Add',
            elements: [
                {
                    label: 'PR URL',
                    type: 'text',
                    name: 'url',
                    subtype: 'url',
                    placeholder: 'https://github.com/guestyorg/frontend/pull/80',
                    hint: 'Github pull request URL',
                },
                {
                    label: 'Description',
                    type: 'text',
                    name: 'description',
                    optional: true,
                    placeholder: 'New version'
                },
                {
                    label: 'Entity',
                    type: 'select',
                    name: 'entity',
                    options: [...entities],
                },
                {
                    label: 'When?',
                    type: 'select',
                    name: 'day',
                    options: [
                        { label: 'Today', value: 'today' },
                        { label: 'Tomorrow', value: 'tomorrow' },
                    ],
                },
            ],
        }),
    };

    axios.post(`https://slack.com/api/dialog.open`, qs.stringify(dialog))
        .then((result) => {
            console.log('dialog.open: %o', result.data);
            res.send('');
        }).catch((err) => {
            console.log('dialog.open call failed: %o', err);
            res.send('Failed');
        });
});

exports.slackGetQueue = functions.https.onRequest((req, res) => {
    const { user_name: userName, text: entity } = req.body;
    const dayDate = moment().format(DATE_FORMAT);
    const todayWeekDay = moment().isoWeekday();
    const isDeploymentDay = _.isEmpty(_.intersection(EXCLUDED_DAYS, [todayWeekDay]));

    console.log('slackGetQueue req.body', req.body);
    console.log('isDeploymentDay', isDeploymentDay);

    const isEntityExists = entity && entities.find(e => _.isEqual(e.value, entity));

    if(isEntityExists){
        if (isDeploymentDay) {
            const data = {
                userName,
                dayDate,
                entity,
            };

            getQueueTemplate(data).then((answer) => {
                res.send(answer);
            });
        }else{
            const answer = {text:'⛔️ There are no deployments today, contact the VPR&D for approval.', mrkdwn: true};
            res.send(answer)
        }
    }else{
        const answer = {text:'⚠️️ Please add valid *Entity* as argument (i.e `/get_queue mailer`)', mrkdwn: true};
        res.send(answer)
    }
});

exports.slackTriggerAction = functions.https.onRequest((req, res) => {
   const data = JSON.parse(req.body.payload);
   const todayWeekDay = moment().isoWeekday();
   const tomorrowWeekDay = moment().add(1, 'days').isoWeekday();
   const todayDay = moment().format(DATE_FORMAT);
   const { user, submission } = data;

   switch(data.callback_id){
       case 'slackAddToQueue': {
           const { url, description, day, entity } = submission;
           const isDeploymentDay = _.isEmpty(_.intersection(EXCLUDED_DAYS, [day === TODAY ? todayWeekDay : tomorrowWeekDay]));

           console.log('slackAddToQueue - req.body.payload', req.body.payload);
           console.log('isDeploymentDay', isDeploymentDay);

           if (isDeploymentDay) {
               const todayDay = moment().format(DATE_FORMAT);
               const tomorrowDay = moment().add(1, 'days').format(DATE_FORMAT);
               const todayTime = moment().format(TIME_FORMAT);
               const tomorrowTime = moment().add(1, 'days').format(TIME_FORMAT);
               const id = Math.random().toString(36).substr(2, 9);
               const queueItem = {
                   description,
                   user,
                   url,
                   team: slackUserToTeams[user.name],
                   createdAt: day === TODAY ? todayTime : tomorrowTime,
                   entity,
                   status: PENDING,
               };

               console.log('day', day);
               console.log('queueItem', queueItem);

               if (day === TODAY) {
                   database.ref(`${todayDay}/${entity}/${id}`).set({ ...queueItem, id });
                   res.send('');
               } else {
                   database.ref(`${tomorrowDay}/${entity}/${id}`).set({ ...queueItem, addedYesterday: true, id });
                   res.send('');
               }

               slackNotifyUser(user, `✅ You've been added to the queue`, {
                   attachments: [
                       {
                           fields: [
                               {
                                   title: 'PR URL',
                                   value: url,
                               },
                               {
                                   title: 'Entity',
                                   value: entity,
                               },
                               {
                                   title: 'Description',
                                   value: description || 'None provided',
                               },
                               {
                                   title: 'Status',
                                   value: 'Pending',
                                   short: true,
                               },
                               {
                                   title: 'When?',
                                   value: day === TODAY ? 'Today' : 'Tomorrow',
                                   short: true,
                               },
                           ],
                       },
                   ],
               });

           } else {
               slackNotifyUser(user, `⛔️ There are no deployments in this day, contact your team leader`, undefined);
           }
           res.send('')
       }
           break;
       case 'slackRemoveFromQueue': {
           const action = _.head(data.actions);
           const value = action.value.split(' ');
           const queueItemId = value[0];
           const entity = value[1];

           const filterCondition = (item) => _.isEqual(item.id, queueItemId);

           console.log('slackRemoveFromQueue - req.body.payload', req.body.payload);

           database.ref(`${todayDay}/${entity}`).once('value').then(snapshots => {
               const snapshotsData = snapshots.val();

               let text = `⛔️ You don't have permission, contact your team leader`;
               const filteredQueueItem = _.find(snapshotsData, item => filterCondition(item));
               console.log('filteredQueueItem', filteredQueueItem);

               const isAdmin = admins.includes(user.name);
               const userIsOwner = _.isEqual(user.name, filteredQueueItem.user.name);
               const canRemove = (filteredQueueItem && userIsOwner) || isAdmin;

               if (canRemove) {
                   const { id, entity } = filteredQueueItem;
                   const queueItem = database.ref(`${todayDay}/${entity}/${id}`);
                   queueItem.update({ isRemoved: true, deletedBy: user.name });
                   text = '✅ Done';
               }

               const answer = { text };
               res.send(answer)
           });
       }
           break;
       case 'verifyQueueItem':{
           console.log('verifyQueueItem - req.body.payload', req.body.payload);

           const action = _.head(data.actions);
           const value = action.value.split(' ');
           const queueItemId = value[0];
           const entity = value[1];

           const filterCondition = (item) => _.isEqual(item.id, queueItemId);

           database.ref(`${todayDay}/${entity}`).once('value').then( snapshots => {
               const snapshotsData = snapshots.val();

               const addedYesterday =
                   _.chain(snapshotsData)
                       .filter(item => item.addedYesterday && !item.isRemoved)
                       .orderBy(({createdAt}) => moment(createdAt), ['asc'])
                       .value();

               const addedToday =
                   _.chain(snapshotsData)
                       .filter(item => !item.addedYesterday && !item.isRemoved)
                       .orderBy(({createdAt}) => moment(createdAt), ['asc'])
                       .value();

               const mergedArrays = addedYesterday.concat(addedToday);

               const filteredQueueItemIndex = _.findIndex(mergedArrays,item => filterCondition(item));

               const filteredQueueItem = mergedArrays[filteredQueueItemIndex];

               console.log('filteredQueueItem', filteredQueueItem);

               const nextQueue = mergedArrays[filteredQueueItemIndex + 1];
               const userToNotify = nextQueue && nextQueue.user;

               console.log('userToNotify', userToNotify);

               //notify next user
               //TODO: add notified to object
               if(userToNotify){
                   slackNotifyUser(userToNotify, 'The last deployment has been verified! You can continue with your deployment.', {});
               }

               if(filteredQueueItem){
                   const queueItem = database.ref(`${todayDay}/${filteredQueueItem.entity}/${filteredQueueItem.id}`);
                   queueItem.update({ isVerified: true, verifiedBy: user.name });

                   const answer = {
                       text: '✅ Verified'
                   };

                   res.send(answer)
               }else{
                   const answer = {
                       text: '⚠️ Error'
                   };
                   res.send(answer)
               }
           });
       }
           break;
       default:
           break;
   }
});

exports.populateJenkinsData = functions.https.onRequest((req, res) => {
    console.log('populateJenkinsData - req.body', req.body);

    //TODO: add entity from jenkins
    const { BUILD_STATUS, BUILD_URL, BUILD_USER, RELEASE_TYPE, ENTITY } = req.body;

    const todayDay = moment().format(DATE_FORMAT);

    database.ref(`${todayDay}/${ENTITY}`).once('value').then( snapshots => {
        const snapshotsData = snapshots.val();

        const addedYesterday =
            _.chain(snapshotsData)
                .filter(item =>
                    item.addedYesterday &&
                    _.isEqual(item.team, slackUserToTeams[jenkinsUserToSlack[BUILD_USER]]) &&
                    !item.isRemoved
                )
                .value();

        const addedToday =
            _.chain(snapshotsData)
                .filter(item =>
                    !item.addedYesterday &&
                    _.isEqual(item.team, slackUserToTeams[jenkinsUserToSlack[BUILD_USER]]) &&
                    !item.isRemoved
                )
                .value();

        const mergedArrays = addedYesterday.concat(addedToday);

        const queueItemToUpdate = {
            status: BUILD_STATUS,
            buildUrl: BUILD_URL,
            jenkinsUser: BUILD_USER,
            releaseType: RELEASE_TYPE,
        };

        if(_.isEqual(BUILD_STATUS, IN_PROGRESS)){
            const filteredQueueItem =
                _.chain(mergedArrays)
                    .filter(item => [PENDING, ABORTED].includes(item.status))
                    .orderBy(({createdAt}) => moment(createdAt), ['asc'])
                    .head()
                    .value();

            console.log('filteredQueueItem - PENDING', filteredQueueItem);

            if(filteredQueueItem){
                const { id, entity } = filteredQueueItem;
                const queueItem = database.ref(`${todayDay}/${entity}/${id}`);
                console.log('hasQueueItem', !!queueItem);
                queueItem.update(queueItemToUpdate);
            }
        }else{
            const filteredQueueItem =
                _.chain(mergedArrays)
                    .filter(item => _.isEqual(item.status, IN_PROGRESS))
                    .orderBy(({createdAt}) => moment(createdAt), ['asc'])
                    .head()
                    .value();

            console.log('filteredQueueItem - IN_PROGRESS', filteredQueueItem);

            if(filteredQueueItem){
                const { id, entity, user } = filteredQueueItem;
                const queueItem = database.ref(`${todayDay}/${entity}/${id}`);
                console.log('hasQueueItem', !!queueItem);
                queueItem.update({ ...queueItemToUpdate, isVerified: false });
                slackNotifyUser(user, 'Your deployment has been finished, please verify and click on *Verified* button (`/get_queue entity`).', {});
            }
        }
    });
    res.send('OK')
});

function getQueueTemplate({dayDate, userName, entity}){
    return new Promise((resolve, reject) => {
        database.ref(`${dayDate}/${entity}`).once('value').then( snapshots => {
            const snapshotsData = snapshots.val();

            const addedYesterday =
                _.chain(snapshotsData)
                    .filter(item => item.addedYesterday && !item.isRemoved)
                    .orderBy(({createdAt}) => moment(createdAt), ['asc'])
                    .value();

            const addedToday =
                _.chain(snapshotsData)
                    .filter(item => !item.addedYesterday && !item.isRemoved)
                    .orderBy(({createdAt}) => moment(createdAt), ['asc'])
                    .value();

            const mergedArrays = addedYesterday.concat(addedToday);

            console.log('mergedArrays', mergedArrays);

            const attachments = _.map(mergedArrays, item => getItemTemplate({...item, userName}));

            const result = {
                text: `Today's *${entity}* queue:`,
                attachments,
                mrkdwn: true,
            };

            resolve(_.isEmpty(attachments) ? {text:`📭 *${entity}* queue is empty`, mrkdwn: true} : result)
        });
    });
}

/*
function slackChannelNotifier(action, dayDate){
    console.log('slackNotifier triggered');
    const channelId = 'BH395KPRV/AbmHWvpiZytsfrBalMHiHqlQ'; //channel #testtesttest
    // const channelId = 'BHLSFN2H3/hX5kSHhBtm6HSkaJm0JamNYD'; //channel #versions

    getQueueTemplate(action, dayDate, '').then((answer) => {
        axios.post(`https://hooks.slack.com/services/T4MD2AKN2/${channelId}`, answer)
            .then(() => {
                console.log('SUCCEED sending slack message');
            })
            .catch((err) => {
                console.log('ERROR sending slack message', err);
            })
    });
}*/
