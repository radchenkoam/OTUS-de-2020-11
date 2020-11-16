import * as https from 'https'

const hhruURL = new URL('https://api.hh.ru/vacancies')
const hhruHeaders = { headers: { 'User-Agent': 'api-test-agent' } }
hhruURL.search = new URLSearchParams(getQueryClusters())
//hhruURL.search = new URLSearchParams(getQueryVacancies())

// https://api.hh.ru/vacancies?text=("Data engineer") or ("Инженер данных")&clusters=true&per_page=0&area=113
const req = https.request(hhruURL, hhruHeaders, function (res) {
    console.log(`statusCode: ${res.statusCode}`)
    console.log(`headers:', ${res.headers}`)
    try {
      var data = ''
      
      res.on('data', d => {
        data += d
      })
      
      res.on('end', () => {
        data = JSON.parse(data)
        console.log('data ', data)
      })
    } catch (error) {
      console.error(error);
    }
  })
req.end();

// console.log('hhruURL: ', hhruURL)

// Generator functions
function* getQueryClusters() {
  yield ['area', '113']
  yield ['text', '("Data engineer") or ("Инженер данных")']
  yield ['clusters', 'true']
  yield ['per_page', '0']
}

function* getQueryVacancies() {
  yield ['area', '113']
  yield ['text', '("Data engineer") or ("Инженер данных")']
}