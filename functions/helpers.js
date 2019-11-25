const axios = require('axios');
const _ = require('lodash');

const slackAppToken = 'xoxp-157444359750-220611225393-551922841591-e90d2cd903b44bdc4190f29806a49801'; //OAuth Access Token

const releaseTypes = {
  NORMAL: 'Normal',
};

const teams = {
  BIZ: 'Biz',
  OPS: 'Ops',
  MOBILE: 'Mobile',
  DEMAND_TLV: 'Demand TLV',
  UI_INFRA: 'UI Infra',
  DEVOPS: 'DevOps',
  TIER_3: 'Tier 3',
  DISCOVERY: 'Discovery',
  U_TEAM: 'U-Team',
  PLATFORM: 'Platform',
  ADVENTURE: 'Adventure',
};

// https://api.slack.com/methods/users.list/test
const slackUsers = {
  VASYL_DMYTRIV: 'vasyl',
  KOSTIANTYN_MANKO: 'kostiantyn.manko',
  MARIANO_GERMAN: 'mariano',
  YAEL_SHANI: 'yael.shani',
  OR_MOSHE: 'or.moshe',
  GLEB_VOLODIN: 'gleb',
  VADYM_PADALKO: 'vadym.padalko',
  ILYA_LIBIN: 'ilya.libin',
  DMITRY_YOURKEVICH: 'dmitry',
  OLEG_SHCHERBACHENKO: 'oleg239',
  ARAM: 'aram',
  OREN: 'oren',
  NAJEEB: 'najeeb',
  TIMUR: 'timur',
  BEN_COHEN: 'ben.cohen',
  AVI_OSIPOV: 'avi.osipov',
  VLAD: 'vlad',
  ELAD_NOTI: 'elad.noti',
  MATAN_ROKACH: 'matan',
  DIMA_GROISMAN: 'dima.groisman',
  ALEX: 'alex',
  SASHA: 'sasha',
  LEE_OFRI: 'lee',
  SERGEY_GRINBLAT: 'sergey',
  ANATOLY_UTKIN: 'anatoly',
  ELAD_KREMER: 'eladkrm',
  KOBY_BENTATA_GOLDENBERG: 'koby.bentata',
  ARTEM_ZHMAKIN: 'artem',
  GIL_ORLEV: 'gil.orlev',
  VITALIY_VOZNIAK: 'vitaliy.vozniak',
  MOTTI_DADISON: 'motti',
  EYAL_RONEL: 'eyal',
  ANDREI_SMIRNOV: 'andrei.smirnov',
  AVISHAY_MAOR: 'avishay',
  LENA: 'lena',
  DAVID_FINKELSTEIN: 'david.finkelstein',
  ROMAN_SARABUN: 'roman.sarabun',
  ROMAN_MARSHEVSKYY: 'roman.marshevskyy',
  JONATHAN_YEHIE: 'jonathan.yehie',
  ANDRIY_RYBAK: 'andriy.b',
  SLAVIK: 'slavik',
  MEITAL_WEISS: 'meital',
  NAZAR_LYTVYNENKO: 'nazar.l',
  HAKAM: 'hakam',
  BOHDAN_RUTYLO: 'bohdan',
  SHIR_RAZ: 'shir',
  BEN_DAVID: 'ben.david',
  EREZ_ZOHAR: 'erez',
  DMYTRO_UKOLOV: 'dmytro.ukolov',
  TOMER_BAREKET: 'tomer.bareket',
  BAR_ASHER: 'bar.asher',
  DIMITRY_VISLOV: 'dimitry.vislov',
  MAKSYM_SHPAK: 'maksym.shpak',
  DANYLO_MARKOV: 'danylo',
};

const statuses = {
  SUCCESS: 'SUCCESS',
  UNSTABLE: 'UNSTABLE',
  FAILED: 'FAILURE',
  ABORTED: 'ABORTED',
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
};

const colors = {
  [statuses.SUCCESS]: '#29AF7B',
  [statuses.UNSTABLE]: '#D59531',
  [statuses.FAILED]: '#990000',
  [statuses.ABORTED]: '#000',
  [statuses.PENDING]: '#dfdfdf',
  [statuses.IN_PROGRESS]: '#2fc9ff',
};

// https://jenkinsci.guesty.com/asynchPeople/
const jenkinsUserToSlack = {
  ['Vasyl Dmytriv']: slackUsers.VASYL_DMYTRIV,
  ['Kostiantyn Manko']: slackUsers.KOSTIANTYN_MANKO,
  ['kostiantyn.manko']: slackUsers.KOSTIANTYN_MANKO,
  ['mariano']: slackUsers.MARIANO_GERMAN,
  ['Yael Shani']: slackUsers.YAEL_SHANI,
  ['Or Moshe']: slackUsers.OR_MOSHE,
  ['Vadym Padalko']: slackUsers.VADYM_PADALKO,
  ['Gleb Volodin']: slackUsers.GLEB_VOLODIN,
  ['Ilya Libin']: slackUsers.ILYA_LIBIN,
  ['Dmitry Yourkevich']: slackUsers.DMITRY_YOURKEVICH,
  ['Oleg Shcherbachenko']: slackUsers.OLEG_SHCHERBACHENKO,
  ['Aram Ben Shushan Ehrlich']: slackUsers.ARAM,
  ['najeeb']: slackUsers.NAJEEB,
  ['Oren Elad']: slackUsers.OREN,
  ['Najeeb Guesty']: slackUsers.NAJEEB,
  ['Danylo Markov']: slackUsers.DANYLO_MARKOV,
  ['maksym.shpak']: slackUsers.MAKSYM_SHPAK,
  ['Maksym Shpak']: slackUsers.MAKSYM_SHPAK,
  ['bar.asher']: slackUsers.BAR_ASHER,
  ['Bar Asher']: slackUsers.BAR_ASHER,
  ['Tomer Bareket']: slackUsers.TOMER_BAREKET,
  ['Ben Cohen']: slackUsers.BEN_COHEN,
  ['timur']: slackUsers.TIMUR,
  ['Timur Rozovsky']: slackUsers.TIMUR,
  ['Elad Kremer']: slackUsers.ELAD_KREMER,
  ['koby.bentata']: slackUsers.KOBY_BENTATA_GOLDENBERG,
  ['Koby Bentata']: slackUsers.KOBY_BENTATA_GOLDENBERG,
  ['Dima Groisman']: slackUsers.DIMA_GROISMAN,
  ['Artem Zhmakin']: slackUsers.ARTEM_ZHMAKIN,
  ['Gil Orlev']: slackUsers.GIL_ORLEV,
  ['leeofri']: slackUsers.LEE_OFRI,
  ['Lee Ofri']: slackUsers.LEE_OFRI,
  ['sergrin2']: slackUsers.SERGEY_GRINBLAT,
  ['Sergey Grinblat']: slackUsers.SERGEY_GRINBLAT,
  ['Vitaliy Vozniak']: slackUsers.VITALIY_VOZNIAK,
  ['Motti Dadison']: slackUsers.MOTTI_DADISON,
  ['Eyal Ronel']: slackUsers.EYAL_RONEL,
  ['eyal']: slackUsers.EYAL_RONEL,
  ['Andrei Smirnov']: slackUsers.ANDREI_SMIRNOV,
  ['Avishay Maor']: slackUsers.AVISHAY_MAOR,
  ['avishay']: slackUsers.AVISHAY_MAOR,
  ['lena']: slackUsers.LENA,
  ['davidfinkelstein634']: slackUsers.DAVID_FINKELSTEIN,
  ['David Finkelstein']: slackUsers.DAVID_FINKELSTEIN,
  ['eladkrm']: slackUsers.ELAD_KREMER,
  ['eladnoti']: slackUsers.ELAD_NOTI,
  ['Anatoly Utkin']: slackUsers.ANATOLY_UTKIN,
  ['Roman Sarabun']: slackUsers.ROMAN_SARABUN,
  ['vadym.padalko']: slackUsers.VADYM_PADALKO,
  ['Alexander Ravikovich']: slackUsers.ALEX,
  ['gil.orlev']: slackUsers.GIL_ORLEV,
  ['jonyehie']: slackUsers.JONATHAN_YEHIE,
  ['Andriy Rybak']: slackUsers.ANDRIY_RYBAK,
  ['sasha']: slackUsers.SASHA,
  ['Sasha kruglyak']: slackUsers.SASHA,
  ['motti.dadison']: slackUsers.MOTTI_DADISON,
  ['Matan Rokach']: slackUsers.MATAN_ROKACH,
  ['matan']: slackUsers.MATAN_ROKACH,
  ['slavik']: slackUsers.SLAVIK,
  ['meital']: slackUsers.MEITAL_WEISS,
  ['Meital Weiss']: slackUsers.MEITAL_WEISS,
  ['Nazar Lytvynenko']: slackUsers.NAZAR_LYTVYNENKO,
  ['nazar.l']: slackUsers.NAZAR_LYTVYNENKO,
  ['hakam']: slackUsers.HAKAM,
  ['Bohdan Rutylo']: slackUsers.BOHDAN_RUTYLO,
  ['benehmad']: slackUsers.BEN_COHEN,
  ['sfanty']: slackUsers.SHIR_RAZ,
  ['Shir Raz']: slackUsers.SHIR_RAZ,
  ['Avi Osipov']: slackUsers.AVI_OSIPOV,
  ['Ben David']: slackUsers.BEN_DAVID,
  ['roman.sarabun']: slackUsers.ROMAN_SARABUN,
  ['Roman Marshevskyy']: slackUsers.ROMAN_MARSHEVSKYY,
  ['Vlad Goldman']: slackUsers.VLAD,
  ['Erez Zohar']: slackUsers.EREZ_ZOHAR,
  ['Dmytro Ukolov']: slackUsers.DMYTRO_UKOLOV,
  ['Lena Pavlushko']: slackUsers.LENA,
  ['diminho821']: slackUsers.DIMITRY_VISLOV,
  ['Dimitry Vislov']: slackUsers.DIMITRY_VISLOV,
};

const slackUserToTeams = {
  [slackUsers.VASYL_DMYTRIV]: teams.DISCOVERY,
  [slackUsers.KOSTIANTYN_MANKO]: teams.ADVENTURE,
  [slackUsers.MARIANO_GERMAN]: teams.OPS,
  [slackUsers.YAEL_SHANI]: teams.PLATFORM,
  [slackUsers.OR_MOSHE]: teams.OPS,
  [slackUsers.GLEB_VOLODIN]: teams.BIZ,
  [slackUsers.VADYM_PADALKO]: teams.ADVENTURE,
  [slackUsers.ILYA_LIBIN]: teams.BIZ,
  [slackUsers.DMITRY_YOURKEVICH]: teams.MOBILE,
  [slackUsers.OLEG_SHCHERBACHENKO]: teams.U_TEAM,
  [slackUsers.ARAM]: teams.UI_INFRA,
  [slackUsers.BAR_ASHER]: teams.OPS,
  [slackUsers.NAJEEB]: teams.BIZ,
  [slackUsers.TOMER_BAREKET]: teams.TIER_3,
  [slackUsers.ELAD_NOTI]: teams.OPS,
  [slackUsers.LENA]: teams.OPS,
  [slackUsers.DAVID_FINKELSTEIN]: teams.OPS,
  [slackUsers.TIMUR]: teams.BIZ,
  [slackUsers.AVI_OSIPOV]: teams.BIZ,
  [slackUsers.VLAD]: teams.BIZ,
  [slackUsers.BEN_COHEN]: teams.BIZ,
  [slackUsers.ANDREI_SMIRNOV]: teams.BIZ,
  [slackUsers.MEITAL_WEISS]: teams.BIZ,
  [slackUsers.SHIR_RAZ]: teams.BIZ,
  [slackUsers.DIMITRY_VISLOV]: teams.DEMAND_TLV,
  [slackUsers.ALEX]: teams.DEMAND_TLV,
  [slackUsers.SASHA]: teams.PLATFORM,
  [slackUsers.ELAD_KREMER]: teams.DEMAND_TLV,
  [slackUsers.KOBY_BENTATA_GOLDENBERG]: teams.DEMAND_TLV,
  [slackUsers.GIL_ORLEV]: teams.DEMAND_TLV,
  [slackUsers.BEN_DAVID]: teams.DEMAND_TLV,
  [slackUsers.LEE_OFRI]: teams.PLATFORM,
  [slackUsers.SERGEY_GRINBLAT]: teams.PLATFORM,
  [slackUsers.EYAL_RONEL]: teams.PLATFORM,
  [slackUsers.AVISHAY_MAOR]: teams.UI_INFRA,
  [slackUsers.JONATHAN_YEHIE]: teams.UI_INFRA,
  [slackUsers.HAKAM]: teams.UI_INFRA,
  [slackUsers.ANATOLY_UTKIN]: teams.DEVOPS,
  [slackUsers.DIMA_GROISMAN]: teams.DEVOPS,
  [slackUsers.MOTTI_DADISON]: teams.DEVOPS,
  [slackUsers.SLAVIK]: teams.DEVOPS,
  [slackUsers.MAKSYM_SHPAK]: teams.ADVENTURE,
  [slackUsers.VITALIY_VOZNIAK]: teams.U_TEAM,
  [slackUsers.DMYTRO_UKOLOV]: teams.DISCOVERY,
  [slackUsers.ROMAN_SARABUN]: teams.ADVENTURE,
  [slackUsers.BOHDAN_RUTYLO]: teams.DISCOVERY,
  [slackUsers.ROMAN_MARSHEVSKYY]: teams.DISCOVERY,
  [slackUsers.ARTEM_ZHMAKIN]: teams.ADVENTURE,
  [slackUsers.VADYM_PADALKO]: teams.ADVENTURE,
  [slackUsers.ANDRIY_RYBAK]: teams.ADVENTURE,
  [slackUsers.NAZAR_LYTVYNENKO]: teams.ADVENTURE,
  [slackUsers.DANYLO_MARKOV]: teams.ADVENTURE,
  [slackUsers.MATAN_ROKACH]: teams.MOBILE,
  [slackUsers.EREZ_ZOHAR]: teams.MOBILE,
  [slackUsers.OREN]: teams.OPS,
};

const admins = [
    slackUsers.AVISHAY_MAOR,        //UI Infra
    slackUsers.LEE_OFRI,            //Platform
    slackUsers.AVI_OSIPOV,          //Biz
    slackUsers.BEN_COHEN,           //Biz
    slackUsers.EREZ_ZOHAR,          //Mobile
    slackUsers.SASHA,               //Demand-TLV
    slackUsers.MOTTI_DADISON,       //DevOps
    slackUsers.ANATOLY_UTKIN,       //DevOps
    slackUsers.NAZAR_LYTVYNENKO,    //Adventure
    slackUsers.ROMAN_MARSHEVSKYY,   //Discovery
    slackUsers.OREN,                //OPS
];

const entities = [
  {label: 'admin', value:'admin'},
  {label: 'mailer', value:'mailer'},
  {label: 'pm-website-backend', value:'pm-website-backend'},
  {label: 'webhooks-next', value:'webhooks-next'},
  {label: 'acme', value:'acme'},
  {label: 'availability-pricing', value:'availability-pricing'},
  {label: 'auth', value:'auth'},
  {label: 'guesty-notifications', value:'guesty-notifications'},
  {label: 'guesty-notifications-worker', value:'guesty-notifications-worker'},
  {label: 'guesty-forms', value:'guesty-forms'},
  {label: 'user-generated-content', value:'user-generated-content'},
  {label: 'xml-storage', value:'xml-storage'},
  {label: 'outgoing', value:'outgoing'},
  {label: 'multiplexer-worker', value:'multiplexer-worker'},
  {label: 'response-worker', value:'response-worker'},
  {label: 'queue-metrics', value:'queue-metrics'},
  {label: 'booking-com', value:'booking-com'},
  {label: 'creditguard', value:'creditguard'},
  {label: 'agoda-incoming-worker', value:'agoda-incoming-worker'},
  {label: 'agoda-mock-response-server', value:'agoda-mock-response-server'},
  {label: 'agoda-outgoing', value:'agoda-outgoing'},
  {label: 'agoda-outgoing-worker', value:'agoda-outgoing-worker'},
  {label: 'agoda-schedulers', value:'agoda-schedulers'},
  {label: 'airbnb-incoming-worker', value:'airbnb-incoming-worker'},
  {label: 'airbnb-outgoing-worker', value:'airbnb-outgoing-worker'},
  {label: 'airbnb2-schedulers', value:'airbnb2-schedulers'},
  {label: 'bookingcom-incoming-worker', value:'bookingcom-incoming-worker'},
  {label: 'bookingcom-outgoing-worker', value:'bookingcom-outgoing-worker'},
  {label: 'homeaway-incoming-worker', value:'homeaway-incoming-worker'},
  {label: 'homeaway-outgoing-worker', value:'homeaway-outgoing-worker'},
  {label: 'homeaway2-schedulers', value:'homeaway2-schedulers'},
  {label: 'tripadvisor-incoming-puller', value:'tripadvisor-incoming-puller'},
  {label: 'tripadvisor-incoming-worker', value:'tripadvisor-incoming-worker'},
  {label: 'tripadvisor-outgoing-worker', value:'tripadvisor-outgoing-worker'},
  {label: 'tripadvisor-schedulers', value:'tripadvisor-schedulers'},
  {label: 'email', value:'email'},
  {label: 'facade', value:'facade'},
  {label: 'incoming', value:'incoming'},
  {label: 'incoming-listener', value:'incoming-listener'},
  {label: 'integration', value:'integration'},
  {label: 'integration-worker', value:'integration-worker'},
  {label: 'reservation-timeline', value:'reservation-timeline'},
  {label: 'safety-checks', value:'safety-checks'},
  {label: 'push-notifications', value:'push-notifications'},
  {label: 'demo-account', value:'demo-account'},
  {label: 'currencies', value:'currencies'},
  {label: 'airbnb-real-time-rates-availability', value:'airbnb-real-time-rates-availability'},
  {label: 'agoda-proxy', value:'agoda-proxy'},
  {label: 'agoda-incoming-listener', value:'agoda-incoming-listener'},
  {label: 'homeaway-real-time-rates-availability', value:'homeaway-real-time-rates-availability'},
  {label: 'communication', value:'communication'},
  {label: 'communication-worker', value:'communication-worker'},
  {label: 'permissions', value:'permissions'}
];

const jobCompleteStatuses = [statuses.FAILED, statuses.SUCCESS, statuses.UNSTABLE];

const getCurrentQueueItemDesc = (status, isVerified) => {
  if(jobCompleteStatuses.includes(status) &&
      !_.isUndefined(isVerified) &&
      !isVerified){
    return '- *Waiting for verification*'
  }else if(status === statuses.IN_PROGRESS){
    return '- *Deployment in Progress...*'
  }else{
    return '';
  }
};

const getItemTemplate = ({user, id, status, team, buildUrl, description, url, isVerified, userName, entity}) => {
  const { PENDING, ABORTED } = statuses;

  const allowRemove =
      (admins.includes(userName) || _.isEqual(user.name, userName )) &&
      [PENDING, ABORTED].includes(status);

  const showVerifiedButton =
      jobCompleteStatuses.includes(status) &&
      !_.isUndefined(isVerified) &&
      !isVerified &&
      _.isEqual(slackUserToTeams[userName], team);

  const queueDescription = getCurrentQueueItemDesc(status, isVerified);

  const text = `${isVerified ? '*~'+team+'~*' : '*'+team+'*'} (<@${user.name}>) ${queueDescription} \nGithub URL: ${url} ${description ? '\nDescription: ' + description : ''} ${buildUrl ? '\nBuild URL: <'+buildUrl+'|Go to Jenkins>' : ''}`;
  const color = colors[status];
  const mrkdwn_in = ["text"];

  let template = {
    text,
    color,
    mrkdwn_in
  };

  const allowRemoveProperties = {
    callback_id: "slackRemoveFromQueue",
    actions: [
      {
        name: "remove",
        text: "Remove",
        type: "button",
        value: `${id} ${entity}`
      }
    ]
  };

  const verifiedProperties = {
    callback_id: "verifyQueueItem",
    actions: [
      {
        name: "verified",
        text: "Verified",
        type: "button",
        value: `${id} ${entity}`
      }
    ]
  };

  if(allowRemove){
    template = {...template, ...allowRemoveProperties};
  }

  if(showVerifiedButton){
    template = {...template, ...verifiedProperties};
  }

  return template;
};

const slackNotifyUser = ({id, name}, text, additionalFields) => {

  const URL = 'https://slack.com/api/chat.postMessage';

  let config = {
    headers: {
      ContentType: 'application/json',
      Authorization: `Bearer ${slackAppToken}`,
    }
  };

  let data = {
    text: `Hello <@${name}>! \n${text}`,
    channel: id,
    ...additionalFields,
  };

  console.log('Sending message to Slack...');

  axios.post(URL, data, config).then(() => {
    console.log(`SUCCEED sending slack message to ${name}`);
  })
  .catch((err) => {
    console.log('ERROR sending slack message', err);
  })
};

module.exports = {
  releaseTypes,
  jenkinsUserToSlack,
  statuses,
  slackUserToTeams,
  admins,
  entities,
  getItemTemplate,
  slackNotifyUser,
};