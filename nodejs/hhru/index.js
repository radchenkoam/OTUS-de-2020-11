import * as https from 'https'

const hhruURL = new URL('https://api.hh.ru/vacancies');

hhruURL.searchParams.append('area', 113)
hhruURL.searchParams.append('text', '("Data engineer") or ("Инженер данных")')
hhruURL.searchParams.append('clusters', true)
hhruURL.searchParams.append('per_page', 0)

// https://api.hh.ru/vacancies?text=("Data engineer") or ("Инженер данных")&clusters=true&per_page=0&area=113
const options = {
  hostname: 'api.hh.ru',
  port: 443,
  path: '/vacancies',
  method: 'GET',
  headers: { 'User-Agent': 'api-test-agent' }
}

const req = https.request(hhruURL, options, res => {
  console.log(`statusCode: ${res.statusCode}`)
  console.log(`headers:', ${res.headers}`)

  res.on('data', d => {
    process.stdout.write(d)
  })
}).on('error', (e) => {
  console.error(e)
})

req.end()
