import moment from 'moment'
import axios from 'axios'
import { db } from './db/db.js'

Promise.all([getClusters(), getVacancies()])
  .then(function (results) {
    //const _clusters = results[0].clusters
    const _vacancies = results[1].items

    /*db.clusters.emptyTable()
    var _i = 1
    for(const c of _clusters) {
      for(const i of c.items) {
        const _c = {
          name: i.name, 
          type: c.name, 
          url: i.url, 
          cnt: i.count
        }
        db.clusters.add(_c)
        console.log(`Cluster ${_i}: type: ${_c.type}, name: ${_c.name}, cnt: ${_c.cnt}`)
        _i++
      }
    }*/

    // 'id', 'name', 'area', 'salary', 'type', 'employer', 'snippet', 'published_at', 'created_at'
    db.vacancies.emptyTable()

    var _i = 1
    for(const v of _vacancies) {
        const _v = {
          id: v.id,
          name: v.name, 
          area: v.area, 
          salary: v.salary, 
          type: v.type, 
          employer: v.employer, 
          snippet: v.snippet, 
          published_at: v.published_at, 
          created_at: moment(new Date()).utc()
        }
        db.vacancies.add(_v)
        console.log(`Vacancy ${_i}: id: ${v.id}, name: ${v.name}, area: ${v.area}, salary: ${v.salary}, type: ${v.type}, employer: ${v.employer}, snippet: ${v.snippet}, published_at: ${v.published_at}`)
        _i++
    }
  })

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

  return r.data
}

async function getVacancies () {  

  const r = await axios({
    url: '/vacancies',
    method: 'get',
    baseURL: 'https://api.hh.ru/',
    headers: { 'User-Agent': 'api-test-agent' },
    params: {
      area: 113, text: '("Data engineer") or ("Инженер данных")'
    }
  }).catch(function (error) {
    console.log(error)
  })
  return r.data
}
