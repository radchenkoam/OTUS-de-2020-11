import env from '../env.js'
import promise from 'bluebird'
import pgPromise from 'pg-promise'
import ClustersManager from './models/clusters.js'
import VacanciesManager from './models/vacancies.js'

const initOptions = {
    promiseLib: promise,
    extend(obj) {
        obj.users = new ClustersManager(obj, pgp)
        obj.persons = new VacanciesManager(obj, pgp)
    },
    /*query(e) {
      console.log('QUERY:', e.query);
    }*/
}

const pgp = pgPromise(initOptions)

const cn = {
    host: env.host,
    port: env.port,
    database: env.database,
    user: env.user,
    password: env.password,
    max: 50
        // idleTimeoutMillis: 30000,
        // connectionTimeoutMillis: 2000
}

const db = pgp(cn)

export { db, pgp }