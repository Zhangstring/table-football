import axios from 'axios'

const request = axios.create({
  baseURL: 'http://118.31.66.155:7310/api/',
  timeout: 60000
})

export default request
