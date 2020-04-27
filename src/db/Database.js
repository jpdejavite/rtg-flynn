const admin = require('firebase-admin');

const { EnvVar, EnvVarKeys } = require('../config/EnvVar');

const { Config, ConfigKeys } = require('../config/Config');
const { GlobalConfig } = require('../config/GlobalConfig');

class Database {
  constructor() {
    this.dbs = {
      config: null,
      flynn: null,
    };
  }

  connectToConfig() {
    const serviceAccount = EnvVar.get(EnvVarKeys.FIREBASE_CREDENTIAL);
    this.dbs.config = admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(Buffer.from(serviceAccount, 'base64').toString())),
    }, 'config');
  }

  connectToFlynn() {
    this.dbs.flynn = admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(Config.get(ConfigKeys.DATABASE_CONFIG))),
    }, 'flynn');
  }

  getFlynn() {
    return this.dbs.flynn;
  }

  async loadConfigs() {
    const db = this.dbs.config.firestore();
    const configsDoc = await db.collection('configs').doc('flynn').get();
    if (!configsDoc || !configsDoc.data()) {
      throw new Error('flynn configs missing');
    }
    Config.loadAll(configsDoc.data());

    const globalConfigsDoc = await db.collection('configs').doc('global').get();
    if (!globalConfigsDoc || !globalConfigsDoc.data()) {
      throw new Error('global configs missing');
    }
    GlobalConfig.loadAll(globalConfigsDoc.data());
  }
}

module.exports = { Database };
