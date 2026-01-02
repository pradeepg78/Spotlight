import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    //in the format of MIME; type, subtype
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

//error handling, runs on every response from the server
//.interceptors -> acess interceptor
//.response -> response interceptor (not a request interceptor)
//.use -> register a new interceptor
apiClient.interceptors.response.use(
    //first function -> sucess handler
        //if sucess, just passes the response through unchanged n returns response
    (response) => response,
    //second function -> error handler
        //it runs when the request fails, logs the error, then throws it
    (error) => {
        //error.response -> status of the error
        //.data -> {message : ' ... ', error: ' ... ' }
        console.error('API Error:', error.response?.data || error.message);
        //rethrow the error
            //passes the error to the catch block, so it can be handled
        return Promise.reject(error);
  }
);