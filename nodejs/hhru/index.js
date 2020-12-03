import moment from 'moment'
import axios from 'axios'
import { db } from './db/db.js'

// truncate vacancies table
await db.vacancies.emptyTable()

// drop & create clusters table
await db.clusters.dropTable()
await db.clusters.createTable()


var clusters
var vacancies

await Promise.all([getClusters(), getVacancies()])
  .then(function (results) {
    clusters = results[0]
    vacancies = results[1]
  })

// clusters save into db
for(const c of clusters) {
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

// vacancies save into db
for(const v of vacancies) {
  const vacancy = await getVacancy(v.id)
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
}

// get clusters data from hh.ru
async function getClusters () {  

  const r = await axios({
    url: '/vacancies',
    method: 'get',
    baseURL: 'https://api.hh.ru/',
    headers: { 'User-Agent': 'api-test-agent' },
    params: {
      area: 113, text: '("Data engineer") or ("Инженер данных")',
      clusters: true, per_page: 0
    }
  }).catch(function (error) {
    console.log(error)
  })

  return r.data.clusters
}

// get vacancies data from hh.ru
async function getVacancies () {  

  const r = await axios({
    url: '/vacancies',
    method: 'get',
    baseURL: 'https://api.hh.ru/',
    headers: { 'User-Agent': 'api-test-agent' },
    params: {
      area: 113, text: '("Data engineer") or ("Инженер данных")', per_page: 100
    }
  }).catch(function (error) {
    console.log(error)
  })
  return r.data.items
}

// get vacancy data by id from hh.ru
async function getVacancy (id) {  

  const r = await axios({
    url: `/vacancies/${id}`,
    method: 'get',
    baseURL: 'https://api.hh.ru/',
    headers: { 'User-Agent': 'api-test-agent' },
  }).catch(function (error) {
    console.log(error)
  })
  return r.data
}
