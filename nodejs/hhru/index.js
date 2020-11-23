import axios from 'axios'
import { db } from './db/db.js'

Promise.all([getClusters(), getVacancies()])
  .then(function (results) {
    const _clusters = results[0].clusters
    const _vacancies = results[1]

    db.clusters.emptyTable()
    
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
    }

    //console.log(vacancies)
  })

/*
id serial, -- идентификатор кластера
"name" text not null default 'noname'::text, -- имя
"type" text not null default 'notype'::text, -- тип
url text null, -- url
cnt int4 not null default 0, -- количество
*/
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
