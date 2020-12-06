import axios from 'axios'

// get clusters data from hh.ru
async function getClusters() {
  const r = await axios({
    method: 'get',
    baseURL: 'https://api.hh.ru/vacancies',
    headers: { 'User-Agent': 'api-test-agent' },
    params: {
      area: 113, text: '("Data engineer") or ("Инженер данных")',
      clusters: true, per_page: 0
    }
  }).catch(function (err) {
    console.log(err)
  })
  return r.data
}

// get vacancies data from hh.ru
async function getVacancies(pageNum) {
  const r = await axios({
    method: 'get',
    baseURL: 'https://api.hh.ru/vacancies',
    headers: { 'User-Agent': 'api-test-agent' },
    params: {
      area: 113, text: '("Data engineer") or ("Инженер данных")',
      page: pageNum, per_page: 100
    }
  }).catch(function (err) {
    console.log(err)
  })
  return r.data.items
}

// get vacancy data by id from hh.ru
async function getVacancy(id) {
  const r = await axios({
    url: `/vacancies/${id}`,
    method: 'get',
    baseURL: 'https://api.hh.ru/',
    headers: { 'User-Agent': 'api-test-agent' },
  }).catch(function (err) {
    console.log(err)
  })
  return r.data
}

export default { getClusters, getVacancies, getVacancy }