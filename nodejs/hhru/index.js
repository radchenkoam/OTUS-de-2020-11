import moment from 'moment'
import { db } from './db/db.js'
import math from 'math'
import api from './helpers/api.js'
import htmlToText from 'html-to-text'

// truncate vacancies table
await db.vacancies.emptyTable()

// drop & create clusters table
await db.clusters.dropTable()
await db.clusters.createTable()

var found_pages
var vacancy_ids_list = []

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

// get vacancies ids
for(var count = 0; count < found_pages; count++) {
  await Promise.all([api.getVacancies(count)])
  .then((r) => {
    for (const v of r[0]) {
      vacancy_ids_list.push(v.id)
    }    
  })
  .catch(err => {
    console.log(err)
  })
}

// vacancies save into db
for(const id of vacancy_ids_list) {
  const vacancy = await api.getVacancy(id)
  db.vacancies.add({
    id: vacancy.id,
    name: vacancy.name, 
    area: vacancy.area, 
    salary: vacancy.salary, 
    type: vacancy.type, 
    experience: vacancy.experience,
    schedule: vacancy.schedule,
    employment: vacancy.employment,
    description: htmlToText.htmlToText(vacancy.description),
    key_skills: JSON.stringify(vacancy.key_skills),
    employer: vacancy.employer, 
    published_at: vacancy.published_at, 
    created_at: moment(new Date()).utc()
  })
  .catch((err) => {
    console.log(err)
    }    
  )
  console.log(`INFO: Vacancy id: ${vacancy.id}, name: "${vacancy.name}`)
}
