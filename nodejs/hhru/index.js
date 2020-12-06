import moment from 'moment'
import { db } from './db/db.js'
import math from 'math'
import api from './helpers/api.js'

// truncate vacancies table
await db.vacancies.emptyTable()

// drop & create clusters table
await db.clusters.dropTable()
await db.clusters.createTable()

var found_pages

// get clusters from hh.ru
await Promise.all([api.getClusters()])
  .then((r) => {
    for(const c of r[0].clusters) {
      for(const i of c.items) {
        db.clusters.add({
          name: i.name, 
          type: c.name, 
          url: i.url, 
          cnt: i.count
        })
        console.log(`Cluster "${i.name} (${c.name})" saved.`)
      }
    }
    found_pages = math.ceil(parseInt(r[0].found) / 100)
    console.log(`Всего вакансий: ${r[0].found} на ${found_pages} стр.`)
  })
  .catch(err => {
    console.log(err)
  })

// get vacancies & save into db
for(var count = 0; count < found_pages; count++) {
  await new Promise(resolve => setTimeout(resolve, 5000)) // wait 5 secs (ddos guard)
  await Promise.all([api.getVacancies(count)])
    .then((r) => {
      // vacancies save into db
      for(const v of r[0]) {
        Promise.all([api.getVacancy(v.id)])
          .then((r) => {
            const vacancy = r[0]
            db.vacancies.add({
              id: vacancy.id,
              name: vacancy.name, 
              area: vacancy.area, 
              salary: vacancy.salary, 
              type: vacancy.type, 
              experience: vacancy.experience,
              schedule: vacancy.schedule,
              employment: vacancy.employment,
              description: vacancy.description,
              key_skills: vacancy.key_skills,
              employer: vacancy.employer, 
              published_at: vacancy.published_at, 
              created_at: moment(new Date()).utc()
            })
            console.log(`INFO: Vacancy id: ${vacancy.id}, name: "${vacancy.name}" saved.`)
          }) // .then vacancy
          .catch(err => {
            console.log(err)
          }) // .catch
      } // for v
    }) // .then vacancies
    .catch(err => {
      console.log(err)
    })
    .finally(
      console.log('That`s all folks...')
    )
}